import { useGame } from "@/lib/contexts/GameContext";
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { FakeWord, WordDictionary } from "@/types/game";
import { GamePlayer } from "@/types/user";
import { Checkbox, CheckboxProps, Chip, cn } from "@heroui/react";
import { Check } from "lucide-react";

type Props = CheckboxProps & {
  word: WordDictionary | FakeWord;
  number: number;
  hasVoted: boolean;
  showBlame?: boolean;
}

export default function CardCheckbox({ word, isSelected, showBlame, number, hasVoted, ...props }: Props) {
  const { currentUser } = useRoomChannel();
  const { currentRound, players, votes } = useGame();

  function searchVoteForWord(id: string) {
    const votedForThis: GamePlayer[] = [];
    const relations = Array.from(votes.entries());

    for (const [userId, defId] of relations) {
      if (defId === id) {
        const found = players.find(u => u.id === userId);
        if (found) votedForThis.push(found);
      }
    }

    return votedForThis;
  }

  const isRight = word.id === currentRound?.word.id;
  const isMyWord = "author" in word && word.author.id === currentUser.id;
  const votedForThis = searchVoteForWord(word.id);

  const showSuccess = showBlame && isRight;
  const showDanger = showBlame && !isRight && isSelected;

  const isDisabled = showBlame || hasVoted;

  return (
    <Checkbox
      key={word.id}
      value={word.id}
      {...props}
      isSelected={isSelected}
      // onValueChange={(isSelected) => setValue(curr => isSelected ? word.id : curr)}
      isDisabled={isDisabled}
      isReadOnly={isMyWord}
      size="lg"
      classNames={{
        base: cn(
          "flex-row-reverse max-w-full w-full m-0 p-4 opacity-100",
          "justify-between items-start relative transition-all",
          "border-foreground-100 border rounded-2xl",
          isSelected && "border-primary",
          showSuccess && "bg-success-100 border-success",
          showDanger && "bg-danger-100 border-danger",
        ),
        wrapper: cn(
          "m-1",
          isDisabled && "opacity-60",
          showSuccess && "after:bg-success",
          showDanger && "after:bg-danger",
        ),
      }}
    >
      {isMyWord && (
        <Chip
          size="sm"
          className="absolute -top-8 -left-1"
        >
          Sua resposta
        </Chip>
      )}

      {number}. {word.definition}

      {showBlame && votedForThis.length > 0 && (
        <ul className="ps-2 mt-2">
          {votedForThis.map(player => (
            <li key={player.id} className="text-sm flex justify-start items-center gap-2">
              <Check size={16} />
              {player.name} votou
            </li>
          ))}
        </ul>
      )}
    </Checkbox>
  )
}