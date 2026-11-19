// Reads wrangler's machine-readable output (WRANGLER_OUTPUT_FILE_PATH, ND-JSON) after
// `wrangler pages deploy`, checks that the deployment landed in the expected Cloudflare
// Pages environment, and writes deploy.env with the URL GitLab should show for the job's
// environment. Exits non-zero on any mismatch so the pipeline goes red instead of
// pointing the environment page at a stale or foreign site.
//
// usage: node scripts/ci/pages-deploy-env.mjs <production|preview> [output.ndjson] [deploy.env]
import { readFileSync, writeFileSync } from 'node:fs';

const [expected, inputPath = process.env.WRANGLER_OUTPUT_FILE_PATH, outPath = 'deploy.env'] =
  process.argv.slice(2);

if (expected !== 'production' && expected !== 'preview') {
  console.error('usage: pages-deploy-env.mjs <production|preview> [output.ndjson] [deploy.env]');
  process.exit(2);
}
if (!inputPath) {
  console.error('WRANGLER_OUTPUT_FILE_PATH is not set and no input path was given');
  process.exit(2);
}

const entries = readFileSync(inputPath, 'utf8')
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => JSON.parse(line));
const deploy = entries.filter((e) => e.type === 'pages-deploy-detailed').at(-1);

if (!deploy) {
  console.error(
    `no "pages-deploy-detailed" entry in ${inputPath} — did wrangler pages deploy run?`,
  );
  process.exit(1);
}
if (deploy.environment !== expected) {
  console.error(
    `deployment landed in the "${deploy.environment}" environment, expected "${expected}" ` +
      `(project production branch is "${deploy.production_branch}")`,
  );
  process.exit(1);
}
if (!deploy.url) {
  console.error('deployment entry has no url');
  process.exit(1);
}

// Preview: the branch alias (https://staging.<domain>) is the stable address; production: the
// project domain itself, which is the deployment URL minus its per-deployment hash label.
const domain = new URL(deploy.url).host.replace(/^[^.]+\./, '');
const pagesUrl = expected === 'production' ? `https://${domain}` : deploy.alias || deploy.url;

writeFileSync(outPath, `PAGES_URL=${pagesUrl}\n`);
console.log(`environment ${deploy.environment} (production branch: ${deploy.production_branch})`);
console.log(`deployment  ${deploy.url}`);
console.log(`url         ${pagesUrl}`);
