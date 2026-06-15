// Barrel: registers every element (side effect) and re-exports classes.
// Used by the CDN bundle and by `import '@tzuchi/components'`.
// NOTE: the registration imports must be explicit here — a transitive
// side-effect import behind `export *` gets tree-shaken away.
import './button/tc-button-define.js';
import './icon/tc-icon-define.js';
import './icon-button/tc-icon-button-define.js';
import './input/tc-input-define.js';
import './card/tc-card-define.js';
import './tabs/tc-tabs-define.js';

export { TcButton } from './button/tc-button.js';
export { TcIcon } from './icon/tc-icon.js';
export { TcIconButton } from './icon-button/tc-icon-button.js';
export { TcInput } from './input/tc-input.js';
export { TcCard } from './card/tc-card.js';
export { TcTabs } from './tabs/tc-tabs.js';
export { TcTab } from './tabs/tc-tab.js';
