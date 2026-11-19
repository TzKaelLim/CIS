import type { ReactNode } from "react";
// Puck mirrors the host page's styles into the preview iframe (CopyHostStyles),
// so the blocks render with the same CSS as the public page.
import "@tzuchi/tceditor-blocks/styles.css";
import "@tzuchi/tceditor-plugin-heading-analyzer/dist/index.css";

// No data-theme here: Puck copies the host <html> attributes onto the preview
// iframe after overrides.iframe has run, so a host data-theme would replace
// the theme that overrides.iframe sets (see client.tsx).
export default function EditorRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
