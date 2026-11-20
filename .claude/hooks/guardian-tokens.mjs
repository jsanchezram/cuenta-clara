// Hook PostToolUse (Edit|Write): ningún color hex fuera de styles/tokens.css.
// Lee el evento por stdin, revisa el archivo editado completo y, si encuentra
// un color hex, sale con código 2: Claude Code le muestra el error a Claude
// para que lo corrija usando un token.
import { readFileSync, existsSync } from "node:fs";
import { relative, extname, resolve } from "node:path";

const evento = JSON.parse(readFileSync(0, "utf8"));
const ruta = evento.tool_input?.file_path ?? "";
const raiz = process.env.CLAUDE_PROJECT_DIR ?? evento.cwd ?? process.cwd();
const rel = relative(raiz, resolve(raiz, ruta)).replaceAll("\\", "/");

// Solo se revisa el código de la app. tokens.css es el único lugar permitido.
const revisar =
  [".css", ".html", ".js"].includes(extname(rel)) &&
  rel !== "styles/tokens.css" &&
  !rel.startsWith("..") &&
  !rel.startsWith(".claude/");

if (!revisar || !existsSync(ruta)) process.exit(0);

// Un color hex: # + 3, 4, 6 u 8 dígitos hex, sin letras ni dígitos después.
// Se ignoran los enlaces a anclas (href="#…") y los selectores de id en CSS (#id {).
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g;

const hallazgos = [];
readFileSync(ruta, "utf8").split(/\r?\n/).forEach((linea, i) => {
  for (const m of linea.matchAll(HEX)) {
    const antes = linea.slice(0, m.index);
    const despues = linea.slice(m.index + m[0].length);
    if (/href=["']$/.test(antes)) continue; // ancla
    if (extname(rel) === ".css" && /^\s*[{,.:\[>~+]/.test(despues) && !/:\s*[^;]*$/.test(antes)) continue; // selector #id
    hallazgos.push(`  ${rel}:${i + 1}  ${m[0]}  →  ${linea.trim()}`);
  }
});

if (hallazgos.length) {
  console.error(
    `Guardián de tokens: hay ${hallazgos.length} color(es) hex fuera de styles/tokens.css.\n` +
      hallazgos.join("\n") +
      `\nUsa un token semántico o de componente (var(--color-…)). Si falta, créalo en tokens.css en sus 3 capas y en el tema oscuro.`
  );
  process.exit(2);
}
process.exit(0);
