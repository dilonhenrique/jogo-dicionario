import { sortBy } from "lodash";
import { useGame } from "@/lib/contexts/GameContext"
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { Button, Form } from "@heroui/react";
import { useMemo, useState } from "react";
import CardCheckbox from "@/lib/components/ui/CardCheckbox/CardCheckbox";

export default function VoteStage() {
  const { currentUser } = useRoomChannel();
  const { currentRound, actions, stage } = useGame();

  const [value, setValue] = useState<string>();
  const [hasVoted, setVoted] = useState(false);

  const isBlame = stage === "blame";

  const allDefinitions = useMemo(() => {
    if (!currentRound) return [];

    return sortBy([
      currentRound.word,
      ...currentRound.fakes.filter(w => w.author.id !== currentUser.id)
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
            showBlame={isBlame}
            number={index + 1}
            hasVoted={hasVoted}
          />
        ))}
      </div>

      {!isBlame && (
        <Button type="submit" color="primary" isDisabled={hasVoted}>
          Votar
        </Button>
        // TODO: mudar voto (remover depois votar de novo)
      )}
      {isBlame && currentUser.isHost && (
        <Button color="primary" onPress={() => actions.checkoutCurrentRound()}>Seguir</Button>
      )}
    </Form>
  )
}