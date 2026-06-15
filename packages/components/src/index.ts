// Barrel: registers every element (side effect) and re-exports classes.
// Used by the CDN bundle and by `import '@tzuchi/components'`.
// NOTE: the registration imports must be explicit here — a transitive
// side-effect import behind `export *` gets tree-shaken away.
import './button/tc-button-define.js';

export { TcButton } from './button/tc-button.js';
