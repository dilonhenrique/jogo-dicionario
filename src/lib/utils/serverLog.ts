"use server";

export async function serverLog(...args: string[]) {
  console.log(...args);
}