import { useGame } from "@/lib/contexts/GameContext"
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import useFirstRender from "@/lib/hooks/useFirstRender";
import { dictionaryService } from "@/server/services/dictionary";
import { WordDictionary } from "@/types/game";
import { Button, Spinner } from "@heroui/react";
import { RefreshCcw } from "lucide-react";
import { useState, useTransition } from "react";

export default function WordSelector() {
  const { amIHost } = useRoomChannel();
  const { actions } = useGame();

  const [words, setWords] = useState<WordDictionary[]>([]);
  const [isLoading, startLoad] = useTransition();

  function getRandomWords() {
    startLoad(async () => {
      const words = await dictionaryService.getNewRandomWord(4);
      setWords(words);
    });
  }

  useFirstRender(getRandomWords);

  return (
    <div className="flex flex-col gap-2">
      {amIHost && <h3>Escolha uma palavra:</h3>}

      {amIHost && (
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