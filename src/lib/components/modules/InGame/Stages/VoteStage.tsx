import { sortBy } from "lodash";
import { useGame } from "@/lib/contexts/GameContext"
import { Button } from "@heroui/react";
import { useMemo } from "react";
import CardCheckbox from "@/lib/components/ui/CardCheckbox/CardCheckbox";
import { useSession } from "@/lib/contexts/SessionContext";
import { useRoomChannel } from "@/lib/contexts/RoomContext";

export default function VoteStage() {
  const { user: currentUser } = useSession();
  const { amIHost } = useRoomChannel();
  const { currentRound, actions, stage, votes } = useGame();

  const myVote = votes.get(currentUser.id);

  const showBlame = stage === "blame";

  const allDefinitions = useMemo(() => {
    if (!currentRound) return [];

    return sortBy([
      currentRound.word,
      ...currentRound.fakes,
    ], "id");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVote(defId: string, isSelected: boolean) {
    try {
      if (isSelected) {
        await actions.vote(defId);
      } else {
        await actions.removeVote();
      }
    } catch (error) {
      console.error("Erro ao votar:", error);
    }
  }

  if (!currentRound) return <></>;

  return (
    <>
      <div className="w-full flex flex-col gap-6 my-4">
        {allDefinitions.map((word, index) => (
          <CardCheckbox
            key={word.id}
            word={word}
            isSelected={myVote === word.id}
            onValueChange={(isSelected) => handleVote(word.id, isSelected)}
            showBlame={showBlame}
            number={index + 1}
          />
        ))}
      </div>

      {showBlame && amIHost && (
        <Button
          color="primary"
          className="mt-auto self-center"
          onPress={async () => {
            try {
              await actions.checkoutCurrentRound();
            } catch (error) {
              console.error("Erro ao finalizar rodada:", error);
            }
          }}
        >
          Iniciar próxima rodada
        </Button>
      )}
    </>
  )
}