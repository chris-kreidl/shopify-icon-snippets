import { createRequire } from "module";
import { dirname, join } from "path";
import { similarity } from "radashi";
import type { IconsTagMap } from "./types";
import { existsSync, readdirSync, readFileSync } from "fs";
import { UnknownIconVariantError } from "./errors";

export abstract class IconSet<TVariants extends Record<string, string> = { default: string }> {
  name: string;
  packageDirectory: string;
  iconNames: Array<string> = [];
  tagNames: Array<string> = [];
  tagMap: IconsTagMap = {};
  variants: TVariants;
  variant: keyof TVariants;

  abstract loadTags(): void;

  constructor(name: string, packageName: string, variants: TVariants, variant: keyof TVariants & string) {
    this.name = name;
    this.variants = variants;
    this.variant = variant;
    this.packageDirectory = this.resolvePackageDirectory(packageName);

    this.loadIcons();

    if (this.supportsTags()) this.loadTags();
  }

  /**
   * Resolves package directory
   *
   * @returns {string} Full path to package directory
   */
  resolvePackageDirectory(packageName: string): string {
    const require = createRequire(import.meta.url);
    const packageDirectory = dirname(require.resolve(`${packageName}/package.json`));

    return packageDirectory;
  }

  /**
   * Find an exact case-insensitive match in an array of strings.
   *
   * @param needle - String to find
   * @returns The matched string from haystack, or `null` if not found
   */
  findExactMatch(needle: string): string | null {
    return this.iconNames.find((name) => name.toLowerCase() === needle.toLowerCase()) ?? null;
  }

  /**
   * Find strings similar to the needle using substring and Levenshtein matching.
   *
   * Returns substring matches first (e.g., "arrow" matches "arrow-right"),
   * then fuzzy matches for typos (e.g., "arrwo" matches "arrow").
   *
   * @param needle - String to match against
   * @param count - Maximum number of results to return (default: 5)
   * @returns Array of similar strings
   */
  findSimilar(needle: string, count = 5): Array<string> {
    const n = needle.toLowerCase();

    // Substring matches first (most relevant)
    const substringMatches = this.iconNames.filter((name) => name.toLowerCase().includes(n));

    // Fuzzy matches for typos (excluding already matched)
    const fuzzyMatches = this.iconNames.filter(
      (name) => !substringMatches.includes(name) && similarity(name.toLowerCase(), n) <= 2,
    );

    return [...substringMatches, ...fuzzyMatches].slice(0, count);
  }

  extractPaths(svg: string): string {
    const innerMatch = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if (!innerMatch || !innerMatch[1]) throw new Error(`Error parsing SVG`);
    const innerContent = innerMatch[1].trim();

    return innerContent;
  }

  supportsTags(): boolean {
    return false;
  }

  getTags(): Array<string> {
    return this.tagNames;
  }

  /* oxlint-disable-next-line no-unused-vars */
  findIconsByTag(tag: string): Array<string> {
    return [];
  }

  getVariantPath(variant?: keyof TVariants): string {
    const v = variant ?? this.variant;
    if (v in this.variants) {
      return join(this.packageDirectory, this.variants[v]!);
    } else {
      throw new UnknownIconVariantError(String(v));
    }
  }

  getIcon(icon: string, variant?: keyof TVariants): string {
    const v = variant ?? this.variant;
    const dir = this.getVariantPath(v);
    const iconPath = join(dir, `${icon}.svg`);
    let svgContent: string;

    try {
      svgContent = readFileSync(iconPath, "utf-8");
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      throw new Error(`Cannot read icon "${icon}": ${error.code ?? error.message}`);
    }

    return this.extractPaths(svgContent);
  }

  getVariants(): Array<string> {
    return Object.keys(this.variants);
  }

  loadIcons() {
    const iconsDir = this.getVariantPath();
    if (!existsSync(iconsDir)) throw new Error("Could not find icons directory");

    this.iconNames = readdirSync(iconsDir)
      .filter((f) => f.endsWith(".svg"))
      .map((f) => f.replace(".svg", ""));
  }
}
