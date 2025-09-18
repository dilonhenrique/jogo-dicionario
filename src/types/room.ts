export type Room = {
  code: string;
  host: {
    id: string;
    name: string;
  };
  createdAt: Date;
  expiresAt: Date;
}