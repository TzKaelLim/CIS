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
import './radio/tc-radio-define.js';
import './chip/tc-chip-define.js';
import './link/tc-link-define.js';
import './pagination/tc-pagination-define.js';
import './dropdown/tc-dropdown-define.js';
import './article-card/tc-article-card-define.js';
import './book-card/tc-book-card-define.js';
import './list-panel/tc-list-panel-define.js';

export { TcButton } from './button/tc-button.js';
export { TcIcon } from './icon/tc-icon.js';
export { TcIconButton } from './icon-button/tc-icon-button.js';
export { TcInput } from './input/tc-input.js';
export { TcCard } from './card/tc-card.js';
export { TcTabs } from './tabs/tc-tabs.js';
export { TcTab } from './tabs/tc-tab.js';
export { TcRadio } from './radio/tc-radio.js';
export { TcChip } from './chip/tc-chip.js';
export { TcLink } from './link/tc-link.js';
export { TcPagination } from './pagination/tc-pagination.js';
export { TcDropdown } from './dropdown/tc-dropdown.js';
export { TcArticleCard } from './article-card/tc-article-card.js';
export { TcBookCard } from './book-card/tc-book-card.js';
export { TcListPanel } from './list-panel/tc-list-panel.js';
