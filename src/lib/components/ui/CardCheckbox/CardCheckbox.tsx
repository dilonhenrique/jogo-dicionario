import { useGame } from "@/lib/contexts/GameContext";
import { useSession } from "@/lib/contexts/SessionContext";
import { FakeWord, WordDictionary } from "@/types/game";
import { GamePlayer } from "@/types/user";
import { Checkbox, CheckboxProps, Chip, cn } from "@heroui/react";
import { capitalize } from "lodash";
import { Check } from "lucide-react";

type Props = CheckboxProps & {
  word: WordDictionary | FakeWord;
  number: number;
  hasVoted: boolean;
  showBlame?: boolean;
}

export default function CardCheckbox({ word, isSelected, showBlame, number, hasVoted, ...props }: Props) {
  const { user: currentUser } = useSession();
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

  function getPlayerName(user: GamePlayer) {
    return user.id === currentUser.id ? "Você" : user.name;
  }

  const isRightWord = word.id === currentRound?.word.id;
  const isMyWord = "author" in word && word.author.id === currentUser.id;
  const playersVotedForThis = searchVoteForWord(word.id);

  const showSuccess = showBlame && isRightWord;
  const showDanger = showBlame && !isRightWord && isSelected;

  const isDisabled = showBlame || hasVoted;

  return (
    <Checkbox
      key={word.id}
      value={word.id}
      {...props}
      isSelected={isSelected}
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

      {number}. {capitalize(word.definition)}

      {showBlame && playersVotedForThis.length > 0 && (
        <ul className="ps-2 mt-2">
          {playersVotedForThis.map(player => {
            const isMe = player.id === currentUser.id;
            const shouldPoint = (isMe && isRightWord) || (!isMe && isMyWord);

            return (
              <li
                key={player.id}
                className={cn(
                  "text-sm flex justify-start items-center gap-2",
                  isMe && "font-semibold",
                )}
              >
                <Check size={16} />
                {getPlayerName(player)} votou
                {shouldPoint && <Chip color="success" size="sm">+1 pt.</Chip>}
              </li>
            )
          })}
        </ul>
      )}
    </Checkbox>
  )
}