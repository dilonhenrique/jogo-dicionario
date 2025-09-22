"use server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function serverLog(...args: any[]) {
  console.log(...args);
}