export function truncateFloat(n: number, places: number = 4) {
  return n.toFixed(places).replace(/\.?0+$/, '');
}
