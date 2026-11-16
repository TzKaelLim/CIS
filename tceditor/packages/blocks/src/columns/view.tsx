import type { ReactNode } from "react";
import { tokenClass } from "../token-classes";
import type { ColumnsProps } from "./spec";

/** 2 or 3 columns side by side; one column per row below the tablet breakpoint (blocks.css). */
export function ColumnsView({
  columns,
  gap,
}: {
  columns: { content: ReactNode }[];
  gap: ColumnsProps["gap"];
}) {
  const classes = [
    "tcb-columns",
    columns.length === 3 ? "tcb-columns--3" : "tcb-columns--2",
    tokenClass("space", "gap", gap),
  ];
  return (
    <div className={classes.filter(Boolean).join(" ")}>
      {columns.map((column, index) => (
        <div key={index} className="tcb-columns-column">
          {column.content}
        </div>
      ))}
    </div>
  );
}
