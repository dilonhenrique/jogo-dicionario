import { upperFirst } from "lodash";

export function normalizeDefinition(definition: string): string {
  return upperFirst(
    definition
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[?!*+]/g, "")
      .replace(/\.{2,}/g, ".")
      .replace(/\n/g, " ")
      .replace(/["'"]/g, '"')
      .replace(/\.\s*$/, "")
      + "."
  );
}