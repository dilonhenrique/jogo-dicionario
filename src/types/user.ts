export type User = {
  id: string;
  name: string;
  isHost: boolean;
}

export type Player = User & {
  onlineAt: string | null;
}

export type GamePlayer = Player & {
  points: number;
}