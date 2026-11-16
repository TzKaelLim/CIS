import { validatePageJson } from "@tzuchi/tceditor-blocks/validator";
import { createActivityHandlers } from "../../../lib/activity-api";
import { getDataDir, getPresetPath } from "../../../lib/activity-store";

export const dynamic = "force-dynamic";

const handlers = createActivityHandlers({
  dataDir: getDataDir(),
  presetPath: getPresetPath(),
  validatePageJson,
});

export function GET() {
  return handlers.GET();
}

export function POST(req: Request) {
  return handlers.POST(req);
}
