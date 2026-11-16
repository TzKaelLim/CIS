import type { ReactNode } from "react";
import "@tzuchi/tceditor-blocks/styles.css";

export default function PublicRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="zh-Hant" data-theme="tzuchi">
      <body>{children}</body>
    </html>
  );
}
