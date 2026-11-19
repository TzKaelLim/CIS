"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  createUsePuck,
  useGetPuck,
  type Data,
  type Plugin,
} from "@tzuchi/tceditor";
import type { Issue } from "@tzuchi/tceditor-blocks/validator";
import styles from "./publish-check.module.css";
import {
  createPublishResultStore,
  describeIssue,
  findIssueBlockId,
  publishPage,
  type PublishResult,
} from "./publish-result";

const PLUGIN_NAME = "publish-check";

// A plugin panel's render function takes no props, so the publish result
// reaches the panel through this module-level store.
const store = createPublishResultStore();

let latestPublish = 0;

/** The <Puck onPublish> handler: posts the page and records the result. */
export async function publishActivity(data: Data): Promise<void> {
  const publish = ++latestPublish;

  store.set({ status: "publishing" });

  const result = await publishPage(data);

  // A slower, older request must not overwrite a newer result.
  if (publish === latestPublish) store.set(result);
}

const usePuck = createUsePuck();

function IssueList({ issues, page }: { issues: Issue[]; page: unknown }) {
  const config = usePuck((s) => s.config);
  const getPuck = useGetPuck();

  // The path points into the page that was published; its block id still
  // finds the block after later edits moved it. A deleted block is a no-op.
  const select = (issue: Issue) => {
    const id = findIssueBlockId(page, issue.path);

    if (id === undefined) return;

    const { dispatch, getSelectorForId } = getPuck();
    // null selects the page root, whose fields are the title and description.
    const itemSelector = id === null ? null : getSelectorForId(id);

    if (itemSelector === undefined) return;

    dispatch({
      type: "setUi",
      ui: { itemSelector, rightSideBarVisible: true },
    });
  };

  return (
    <ul className={styles["PublishCheck-list"]}>
      {issues.map((issue, index) => {
        const { block, field } = describeIssue(config, issue);

        return (
          <li key={`${issue.pathText}-${issue.code}-${index}`}>
            <button
              type="button"
              className={styles["PublishCheck-issue"]}
              onClick={() => select(issue)}
            >
              <span className={styles["PublishCheck-block"]}>
                {field === undefined ? block : `${block} › ${field}`}
              </span>
              <span>{issue.message}</span>
              <span className={styles["PublishCheck-path"]}>
                {issue.pathText}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

const statusText = (result: PublishResult) => {
  switch (result.status) {
    case "idle":
      return "尚未發布";
    case "publishing":
      return "發布中…";
    case "published":
      return result.notices.length === 0
        ? "沒有錯誤，已發布"
        : `沒有錯誤，已發布（${result.notices.length} 個提示）`;
    case "invalid":
      return `有 ${result.errors.length} 個錯誤，沒有發布`;
    case "failed":
      return result.message;
  }
};

function PublishCheckPanel() {
  const result = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  const getPuck = useGetPuck();

  // Bring the panel forward when a publish finishes.
  useEffect(() => {
    if (result.status === "idle" || result.status === "publishing") return;

    getPuck().dispatch({
      type: "setUi",
      ui: { plugin: { current: PLUGIN_NAME }, leftSideBarVisible: true },
    });
  }, [result, getPuck]);

  const tone =
    result.status === "published"
      ? styles["PublishCheck-status--ok"]
      : result.status === "invalid" || result.status === "failed"
      ? styles["PublishCheck-status--error"]
      : "";

  return (
    <div
      className={styles.PublishCheck}
      data-testid="publish-check"
      data-status={result.status}
    >
      <p className={`${styles["PublishCheck-status"]} ${tone}`} role="status">
        {statusText(result)}
      </p>
      {result.status === "invalid" && (
        <IssueList issues={result.errors} page={result.page} />
      )}
      {result.status === "published" && result.notices.length > 0 && (
        <IssueList issues={result.notices} page={result.page} />
      )}
    </div>
  );
}

function PublishCheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 7 2 2 4-4" />
      <path d="m3 17 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="M13 12h8" />
      <path d="M13 18h8" />
    </svg>
  );
}

/** The 發布檢查 panel: the result of the last publish and its issues. */
export const publishCheckPlugin: Plugin = {
  name: PLUGIN_NAME,
  label: "發布檢查",
  icon: <PublishCheckIcon />,
  render: PublishCheckPanel,
};
