// Expande los marcadores <!--icon:nombre--> de las páginas HTML al SVG de js/components/ui/icons.js.
// Así los íconos estáticos (menú, barra de período) salen de la misma fuente que los de los componentes.
// Uso: node scripts/expandir-iconos.mjs   (idempotente: un SVG ya expandido conserva su marcador)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { icon, ICON_NAMES } from '../js/components/ui/icons.js';

const root = fileURLToPath(new URL('..', import.meta.url));
// Un marcador y, si ya se expandió antes, el SVG que lo sigue
const MARKER = /<!--icon:([a-z_-]+)-->(<svg class="icon"[^>]*>.*?<\/svg>)?/g;

let total = 0;
for (const file of readdirSync(root).filter((f) => f.endsWith('.html'))) {
  const path = join(root, file);
  const html = readFileSync(path, 'utf8');
  let count = 0;
  const out = html.replace(MARKER, (_, name) => {
    if (!ICON_NAMES.includes(name)) throw new Error(`${file}: ícono desconocido "${name}"`);
    count++;
    return `<!--icon:${name}-->${icon(name)}`;
  });
  if (out !== html) writeFileSync(path, out);
  total += count;
  console.log(`${file}: ${count} íconos`);
}
console.log(`Total: ${total} íconos expandidos.`);
