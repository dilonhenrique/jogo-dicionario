import { useSession } from "@/lib/contexts/SessionContext";
import { Player } from "@/types/user";
import { Chip, ChipProps, Tooltip } from "@heroui/react";
import { CrownIcon } from "lucide-react";

type Props = Omit<ChipProps, "endContent" | "variant" | "color"> & {
  player: Player;
}

export default function PlayerChip({ player, ...props }: Props) {
  const { user } = useSession();

  const isMe = player.id === user.id;

  return (
    <Chip
      {...props}
      variant="dot"
      color={player.onlineAt === null ? "danger" : "success"}
      endContent={player.isHost && (
        <Tooltip content="Host">
          <CrownIcon size={14} className="mx-1 mb-0.5 text-warning" />
        </Tooltip>
      )}
    >
      {player.name}
      {isMe && <span className="text-xs"> (você)</span>}
    </Chip>
  );
}