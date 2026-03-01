import fs from "fs";
import { XMLParser } from "fast-xml-parser";
import { METADATA_CACHE_PATH } from "./config.js";

const METADATA_ENDPOINT = "https://api.timecockpit.com/odata/$metadata";
const SELECT_ENDPOINT = "https://api.timecockpit.com/select";

export interface PropertyInfo {
  Name: string;
  Type: string;
}

export interface NavigationPropertyInfo {
  Name: string;
  ToRole: string;
}

export interface EntityInfo {
  Properties: PropertyInfo[];
  NavigationProperties: NavigationPropertyInfo[];
  BackwardsNavigationProperties: NavigationPropertyInfo[];
}

function isExcludedEntity(name: string): boolean {
  return (
    name.startsWith("APP_FormattingProfileColor") ||
    name.startsWith("APP_FormattingProfile") ||
    name.startsWith("APP_CultureInfo") ||
    name.startsWith("APP_EntityView") ||
    name.endsWith("Param") ||
    name.endsWith("Parameter") ||
    name.endsWith("Signal") ||
    name.startsWith("SYS_") ||
    name.endsWith("TrackerState")
  );
}

/** Read attribute from element: parser may use $Name (prefix on key) or $.Name (nested under $) */
function attr(el: Record<string, unknown>, key: string): string | undefined {
  const prefixed = el["$" + key] ?? el["$" + key.charAt(0).toLowerCase() + key.slice(1)];
  if (prefixed != null && typeof prefixed === "string") return prefixed;
  const nested = (el.$ as Record<string, string> | undefined)?.[key] ?? (el.$ as Record<string, string> | undefined)?.[key.toLowerCase()];
  return nested;
}

function getEntityNameFromElement(el: Record<string, unknown>): string | undefined {
  return attr(el, "Name");
}

function collectEntityTypes(obj: unknown, out: Array<{ name: string; entity: Record<string, unknown> }>): void {
  if (!obj || typeof obj !== "object") return;
  const o = obj as Record<string, unknown>;

  const entityTypeKey = Object.keys(o).find((k) => k === "EntityType" || k.endsWith(":EntityType"));
  if (entityTypeKey) {
    const et = o[entityTypeKey];
    if (Array.isArray(et)) {
      for (const e of et) {
        const name = getEntityNameFromElement(e as Record<string, unknown>);
        if (name) out.push({ name, entity: e as Record<string, unknown> });
      }
    } else if (et && typeof et === "object") {
      const name = getEntityNameFromElement(et as Record<string, unknown>);
      if (name) out.push({ name, entity: et as Record<string, unknown> });
    }
  }

  for (const v of Object.values(o)) {
    if (!v || typeof v !== "object") continue;
    if (Array.isArray(v)) {
      for (const item of v) collectEntityTypes(item, out);
    } else {
      collectEntityTypes(v, out);
    }
  }
}

function parseEntityType(entity: Record<string, unknown>): EntityInfo {
  const result: EntityInfo = {
    Properties: [],
    NavigationProperties: [],
    BackwardsNavigationProperties: [],
  };
  const prop = entity.Property;
  const props = Array.isArray(prop) ? prop : prop ? [prop] : [];
  for (const p of props) {
    const name = attr(p as Record<string, unknown>, "Name");
    const type = attr(p as Record<string, unknown>, "Type");
    if (name) result.Properties.push({ Name: name, Type: (type || "").replace("Edm.", "") });
  }
  const nav = entity.NavigationProperty;
  const navs = Array.isArray(nav) ? nav : nav ? [nav] : [];
  for (const n of navs) {
    const name = attr(n as Record<string, unknown>, "Name");
    const toRole = attr(n as Record<string, unknown>, "ToRole");
    if (name)
      (name.startsWith("APP") || name.startsWith("USR")
        ? result.NavigationProperties.push({ Name: name, ToRole: toRole ?? "" })
        : result.BackwardsNavigationProperties.push({ Name: name, ToRole: toRole ?? "" }));
  }
  return result;
}

async function fetchMetadataXml(token: string): Promise<string> {
  const res = await fetch(METADATA_ENDPOINT, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Time Cockpit metadata failed: ${res.status} ${res.statusText}`);
  return text;
}

function parseMetadataXml(xml: string): Record<string, EntityInfo> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "$",
    removeNSPrefix: true,
  });
  const root = parser.parse(xml) as Record<string, unknown>;

  const entities: Array<{ name: string; entity: Record<string, unknown> }> = [];

  // Explicit path: Edmx -> DataServices -> Schema[] -> EntityType (parser may nest differently)
  const _edmx = root.Edmx as Record<string, unknown> | undefined;
  const _ds = _edmx?.DataServices as Record<string, unknown> | undefined;
  const _schema = _ds?.Schema;
  const schemaList = Array.isArray(_schema) ? _schema : _schema && typeof _schema === "object" ? [_schema] : [];
  for (const schemaItem of schemaList) {
    const s = schemaItem as Record<string, unknown>;
    const etKey = Object.keys(s).find((k) => k === "EntityType" || k.endsWith(":EntityType"));
    if (!etKey) continue;
    const et = s[etKey];
    if (Array.isArray(et)) {
      for (const e of et) {
        const name = getEntityNameFromElement(e as Record<string, unknown>);
        if (name) entities.push({ name, entity: e as Record<string, unknown> });
      }
    } else if (et && typeof et === "object") {
      const name = getEntityNameFromElement(et as Record<string, unknown>);
      if (name) entities.push({ name, entity: et as Record<string, unknown> });
    }
  }

  if (entities.length === 0) {
    collectEntityTypes(root, entities);
  }

  const result: Record<string, EntityInfo> = {};
  for (const { name, entity } of entities) {
    if (!isExcludedEntity(name)) result[name] = parseEntityType(entity);
  }
  return result;
}

/**
 * Get metadata from cache file or fetch from Time Cockpit API.
 */
export async function getMetadata(token: string, forceReload = false): Promise<Record<string, EntityInfo>> {
  const cachePath = METADATA_CACHE_PATH;
  if (!forceReload && fs.existsSync(cachePath)) {
    const json = fs.readFileSync(cachePath, "utf-8");
    return JSON.parse(json) as Record<string, EntityInfo>;
  }
  const xml = await fetchMetadataXml(token);
  const metadata = parseMetadataXml(xml);
  fs.writeFileSync(cachePath, JSON.stringify(metadata, null, 2), "utf-8");
  return metadata;
}

/**
 * Format metadata as text for the system prompt (same style as AITcqlGenerator template.hbs).
 */
export function formatMetadataForPrompt(metadata: Record<string, EntityInfo>): string {
  const lines: string[] = [];
  for (const [entityName, info] of Object.entries(metadata)) {
    lines.push(`# ${entityName}`);
    if (info.Properties?.length) {
      lines.push("## Properties");
      for (const p of info.Properties) lines.push(`${p.Name} - ${p.Type}`);
    }
    if (info.NavigationProperties?.length) {
      lines.push("## Relations");
      for (const n of info.NavigationProperties) lines.push(`${n.Name} - to entity: ${n.ToRole}`);
    }
    if (info.BackwardsNavigationProperties?.length) {
      lines.push("## Backwards relations");
      for (const n of info.BackwardsNavigationProperties) lines.push(`${n.Name} - to entity: ${n.ToRole}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Execute a TCQL query against the Time Cockpit API and return the response body.
 */
export async function executeQuery(token: string, tcql: string): Promise<string> {
  const res = await fetch(SELECT_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query: tcql }),
  });
  const text = await res.text();
  if (!res.ok) return `Query failed (${res.status}): ${text}`;
  return text;
}
