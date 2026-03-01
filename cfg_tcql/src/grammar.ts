import fs from "fs";
import { GRAMMAR_PATH } from "./config.js";

export function loadGrammar(): string {
  return fs.readFileSync(GRAMMAR_PATH, "utf-8");
}
