import { useGame } from "@/lib/contexts/GameContext"
import { SimpleWord } from "@/types/game";
import { Button } from "@heroui/react";

const words: SimpleWord[] = [
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

export default function WordSelector() {
  const { actions } = useGame();

  return <div>
    <h3>Escolha uma palavra:</h3>

    {words.map(word => (
      <Button
        key={word.label}
        onPress={() => {
          actions.setWordForNextRound(word)
        }}
      >
        {word.label}
      </Button>
    ))}
  </div>
}