import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  DEFAULT_LIMITS,
  type ValidateResult,
} from "@tzuchi/tceditor-blocks/validator";
import { ACTIVITY_FILE_NAME, readActivity } from "./activity-store";

/** 2 MB counted in UTF-8 bytes: the page validator's limit. */
export const MAX_BODY_BYTES = DEFAULT_LIMITS.maxBytes;

/** Host names the showcase is served under (it only listens on 127.0.0.1). */
export const DEFAULT_ALLOWED_HOSTNAMES: readonly string[] = [
  "127.0.0.1",
  "localhost",
];

export type ActivityHandlerOptions = {
  /** Directory of the published file; created on the first publish. */
  dataDir: string;
  /** JSON file served while nothing is published. */
  presetPath: string;
  validatePageJson: (raw: string | Uint8Array) => ValidateResult;
  /** Host names a publish may arrive under. Default: DEFAULT_ALLOWED_HOSTNAMES. */
  allowedHostnames?: readonly string[];
};

export type ActivityHandlers = {
  GET(): Promise<Response>;
  POST(req: Request): Promise<Response>;
};

const NO_STORE = { "Cache-Control": "no-store" };

const fail = (status: number, error: string, message: string) =>
  Response.json({ error, message }, { status, headers: NO_STORE });

/** Content-Type must be application/json; parameters such as charset are allowed. */
const isJsonContentType = (value: string | null) =>
  value !== null &&
  value.split(";")[0].trim().toLowerCase() === "application/json";

/** The host name of a Host header ("127.0.0.1:3010" → "127.0.0.1"), or null. */
const hostnameOf = (host: string) => {
  try {
    return new URL(`http://${host}`).hostname;
  } catch {
    return null;
  }
};

/**
 * Same-origin check (spec §10.2). The expected origin comes from the Host
 * header, not from req.url: under `next start -H 127.0.0.1`, req.url still
 * says localhost. The Host must also name this machine, so that a page on
 * another site cannot get in by pointing its own host name at 127.0.0.1
 * (DNS rebinding), where its Origin and Host would agree.
 */
const isSameOrigin = (req: Request, allowedHostnames: readonly string[]) => {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (origin === null || host === null) return false;

  const hostname = hostnameOf(host);

  return (
    hostname !== null &&
    allowedHostnames.includes(hostname) &&
    origin === `http://${host}`
  );
};

/**
 * Reads the body as bytes and stops as soon as it is larger than `max`.
 * Returns null when it is too large.
 */
async function readBodyWithLimit(
  req: Request,
  max: number
): Promise<Uint8Array | null> {
  const declared = Number(req.headers.get("content-length"));

  if (Number.isFinite(declared) && declared > max) return null;
  if (!req.body) return new Uint8Array(0);

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) break;

    total += value.byteLength;

    if (total > max) {
      await reader.cancel();
      return null;
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

/**
 * Replaces `file` in one step: writes a temporary file in the same directory,
 * then renames it over the target. A failed write leaves the previous file
 * untouched and removes the temporary file.
 */
async function writeFileAtomically(dir: string, file: string, text: string) {
  await mkdir(dir, { recursive: true });

  const temporary = join(dir, `.${ACTIVITY_FILE_NAME}.${randomUUID()}.tmp`);

  try {
    await writeFile(temporary, text, { encoding: "utf8", flag: "wx" });
    await rename(temporary, file);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

/**
 * The showcase's publish API, a stand-in for S3's save API: GET returns the
 * current page, POST validates a page and publishes it.
 */
export function createActivityHandlers(
  options: ActivityHandlerOptions
): ActivityHandlers {
  const file = join(options.dataDir, ACTIVITY_FILE_NAME);
  const allowedHostnames =
    options.allowedHostnames ?? DEFAULT_ALLOWED_HOSTNAMES;

  return {
    async GET() {
      const { data } = await readActivity(options);

      return Response.json(data, { headers: NO_STORE });
    },

    async POST(req) {
      if (!isSameOrigin(req, allowedHostnames)) {
        return fail(403, "forbidden_origin", "只接受從本站送出的發布請求。");
      }

      if (!isJsonContentType(req.headers.get("content-type"))) {
        return fail(
          415,
          "unsupported_media_type",
          "發布請求的 Content-Type 必須是 application/json。"
        );
      }

      const bytes = await readBodyWithLimit(req, MAX_BODY_BYTES);

      if (bytes === null) {
        return fail(
          413,
          "too_large",
          "頁面資料超過 2 MB（2,097,152 bytes，以 UTF-8 計算）的上限，沒有發布。"
        );
      }

      const result = options.validatePageJson(bytes);

      if (!result.ok) {
        return Response.json(
          { errors: result.errors },
          { status: 422, headers: NO_STORE }
        );
      }

      try {
        await writeFileAtomically(
          options.dataDir,
          file,
          `${JSON.stringify(result.data, null, 2)}\n`
        );
      } catch (error) {
        console.error("Failed to write the published page:", error);

        return fail(500, "write_failed", "頁面沒有存檔成功，請再發布一次。");
      }

      return Response.json(
        { notices: result.notices },
        { status: 200, headers: NO_STORE }
      );
    },
  };
}
