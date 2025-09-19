export type User = {
  id: string;
  name: string;
}

export type RoomUser = User & {
  onlineAt: string | null;
}

export type Player = RoomUser & {
  isHost: boolean;
}

export type GamePlayer = Player & {
  points: number;
}