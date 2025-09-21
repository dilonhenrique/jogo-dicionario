import { upperFirst } from "lodash";

export function normalizeDefinition(definition: string): string {
  const withPoint = definition.endsWith(".") ? definition : definition + ".";
  return upperFirst(withPoint);
}