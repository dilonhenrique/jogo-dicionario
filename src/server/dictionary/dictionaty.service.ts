import { SimpleWord, WordDictionary } from "@/types/game";
import { sampleSize } from "lodash";
import { v4 } from "uuid";

const words: SimpleWord[] = [
  {
    label: "Parangaricutirimirruaru",
    definition: "Feitiço da bruxa baratuxa"
  },
  {
    label: "Defenestrar",
    definition: "Ato de jogar alguém ou algo pela janela"
  },
  {
    label: "Volátil",
    definition: "Contrário de volto cá tia"
  },
  {
    label: "Euforia",
    definition: "Alegria incontrolável"
  },
]

export async function getNewRandomWord(quantity = 1): Promise<WordDictionary[]> {
  const random = sampleSize(words, quantity);
  return random.map(w => ({ ...w, id: v4() }));
}
