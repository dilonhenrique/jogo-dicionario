export type User = {
  id: string;
  name: string;
}

export type Player = User & {
  onlineAt: string;
}