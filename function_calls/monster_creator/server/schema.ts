import { z } from "zod/v4";

/** Size for 5e creatures */
export const monsterSizeSchema = z.enum([
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
]);
export type MonsterSize = z.infer<typeof monsterSizeSchema>;

/** Alignment */
export const alignmentSchema = z.enum([
  "lawful good",
  "neutral good",
  "chaotic good",
  "lawful neutral",
  "neutral",
  "chaotic neutral",
  "lawful evil",
  "neutral evil",
  "chaotic evil",
]);
export type Alignment = z.infer<typeof alignmentSchema>;

/** Trait or action: name + description */
export const traitSchema = z.object({
  name: z.string(),
  desc: z.string(),
});
export type Trait = z.infer<typeof traitSchema>;

/** Six ability scores [STR, DEX, CON, INT, WIS, CHA] */
export const statsArraySchema = z
  .array(z.number().int())
  .length(6)
  .describe("Ability scores in order: STR, DEX, CON, INT, WIS, CHA");

/** Single save or skill entry: name (e.g. dexterity, stealth) and modifier value */
export const modifierMapSchema = z.object({
  name: z.string(),
  mod: z.number().int(),
});

/** Parameters for write_monster: full statblock data for Javalent Fantasy Statblocks (Basic 5e Layout) */
export const writeMonsterParamsSchema = z.object({
  /** Filename including .md (e.g. "My Monster.md" or "Void Monster/New Creature.md") */
  filename: z
    .string()
    .describe("Markdown filename; can include subfolder e.g. 'Void Monster/Name.md'"),
  /** Monster display name (used as # title and in statblock) */
  name: z.string(),
  /** Creature size */
  size: monsterSizeSchema,
  /** Creature type (e.g. aberration, fiend, beast) */
  type: z.string(),
  /** Subtype (e.g. voidborn, demon). Omit or empty string if not applicable. */
  subtype: z.string().default(""),
  alignment: alignmentSchema,
  ac: z.number().int().describe("Armor class"),
  hp: z.number().int(),
  hit_dice: z.string().describe("e.g. '4d8' or '2d6 + 2'"),
  speed: z.string().describe("e.g. '30 ft.' or '0 ft., fly 30 ft. (hover)'"),
  stats: statsArraySchema,
  saves: z.array(modifierMapSchema).default([]).describe("Saving throw modifiers, e.g. [{ name: 'dexterity', mod: 5 }]"),
  skillsaves: z.array(modifierMapSchema).default([]).describe("Skill modifiers, e.g. [{ name: 'stealth', mod: 5 }]"),
  /** Damage resistances; omit or empty string if none. */
  damage_resistances: z.string().default(""),
  /** Damage immunities; omit or empty string if none. */
  damage_immunities: z.string().default(""),
  /** Condition immunities; omit or empty string if none. */
  condition_immunities: z.string().default(""),
  senses: z.string().describe("e.g. 'darkvision 60 ft., passive Perception 10'"),
  languages: z.string().default(""),
  cr: z
    .string()
    .describe("Challenge rating e.g. '1/4' or '9'"),
  traits: z.array(traitSchema).default([]).describe("Special traits; omit or empty array if none."),
  actions: z.array(traitSchema).default([]).describe("Actions the creature can take; omit or empty array if none."),
  /** Optional extra frontmatter tags (e.g. homebrew). System always adds monster/cr, monster/size, monster/type, monster/subtype from statblock. */
  tags: z.array(z.string()).default([]),
  /** Flavor or lore text below the statblock; omit or empty string if none. */
  flavor_text: z.string().default(""),
});
export type WriteMonsterParams = z.infer<typeof writeMonsterParamsSchema>;

/** Parameters for list_monsters. folder: subfolder under bestiary (e.g. 'Void Monster'); omit or empty string to list root. */
export const listMonstersParamsSchema = z.object({
  folder: z
    .string()
    .default("")
    .describe(
      "Subfolder under the bestiary (e.g. 'Void Monster'). Omit or empty string to list the root."
    ),
});
export type ListMonstersParams = z.infer<typeof listMonstersParamsSchema>;

/** Parameters for read_monster and delete_monster */
export const monsterFilenameParamsSchema = z.object({
  filename: z
    .string()
    .describe(
      "Path to the monster file relative to the bestiary, e.g. 'Void Monster/Void Spark.md' or 'Custom Homebrew Monster.md'"
    ),
});
export type MonsterFilenameParams = z.infer<typeof monsterFilenameParamsSchema>;
