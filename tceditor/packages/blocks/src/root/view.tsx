import type { ReactNode } from "react";

/**
 * The page wrapper. In the editor `children` is Puck's root drop zone, or an
 * unclassed div in the interactive preview (client Render), so blocks.css
 * also stacks `.tcb-page > [data-puck-dropzone]` and `.tcb-page > div:not([class])`.
 */
export function PageRootView({ children }: { children: ReactNode }) {
  return <main className="tcb-page tcb-stack">{children}</main>;
}
