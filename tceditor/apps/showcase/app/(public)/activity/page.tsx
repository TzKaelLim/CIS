import type { Metadata } from "next";
import { cache } from "react";
import { Render } from "@tzuchi/tceditor/rsc";
import { demoAssetSource } from "@tzuchi/tceditor-blocks/demo-assets";
import { createRenderConfig } from "@tzuchi/tceditor-blocks/render";
import { loadActivity } from "../../../lib/activity-store";

// The page is read from disk on every request, so a publish shows up at once.
export const dynamic = "force-dynamic";

const config = createRenderConfig({ assets: demoAssetSource });

// generateMetadata and the page share one read per request.
const getActivity = cache(loadActivity);

const text = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : undefined;

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getActivity();
  const props: Record<string, unknown> = data.root.props ?? {};

  return { title: text(props.title), description: text(props.description) };
}

export default async function ActivityPage() {
  const { data } = await getActivity();

  return <Render config={config} data={data} />;
}
