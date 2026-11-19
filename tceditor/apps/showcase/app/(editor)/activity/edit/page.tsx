import type { Metadata } from "next";
import type { Data } from "@tzuchi/tceditor";
import { loadActivity } from "../../../../lib/activity-store";
import { ActivityEditor } from "./client";

// Always load the latest published page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "編輯活動頁" };

/** `?blank=1` starts from an empty page (used by the showcase smoke test). */
const BLANK_PAGE: Data = { root: { props: {} }, content: [] };

export default async function ActivityEditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { blank } = await searchParams;
  const data = blank === "1" ? BLANK_PAGE : (await loadActivity()).data;

  return <ActivityEditor initialData={data} />;
}
