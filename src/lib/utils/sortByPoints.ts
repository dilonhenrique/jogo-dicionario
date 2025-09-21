import { GamePlayer } from "@/types/user";
import { sortBy } from "lodash";

function pointSorter(item: GamePlayer) {
  return item.points * -1;
}

export function sortByPoints(players: GamePlayer[]): GamePlayer[] {
  return sortBy(players, [pointSorter, "name"]);
}