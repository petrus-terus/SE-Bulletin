import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const agentsPath = path.join(rootDir, 'AGENTS.md');
const geminiPath = path.join(rootDir, 'GEMINI.md');

if (!fs.existsSync(agentsPath)) {
  console.error('[sync-agent-docs] Error: AGENTS.md not found at root.');
  process.exit(1);
}

const content = fs.readFileSync(agentsPath, 'utf8');
fs.writeFileSync(geminiPath, content, 'utf8');
console.log('✓ Successfully synced AGENTS.md -> GEMINI.md');
