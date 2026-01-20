#!/usr/bin/env node
import { program } from "commander";
import { addIcons } from "./commands/add.ts";
import { searchIcons } from "./commands/search.ts";
import { version } from "../package.json";
import { listTags } from "./commands/tags.ts";
import { listVariants } from "./commands/variants.ts";
import { interactive } from "./interactive.ts";

program.name("sis").description("Add icon library snippets to your Shopify theme").version(version);

program
  .command("add")
  .description("Add icon snippet(s) to your Shopify theme")
  .argument("<library>", "Icon library to use (e.g., lucide)")
  .argument("<icons...>", "Icon name(s) to add (e.g., menu chevron-down)")
  .option("-d, --dir <path>", "Snippets directory", "snippets")
  .option("-p, --prefix <prefix>", "Prefix for snippet filenames", "icon-")
  .option("-f, --force", "Overwrite output files if already exists")
  .action(addIcons);

program
  .command("search")
  .description("Search icon library for icons")
  .argument("<library>", "Icon library to use (e.g., lucide)")
  .argument("<term>", "Search term. Searches icon name if tag option not set")
  .option("-t, --tag", "Search tags")
  .action(searchIcons);

program
  .command("tags")
  .argument("<library>", "Icon library to use (e.g., lucide)")
  .description("List available tags as provided by the icon library")
  .action(listTags);

program
  .command("variants")
  .argument("<library>", "Icon library to use (e.g., lucide)")
  .description("List available variants from the icon library")
  .action(listVariants);

program.command("interactive").description("Interactive mode").action(interactive);

program.parse();
