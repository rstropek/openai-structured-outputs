import { tool } from "@openai/agents";
import fs from "fs";
import path from "path";
import {
  writeMonsterParamsSchema,
  listMonstersParamsSchema,
  monsterFilenameParamsSchema,
} from "./schema.js";
import { buildMonsterMarkdown } from "./buildMarkdown.js";
import { getBestiaryDir } from "./config.js";

/** Resolve a path relative to the bestiary; throw if it escapes (path traversal). */
function resolveBestiaryPath(relativePath: string): string {
  const base = getBestiaryDir();
  const full = path.normalize(path.join(base, relativePath));
  const relative = path.relative(base, full);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path must stay inside the bestiary folder.");
  }
  return full;
}

export const writeMonsterTool = tool({
  name: "write_monster",
  description:
    "Write a D&D 5e monster to the Obsidian bestiary as a markdown file. Use after you have gathered enough information from the user (name, type, CR, abilities, etc.). The file will use the Javalent Fantasy Statblocks format (Basic 5e Layout).",
  parameters: writeMonsterParamsSchema,
  async execute(args) {
    console.log("[tool] write_monster called with args:", {
      filename: args.filename,
      name: args.name,
      cr: args.cr,
      type: args.type,
      size: args.size,
      subtype: args.subtype,
    });
    const fullPath = resolveBestiaryPath(args.filename);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    const content = buildMonsterMarkdown(args);
    fs.writeFileSync(fullPath, content, "utf-8");
    return JSON.stringify({
      success: true,
      path: fullPath,
      message: `Monster "${args.name}" written to ${args.filename}`,
    });
  },
});

export const listMonstersTool = tool({
  name: "list_monsters",
  description:
    "List monster markdown files in the bestiary. Optionally restrict to a subfolder (e.g. 'Void Monster'). Use to avoid duplicate names or show the user what exists.",
  parameters: listMonstersParamsSchema,
  async execute(args) {
    console.log("[tool] list_monsters called with args:", {
      folder: args.folder,
    });
    const base = getBestiaryDir();
    const targetDir = args.folder.trim() ? resolveBestiaryPath(args.folder) : base;
    if (!fs.existsSync(targetDir)) {
      return JSON.stringify({ files: [], message: "Folder does not exist." });
    }
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const files: string[] = [];
    for (const e of entries) {
      if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
        files.push(args.folder.trim() ? `${args.folder}/${e.name}` : e.name);
      }
      if (e.isDirectory()) {
        const subPath = args.folder.trim() ? `${args.folder}/${e.name}` : e.name;
        const subDir = path.join(targetDir, e.name);
        if (fs.existsSync(subDir)) {
          const subEntries = fs.readdirSync(subDir, { withFileTypes: true });
          for (const s of subEntries) {
            if (s.isFile() && s.name.toLowerCase().endsWith(".md")) {
              files.push(`${subPath}/${s.name}`);
            }
          }
        }
      }
    }
    return JSON.stringify({ files: files.sort(), count: files.length });
  },
});

export const readMonsterTool = tool({
  name: "read_monster",
  description:
    "Read the contents of an existing monster file. Use to show the user a statblock or to base a new monster on an existing one.",
  parameters: monsterFilenameParamsSchema,
  async execute(args) {
    console.log("[tool] read_monster called with args:", {
      filename: args.filename,
    });
    const fullPath = resolveBestiaryPath(args.filename);
    if (!fs.existsSync(fullPath)) {
      return JSON.stringify({
        success: false,
        error: `File not found: ${args.filename}`,
      });
    }
    const content = fs.readFileSync(fullPath, "utf-8");
    return JSON.stringify({
      success: true,
      filename: args.filename,
      content,
    });
  },
});

export const deleteMonsterTool = tool({
  name: "delete_monster",
  description:
    "Delete a monster file from the bestiary. Use when the user asks to remove a creature. Confirm the filename (e.g. from list_monsters) before deleting.",
  parameters: monsterFilenameParamsSchema,
  async execute(args) {
    console.log("[tool] delete_monster called with args:", {
      filename: args.filename,
    });
    const fullPath = resolveBestiaryPath(args.filename);
    if (!fs.existsSync(fullPath)) {
      return JSON.stringify({
        success: false,
        error: `File not found: ${args.filename}`,
      });
    }
    fs.unlinkSync(fullPath);
    return JSON.stringify({
      success: true,
      message: `Deleted ${args.filename}`,
    });
  },
});

export const monsterTools = [
  writeMonsterTool,
  listMonstersTool,
  readMonsterTool,
  deleteMonsterTool,
];
