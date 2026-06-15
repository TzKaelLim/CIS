import { writeFileSync } from 'node:fs';

// The CDN bundle is a side-effect-only module (registers all elements) consumed
// via <script>. Emit a minimal declaration so the `./cdn` export is fully typed.
writeFileSync(new URL('./dist/cdn/tc-components.d.ts', import.meta.url), 'export {};\n');
