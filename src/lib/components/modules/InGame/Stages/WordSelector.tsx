import { useGame } from "@/lib/contexts/GameContext"
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import useFirstRender from "@/lib/hooks/useFirstRender";
import { getNewRandomWord } from "@/server/services/dictionary/dictionary.service";
import { WordDictionary } from "@/types/game";
import { Button, Spinner } from "@heroui/react";
import { RefreshCcw } from "lucide-react";
import { useState, useTransition } from "react";

export default function WordSelector() {
  const { currentUser } = useRoomChannel();
  const { actions } = useGame();

  const [words, setWords] = useState<WordDictionary[]>([]);
  const [isLoading, startLoad] = useTransition();

  const isHost = currentUser.isHost;

  function getRandomWords() {
    startLoad(async () => {
      const words = await getNewRandomWord(4);
      setWords(words);
    });
  }

  useFirstRender(getRandomWords);

  return (
    <div className="flex flex-col gap-2">
      {isHost && <h3>Escolha uma palavra:</h3>}

      {isHost && (
        <>
          {isLoading && <Spinner />}
          {!isLoading && (
            <>
              {words.map(word => (
                <Button
                  key={word.label}
                  size="lg"
                  onPress={() => actions.setWordAndStartFakeStage(word)}
                >
                  {word.label}
                </Button>
              ))}

              <Button
                variant="light"
                color="primary"
                startContent={<RefreshCcw size={20} />}
                onPress={getRandomWords}
              >
                Carregar outras
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}