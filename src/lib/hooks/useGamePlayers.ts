import { useEffect, useState } from "react";
import { useRoomChannel } from "../contexts/RoomContext";
import { GamePlayer } from "@/types/user";

export function useGamePlayers() {
  const { onlinePlayers } = useRoomChannel();
  const [players, setPlayers] = useState<GamePlayer[]>(onlinePlayers.map(p => ({ ...p, points: 0 })));

  useEffect(() => {
    setPlayers(players => players.map(
      (player) => ({
        ...player,
        onlineAt: onlinePlayers.find(p => player.id === p.id)?.onlineAt ?? null,
      })
    ));
  }, [onlinePlayers]);

  function increasePointToPlayer(userId: string, increase: number = 1) {
    setPlayers(players =>
      players.map(player => ({
        ...player,
        points: player.id === userId ? player.points + increase : player.points,
      }))
    )
  }

  return { players, increasePointToPlayer };
}