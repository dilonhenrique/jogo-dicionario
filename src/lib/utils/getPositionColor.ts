export function getPositionColor(position: number) {
  switch (position) {
    case 1:
      return "text-warning font-bold";
    case 2:
      return "text-cyan-600 font-bold";
    case 3:
      return "text-amber-700 font-bold";
    default:
      return "text-default-400";
  }
}