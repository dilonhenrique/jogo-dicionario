import { getPositionColor } from "@/lib/utils/getPositionColor";
import { GamePlayer } from "@/types/user";
import { cn, Divider } from "@heroui/react";

type Position = 1 | 2 | 3;

type PodiumProps = {
  position: Position;
  player: GamePlayer;
}

export default function Pedestal({ player, position }: PodiumProps) {
  const isFirst = position === 1;

  function getBorderColor(position: Position) {
    switch (position) {
      case 1:
        return "bg-warning-300 border-warning";
      case 2:
        return "bg-cyan-700 border-cyan-600";
      case 3:
        return "bg-amber-700 border-amber-600";
    }
  }

  return (
    <div
      className={
        cn(
          "rounded-lg rounded-t-2xl text-center p-4 pb-8 relative",
          isFirst && "rounded-b-none",
          position === 2 && "rounded-r-none",
          position === 3 && "rounded-l-none",
          isFirst ? "pt-16" : "pt-10",
          isFirst ? "bg-content1" : "bg-content2",
        )
      }
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full",
          "absolute top-0 left-1/2 -translate-x-1/2 border-4 font-bold",
          isFirst ? "-mt-8 w-18 h-18 text-2xl" : "-mt-8 w-14 h-14 text-lg",
          getBorderColor(position),
        )}
      >
        {position}
      </span>

      <p className={getPositionColor(position)}>
        {player.name}
      </p>

      <p className="text-foreground-500 text-sm">
        {player.points} pts.
      </p>

      {isFirst && <Divider className="mt-4 w-6 h-1 bg-warning mx-auto" />}
    </div>
  );
}