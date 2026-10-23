import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const geminiPath = path.join(rootDir, 'GEMINI.md');

const pointerContent = `# Master Agent Operating Rules

> All active operating instructions, design tokens, workflow tier protocols, and domain rule paths are maintained centrally in **[\`AGENTS.md\`](./AGENTS.md)**.
> Refer directly to [\`AGENTS.md\`](./AGENTS.md) for current directives.
`;

fs.writeFileSync(geminiPath, pointerContent, 'utf8');
console.log('✓ Successfully ensured GEMINI.md points cleanly to AGENTS.md (no token duplication)');
