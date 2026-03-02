import Handlebars from "handlebars";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { WriteMonsterParams } from "./schema.js";

// ── Template einmalig laden ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templateSrc = readFileSync(join(__dirname, "monster.hbs"), "utf-8");

// ── Handlebars-Helpers ──
Handlebars.registerHelper("joinStats", (stats: number[]) => stats.join(", "));

Handlebars.registerHelper("escDesc", (desc: string) =>
  desc.replace(/\r?\n/g, " ").replace(/"/g, '\\"')
);

const template = Handlebars.compile(templateSrc, { noEscape: true });

/**
 * Build Obsidian markdown for Javalent Fantasy Statblocks (Basic 5e Layout).
 * See: https://plugins.javalent.com/statblocks/readme/code-block
 */
export function buildMonsterMarkdown(p: WriteMonsterParams): string {
  // Schema-Tags berechnen (wie vorher)
  const schemaTags = [
    `monster/cr/${p.cr}`,
    `monster/size/${p.size.toLowerCase()}`,
    `monster/type/${p.type}`,
    ...(p.subtype.trim() ? [`monster/subtype/${p.subtype}`] : []),
  ];
  const extraTags = (p.tags || []).filter(
    (t) => t && typeof t === "string" && !schemaTags.includes(t)
  );

  const context = {
    ...p,
    tags: [...schemaTags, ...extraTags],
    flavorText: p.flavor_text?.trim() || "",
  };

  // Rendern + überflüssige Leerzeilen von {{#if}}-Blöcken entfernen
  return template(context).replace(/\n{3,}/g, "\n");
}
