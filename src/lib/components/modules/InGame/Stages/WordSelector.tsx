import { useGame } from "@/lib/contexts/GameContext"
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import useFirstRender from "@/lib/hooks/useFirstRender";
import { getNewRandomWord } from "@/server/dictionary/dictionary.service";
import { WordDictionary } from "@/types/game";
import { Button, Spinner } from "@heroui/react";
import { useState, useTransition } from "react";

export default function WordSelector() {
  const { currentUser } = useRoomChannel();
  const { actions } = useGame();

  const [words, setWords] = useState<WordDictionary[]>([]);
  const [isLoading, startLoad] = useTransition();

  const isHost = currentUser.isHost;

  useFirstRender(() => {
    startLoad(async () => {
      const words = await getNewRandomWord(4);
      setWords(words);
    })
  })

  return (
    <div className="flex flex-col gap-2">
      {isHost && <h3>Escolha uma palavra:</h3>}
      {!isHost && <h3>Aguarde a palavra...</h3>}

      {isHost && (
        <>
          {isLoading && <Spinner />}
          {!isLoading && words.map(word => (
            <Button
              key={word.label}
              onPress={() => actions.setWordAndStartFakeStage(word)}
            >
              {word.label}
            </Button>
          ))}
        </>
      )}
    </div>
  );
}