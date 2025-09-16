import { sortBy } from "lodash";
import { useGame } from "@/lib/contexts/GameContext"
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { Button, Form } from "@heroui/react";
import { useMemo, useState } from "react";
import CardCheckbox from "@/lib/components/ui/CardCheckbox/CardCheckbox";

export default function VoteStage() {
  const { currentUser } = useRoomChannel();
  const { currentRound, actions, stage, votes } = useGame();

  const [value, setValue] = useState(votes.get(currentUser.id));
  const [hasVoted, setVoted] = useState(false);

  const showBlame = stage === "blame";

  const allDefinitions = useMemo(() => {
    if (!currentRound) return [];

    return sortBy([
      currentRound.word,
      ...currentRound.fakes,
    ], "id");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!currentRound) return <></>;

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        if (typeof value === "string") {
          actions.vote(value);
          setVoted(true);
        }
      }}
    >
      <div className="w-full flex flex-col gap-6 my-4">
        {allDefinitions.map((word, index) => (
          <CardCheckbox
            key={word.id}
            word={word}
            isSelected={value === word.id}
            onValueChange={(isSelected) => setValue(curr => isSelected ? word.id : curr)}
            showBlame={showBlame}
            number={index + 1}
            hasVoted={hasVoted}
          />
        ))}
      </div>

      {!showBlame && (
        <>
          <Button type="submit" color="primary" isDisabled={!value || hasVoted}>
            Confirmar voto
          </Button>
          {hasVoted && <Button onPress={actions.removeVote}>
            Cancelar voto
          </Button>}
        </>
      )}
      {showBlame && currentUser.isHost && (
        <Button color="primary" onPress={() => actions.checkoutCurrentRound()}>
          Iniciar próxima rodada
        </Button>
      )}
    </Form>
  )
}