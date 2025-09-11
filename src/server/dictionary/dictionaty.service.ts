import { WordDictionary } from "@/types/game";
import { v4 } from "uuid";

export async function getNewRandomWord(): Promise<WordDictionary> {
  return {
    id: v4(),
    label: "Parangaricutitimirruaru",
    definition: "Feitiço da bruxa baratuxa"
  }
}