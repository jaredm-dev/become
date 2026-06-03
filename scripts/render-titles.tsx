import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Title from '../src/components/Title.tsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outDir = resolve(__dirname, '../title-renders');
mkdirSync(outDir, { recursive: true });

const stages = [
  { pct: 5,   name: '0-pristine' },
  { pct: 25,  name: '1-first-crack' },
  { pct: 50,  name: '2-splatter' },
  { pct: 70,  name: '3-heavy' },
  { pct: 90,  name: '4-distressed' },
  { pct: 100, name: '5-final-form' },
];

// Hi-res output: 2160x780 for poster quality (5.4x SVG viewBox 400x145)
const SCALE = 5.4;

const VIEWBOX_W = 400;
const VIEWBOX_H = 145;

for (const s of stages) {
  const svgEl = renderToStaticMarkup(Title({ pct: s.pct }) as any);
  // Wrap in an <svg> root if RSC stripped it — Title already returns <svg>, so use directly.
  let svg = svgEl;
  // Inject explicit width/height for the resvg renderer
  svg = svg.replace(
    /<svg\b[^>]*>/,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}" width="${Math.round(VIEWBOX_W * SCALE)}" height="${Math.round(VIEWBOX_H * SCALE)}">`
  );

  // Render
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: Math.round(VIEWBOX_W * SCALE) },
    background: '#0a0a0a',
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Arial Black',
    },
  });
  const png = resvg.render().asPng();
  const filename = `become-${s.pct.toString().padStart(3, '0')}pct-${s.name}.png`;
  writeFileSync(resolve(outDir, filename), png);
  console.log(`✓ ${filename}`);
}

console.log(`\nAll files in: ${outDir}`);
