import { GameConfig, GameState } from "./game";

export type Room = {
  code: string;
  host: {
    id: string;
    name: string;
  };
  configs: GameConfig;
  createdAt: Date;
  expiresAt: Date;
};

export type RoomComplete = Room & { session: GameState | undefined };