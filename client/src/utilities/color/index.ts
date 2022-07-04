import chroma from 'chroma-js';

export function gradientFromColor(color: string, scale = 1): string[] {
  const chromaColor = chroma(color);
  const origL = chromaColor.get('hsl.l');
  const origS = chromaColor.get('hsl.s');
  const colors = [];
  for (let i = 6; i > 0; i--) {
    const l = origL + i * scale * (1 - origL) / 6;
    colors.push(chromaColor.set('hsl.l', l).hex());
  }
  colors.push(color);
  for (let i = -1; i >= -3; i--) {
    const l = origL + i * scale * origL / 5;
    const s = origS + i * scale * origS / 8;
    colors.push(
      chromaColor
        .set('hsl.l', l)
        .set('hsl.s', s)
        .hex()
    );
  }
  return colors;
}
