import { join } from "path";
import { IconSet } from "./IconSet";
import { readFileSync } from "fs";
import { safeDestr } from "destr";
import type { IconsTagMap } from "./types";
import { InvalidTagMapStructureError } from "./errors";
import { alphabetical, flat, unique } from "radashi";

const variants = {
  default: "icons",
};

export class Lucide extends IconSet<typeof variants> {
  constructor() {
    super("Lucide", "lucide-static", variants, "default");
  }

  override supportsTags(): boolean {
    return true;
  }

  override loadTags() {
    const repoPath = join(this.packageDirectory, "tags.json");
    let rawRepo: string;

    try {
      rawRepo = readFileSync(repoPath, "utf-8");
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      throw new Error(`Cannot read tags.json: ${error.code ?? error.message}`);
    }

    const repo = safeDestr<IconsTagMap>(rawRepo);

    if (!repo || typeof repo !== "object" || Array.isArray(repo)) {
      throw new InvalidTagMapStructureError(
        "Lucide tag map is invalid; expected non-empty object of string arrays.",
      );
    }

    const entries = Object.entries(repo);
    const hasInvalidEntry = entries.some(
      ([, value]) => !Array.isArray(value) || value.some((tag) => typeof tag !== "string"),
    );

    if (!entries.length || hasInvalidEntry) {
      throw new InvalidTagMapStructureError(
        "Lucide tag map is invalid; expected non-empty object of string arrays.",
      );
    }

    this.tagNames = alphabetical(unique(flat(Object.values(repo))), (k) => k);
    this.tagMap = repo;
  }

  override findIconsByTag(tag: string): Array<string> {
    const filtered = Object.entries(this.tagMap)
      .filter(([, tags]) => tags.some((t) => t.toLowerCase() === tag.toLowerCase()))
      .map(([icon]) => icon);

    return filtered;
  }
}
