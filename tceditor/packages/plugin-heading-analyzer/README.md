# plugin-heading-analyzer

Visualise your heading outline structure and identify missing heading levels. Respects WCAG 2.

<img src="https://i.imgur.com/POqtgHu.jpg" alt="example" width="156px" />

## Quick start

This package is not published to a registry. Add it to an app in this monorepo as a workspace dependency:

```sh
pnpm add @tzuchi/tceditor-plugin-heading-analyzer --workspace
```

```jsx
import { Puck } from "@tzuchi/tceditor";
import headingAnalyzer from "@tzuchi/tceditor-plugin-heading-analyzer";
import "@tzuchi/tceditor-plugin-heading-analyzer/dist/index.css";

...

// Render Puck
export function Page() {
  return <Puck
    config={config}
    data={data}
    plugins={[
        headingAnalyzer
    ]}
  />;
}
```

## License

MIT © [The Puck Contributors](https://github.com/puckeditor/puck/graphs/contributors). See `LICENSE` and `NOTICE`.
