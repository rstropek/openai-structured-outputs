# Monster Creator

Agent that creates D&D 5e monsters for your Obsidian vault using the [Javalent Fantasy Statblocks](https://plugins.javalent.com/statblocks) plugin (Basic 5e Layout). The agent can ask for details in chat and then write a monster file via a function call.

## Setup

```bash
cd monster_creator
npm install
cp .env.example .env
# Edit .env: set OPENAI_API_KEY
```

Optional: set `BESTIARY_PATH` in `.env` if your vault path is different (default: `C:\Users\mebau\Documents\DnD\ObsidianTTRPGVault\3-Mechanics\Bestiary`).

## Run

```bash
npm start
```

Frontend starten: `cd public && npm install && npm start` (Vite Dev Server). Alternativ `public/index.html` direkt im Browser öffnen oder den Ordner `public` mit einem anderen HTTP-Server ausliefern. Backend-Port ist **5001** (damit kein Konflikt mit talk_manager auf 5000).

## Flow

1. User describes a monster or answers the agent’s questions (name, type, CR, size, abilities, actions, etc.).
2. When the agent has enough information, it calls the `write_monster` tool.
3. The server writes a markdown file to your Bestiary folder with YAML frontmatter and a ` ```statblock ` code block (Basic 5e Layout).

## Schema

Monsters are defined in `server/schema.ts` (Zod): name, size, type, subtype, alignment, AC, HP, hit dice, speed, ability scores, saves, skills, resistances/immunities, senses, languages, CR, traits, actions, optional tags and flavor text. The filename can include a subfolder (e.g. `Void Monster/My Creature.md`).

## References

- [Fantasy Statblocks – Codeblock Creatures](https://plugins.javalent.com/statblocks/readme/code-block)
- [Fantasy Statblocks – The Bestiary](https://plugins.javalent.com/statblocks/readme/bestiary)
