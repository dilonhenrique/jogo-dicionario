import { useGame } from "@/lib/contexts/GameContext"
import { useRoomChannel } from "@/lib/contexts/RoomContext";
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
  const { currentUser } = useRoomChannel();
  const { actions } = useGame();

  const isHost = currentUser.isHost;

  return <div>
    {isHost && <h3>Escolha uma palavra:</h3>}
    {!isHost && <h3>Aguarde a palavra...</h3>}

    {isHost && words.map(word => (
      <Button
        key={word.label}
        onPress={() => actions.setWordAndStartFakeStage(word)}
      >
        {word.label}
      </Button>
    ))}
  </div>
}