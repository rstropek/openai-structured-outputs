import type { WriteMonsterParams } from "./schema.js";

/**
 * Build Obsidian markdown for Javalent Fantasy Statblocks (Basic 5e Layout).
 * See: https://plugins.javalent.com/statblocks/readme/code-block
 */
export function buildMonsterMarkdown(p: WriteMonsterParams): string {
  // Immer Schema-Tags (Bild 2); zusätzliche vom LLM (z. B. homebrew) nur als Extra
  const schemaTags = [
    `monster/cr/${p.cr}`,
    `monster/size/${p.size.toLowerCase()}`,
    `monster/type/${p.type}`,
    ...(p.subtype.trim() ? [`monster/subtype/${p.subtype}`] : []),
  ];
  const extraTags = (p.tags || []).filter(
    (t) => t && typeof t === "string" && !schemaTags.includes(t)
  );
  const tags = [...schemaTags, ...extraTags];

  const frontmatter = [
    "---",
    "obsidianUIMode: preview",
    "cssclasses: json5e-monster",
    "tags:",
    ...tags.map((t) => `  - ${t}`),
    "statblock: inline",
    "---",
  ].join("\n");

  const statblockLines: string[] = [
    "layout: Basic 5e Layout",
    `name: ${p.name}`,
    `size: ${p.size}`,
    `type: ${p.type}`,
    ...(p.subtype ? [`subtype: ${p.subtype}`] : []),
    `alignment: ${p.alignment}`,
    `ac: ${p.ac}`,
    `hp: ${p.hp}`,
    `hit_dice: ${p.hit_dice}`,
    `speed: "${p.speed}"`,
    `stats: [${p.stats.join(", ")}]`,
  ];

  if (p.saves && Object.keys(p.saves).length > 0) {
    statblockLines.push("saves:");
    for (const [k, v] of Object.entries(p.saves)) {
      statblockLines.push(`  - ${k}: ${v}`);
    }
  }
  if (p.skillsaves && Object.keys(p.skillsaves).length > 0) {
    statblockLines.push("skillsaves:");
    for (const [k, v] of Object.entries(p.skillsaves)) {
      statblockLines.push(`  - ${k}: ${v}`);
    }
  }
  if (p.damage_resistances) statblockLines.push(`damage_resistances: "${p.damage_resistances}"`);
  if (p.damage_immunities) statblockLines.push(`damage_immunities: "${p.damage_immunities}"`);
  if (p.condition_immunities) statblockLines.push(`condition_immunities: "${p.condition_immunities}"`);

  statblockLines.push(`senses: "${p.senses}"`);
  statblockLines.push(`languages: "${p.languages}"`);
  statblockLines.push(`cr: ${p.cr}`);

  if (p.traits && p.traits.length > 0) {
    statblockLines.push("traits:");
    for (const t of p.traits) {
      statblockLines.push(`  - name: "${t.name}"`);
      statblockLines.push(`    desc: "${t.desc.replace(/\r?\n/g, " ").replace(/"/g, '\\"')}"`);
    }
  }
  if (p.actions && p.actions.length > 0) {
    statblockLines.push("actions:");
    for (const a of p.actions) {
      statblockLines.push(`  - name: "${a.name}"`);
      statblockLines.push(`    desc: "${a.desc.replace(/\r?\n/g, " ").replace(/"/g, '\\"')}"`);
    }
  }

  const statblock = ["```statblock", ...statblockLines, "```"].join("\n");

  const body = [
    `# ${p.name}`,
    "",
    statblock,
    ...(p.flavor_text && p.flavor_text.trim()
      ? [" "," ", `*${p.flavor_text.trim()}*`]
      : []),
  ].join("\n");

  return [frontmatter, "", body].join("\n");
}
