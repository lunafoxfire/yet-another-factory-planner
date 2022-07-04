export function isTruthy(str: string | undefined): boolean {
  return !!str && !(str.toLowerCase() === 'false');
}
