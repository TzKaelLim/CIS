import StyleDictionary from 'style-dictionary';
import { appendFileSync, readFileSync, rmSync } from 'node:fs';
import baseConfig from './style-dictionary.config.mjs';
import darkConfig from './style-dictionary.dark.config.mjs';

// 1. Base (light) build: primitives + light semantics + components → tokens.css
//    (with :root), plus tokens.js / tokens.d.ts.
const base = new StyleDictionary(baseConfig);
await base.cleanAllPlatforms();
await base.buildAllPlatforms();

// 2. Dark build: emit the selector-scoped dark block to dist/_dark.css …
const dark = new StyleDictionary(darkConfig);
await dark.buildAllPlatforms();

// 3. … then concatenate it onto tokens.css so a single stylesheet carries both
//    themes, and drop the temp file.
const darkBlock = readFileSync(new URL('./dist/_dark.css', import.meta.url), 'utf8');
appendFileSync(new URL('./dist/tokens.css', import.meta.url), `\n${darkBlock}`);
rmSync(new URL('./dist/_dark.css', import.meta.url));

console.log('tokens built (light + dark)');
