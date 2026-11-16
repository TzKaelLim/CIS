"use client";

import { useEffect } from "react";
import {
  Puck,
  type Data,
  type Overrides,
  type Viewports,
} from "@tzuchi/tceditor";
import headingAnalyzer from "@tzuchi/tceditor-plugin-heading-analyzer";
import { demoAssetSource } from "@tzuchi/tceditor-blocks/demo-assets";
import { createEditorConfig } from "@tzuchi/tceditor-blocks/editor";
import {
  publishActivity,
  publishCheckPlugin,
} from "../../../../lib/publish-check";

// Puck rebuilds its store whenever these change identity, so they live at
// module scope.
const config = createEditorConfig({ assets: demoAssetSource });

const plugins = [headingAnalyzer, publishCheckPlugin];

// The breakpoints of the Tzu Chi tokens.
const viewports: Viewports = [
  { width: 375, height: "auto", icon: "Smartphone", label: "手機" },
  { width: 768, height: "auto", icon: "Tablet", label: "平板" },
  { width: 1024, height: "auto", icon: "Monitor", label: "桌面" },
];

// Gives the preview iframe the public page's theme and language. The editor
// layout's <html> has no data-theme, so nothing overwrites these.
const ThemedIframe: Overrides["iframe"] = ({ children, document }) => {
  useEffect(() => {
    const html = document?.documentElement;

    if (!html) return;

    html.setAttribute("data-theme", "tzuchi");
    html.setAttribute("lang", "zh-Hant");
  }, [document]);

  return <>{children}</>;
};

const overrides: Partial<Overrides> = { iframe: ThemedIframe };

export function ActivityEditor({ initialData }: { initialData: Data }) {
  return (
    <Puck
      config={config}
      data={initialData}
      onPublish={publishActivity}
      plugins={plugins}
      viewports={viewports}
      overrides={overrides}
      headerTitle="活動頁"
      headerPath="/activity"
    />
  );
}
