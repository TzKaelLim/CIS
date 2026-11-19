# GitLab CI → Cloudflare Pages staging（HeroUI Storybook）

日期：2026-09-22　狀態：已上線（pipeline #10444 首次部署、#10450 驗證 cache 命中）
staging：https://staging.tzuchi-uikit.pages.dev

## 目標

每次 push 到受保護的工作分支（目前 `spike/heroui-v3`），自動把 `heroui/storybook` 建好並部署到
Cloudflare Pages 專案 `tzuchi-uikit` 的 **Preview 環境**，alias 固定為 `staging`，讓設計師用一個
穩定網址 review 慈濟主題（`tzuchi` / `tzuchi-dark`）的 HeroUI 元件。

「staging」指的是 Cloudflare Pages 的環境，不是 GitLab 分支——GitLab 端不新增任何分支。

## 非目標

- Lit Storybook（`apps/storybook`）、docs（`apps/docs`）、demo-html：不部署。
- Lit 元件的瀏覽器測試、`pnpm lint`、`typecheck`：不進 pipeline（前者需要 Chrome，後兩者與部署
  Storybook 無關）。之後要加是獨立的 job。
- MR pipeline、tag pipeline、每分支一個 preview 網址（blessing-item 模式）。

## 為什麼是 Direct Upload

自架 GitLab 用不了 Cloudflare 的 Git 整合（只支援 github.com / gitlab.com），所以由 CI 呼叫
`wrangler pages deploy` 直接上傳——這是 `tzuchi` 群組 8 個已部署專案的共同做法。鏡射到 gitlab.com
以換取 Git 整合被否決：多一套鏡射與權限，群組裡沒有先例。

## 設計

### 觸發與權限

| 分支 | job | Cloudflare 環境 | 網址 |
| --- | --- | --- | --- |
| `main` | `build` → `deploy:production` | Production | `https://<pages 網域>` |
| 其他 **protected** 分支 | `build` → `deploy:staging` | Preview，alias `staging` | `https://staging.<pages 網域>` |
| 其他非 protected 分支 | `build` → `deploy:not-protected`（只印原因） | — | — |

- `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` 是 `tzuchi` 群組層的 protected + masked 變數
  （scope `*`），只注入 protected branch 的 pipeline。因此 `spike/heroui-v3` 設為 protected branch：
  push / merge 限 Maintainers，**允許 force-push**；日常只有「不能用 `git push --delete` 刪這條分支」
  這一點改變。
- **刻意不用 wildcard**（`spike/*`）：protected 變數是帳號級、8 個專案共用的 token，拿得到它的 ref
  應該數得出來；wildcard 會讓任何 Maintainer 推任何 `spike/…` 分支、帶自己的 `.gitlab-ci.yml` 就取得
  token。要讓新分支上 staging，逐條加精確的保護規則。
- `deploy:staging` 的 rule 用 `$CI_COMMIT_REF_PROTECTED == "true"` 挑分支；job 內再斷言兩個變數非空，
  缺了就印出兩個可能原因並失敗。沒受保護的分支則由 `deploy:not-protected` 在 pipeline 頁面上說明
  「所以沒部署」——rules 不命中的 job 根本不會出現，綠色 pipeline 會誤導人以為 staging 更新了。
- 這些變數會注入 protected branch 的**每一個** job，包括跑上千個 npm 套件建置碼的 `build`。YAML 擋不掉
  （GitLab 無法對單一 job 排除變數；專案層同名變數也蓋不掉群組的 scope `*`）。緩解：token 的
  Cloudflare 權限維持最小（Account → Cloudflare Pages → Edit）。
- `deploy:production` 目前是 inert 的：這個檔案和 `heroui/` 併進 `main` 之前，`main` 上沒有 pipeline。
  併入後第一條 main pipeline 會自動上 Production（與群組其他專案一致，沒有人工閘門）。

### build job

`node:24`（engines `>=20`、仍內建 corepack、且 wrangler 4 要求 Node ≥ 22）、`tags: [docker]`
（另一台 shared runner 是 macOS shell executor，會接未標 tag 的 job 並忽略 `image`）。

1. `corepack enable pnpm && corepack install`：用 `package.json` `packageManager` 釘的 pnpm 10.26.1，
   只裝 pnpm 的 shim、不接管 npm / npx。
2. `pnpm install --frozen-lockfile`；store 放 `.pnpm-store/`、corepack 下載放 `.corepack/`，兩者用
   **固定** cache key（store 是 content-addressable，舊 store 照樣可用；以 lockfile 當 key 反而每次
   動 lockfile 就冷啟動）。
3. `pnpm --filter @tzuchi/tokens test`：build tokens + `check.mjs`（純 Node）。
4. `pnpm run heroui:theme` 後 `git diff --exit-code -- heroui/styles/themes/tzuchi/variables.css`：
   確保 commit 進去的生成檔與 tokens 同步。生成器沒有時間戳，本機驗證過可重現。
5. `pnpm run heroui:storybook:build` → artifact `heroui/storybook/storybook-static/`（約 18 MB、
   316 檔，保留 1 天；Pages 上限 20,000 檔、單檔 25 MiB）。`@heroui/react` / `@heroui/styles` 的
   `exports` 指向 `src/`，不需要先 build。
6. timeout 15 分鐘。實測（runner `gitlab-runner`）：冷啟動無 cache 131 秒、cache 命中 80 秒
   （`pnpm install` 5 秒、Vite 31 秒）；deploy 約 50 秒，其中 wrangler 只上傳有變的檔案。
7. `GIT_CLEAN_FLAGS: -ffdxq -e .pnpm-store/ -e .npm/ -e .corepack/`：runner 在每個 job 開頭
   `git clean` 上一個 job 留下的未追蹤檔，預設逐行印出——第一次 deploy job 的 log 就是這樣被
   `.pnpm-store/` 的 67,602 個檔案撐爆 4 MiB 上限、wrangler 輸出全被截掉。安靜刪除，並保留三個
   純快取目錄。

### deploy job（`.deploy` 模板，兩個 job 只差 alias / 環境）

1. 斷言兩個 Cloudflare 變數非空。
2. `wrangler pages project create tzuchi-uikit --production-branch=main || true`（第一次建專案；
   不遮 stderr，token 權限不足之類的真正錯誤要留在 log）。
3. `wrangler pages deploy heroui/storybook/storybook-static --project-name=tzuchi-uikit
   --branch=<staging|main> --commit-hash=$CI_COMMIT_SHA --commit-message=$CI_COMMIT_SHORT_SHA
   --commit-dirty=true`。commit message 只放 ASCII 的 short SHA，避開 wrangler 對中文 commit
   訊息的 UTF-8 bug（Cloudflare API 8000111，群組內兩個專案踩過）。
4. `scripts/ci/pages-deploy-env.mjs <preview|production>` 讀 wrangler 的機器可讀輸出
   （`WRANGLER_OUTPUT_FILE_PATH`，ND-JSON 的 `pages-deploy-detailed` 項目）：
   - 斷言 `environment` 等於預期——Pages 專案的 production branch 若被改掉（例如有人在別的分支上
     手動 `wrangler pages deploy`，wrangler 會用當下的 git 分支當 production branch 建專案），
     `main` 的部署會悄悄變成 preview，wrangler 仍 exit 0；
   - 用 Cloudflare 回報的 `alias`（preview）或部署網址去掉 hash 的網域（production）寫進 dotenv 給
     `environment.url`。`pages.dev` 名稱全球共用，被佔用時 Cloudflare 會加後綴，所以不猜、不用
     `tzuchi-uikit.pages.dev` 當 fallback（那可能是別人的網站）。
5. `WRANGLER_VERSION` 釘到 patch（`4.136.1`）：deploy job 的環境裡有帳號級 token，不讓 `npx -y`
   每次執行一個沒人看過的新版；升版是一個可 review 的 commit。群組其他專案用浮動 `@4` / `@latest`，
   這裡刻意不跟。`WRANGLER_SEND_METRICS=false`。
6. `resource_group: deploy` 序列化部署，並用 API 把 process mode 設成 `newest_first`
   （`PUT /projects/59/resource_groups/deploy`，YAML 設不了；預設 unordered 可能讓較舊的 commit
   後跑而蓋掉 staging）。`build` 設 `interruptible`，連續 push 時舊 pipeline 自動取消。

### 已知限制（設計師 / 維護者要知道）

- Cloudflare Pages 的 preview 與 production 部署預設**公開**且每個 `<hash>.<網域>` 網址永久有效。
  群組 8 個專案現況相同；若要限制，在 Cloudflare 專案設定用 Access policy 鎖 preview。
- **不要從 AI agent 的 shell 手動跑 `wrangler pages project create` / `pages deploy`**：wrangler
  ≥ 4.12x 偵測到 agent 環境時會把新的 Pages 專案委派成 Workers static-assets 部署，建出來的不是
  Pages 專案。讓 CI 建，或用一般終端機。

## 驗證

1. `glab ci lint` 通過；Prettier 與 ESLint 通過（`pnpm lint` 會檢查這個 YAML 與 `scripts/ci/`）。
2. `scripts/ci/pages-deploy-env.mjs` 以 fixture 跑過 preview / production / 環境不符 / 沒有部署
   項目 / 錯誤參數五條路徑。
3. push 後追 pipeline 到綠燈；從 `deploy:staging` 的 log 取得實際網址；再把 resource group 設成
   `newest_first`。
4. 用 Playwright 開 staging 網址：Storybook 載入、`tzuchi` / `tzuchi-dark` 主題各自套用
   （按鈕分別是 blue-900 / blue-300）、`--tc-*` tokens 有注入。同一支腳本已先在本機 build 上跑過。
5. 若 Cloudflare 配到帶後綴的網域，確認 GitLab 環境頁的連結（來自 dotenv）跟它一致。

## 沿用的群組慣例與出處

- pnpm + corepack、`.pnpm-store` cache、`WRANGLER_VERSION`、`CF_PAGES_PROJECT`：`tzuchi/link-portal`。
- `--commit-message="$CI_COMMIT_SHORT_SHA"` 與 `project create || true`：`tzuchi/60impact`、`tzuchi/60donation`。
- `tags: [docker]` 的原因：`tzuchi/link-portal` 的註解與 `tzuchi/Portalweb` 的 runner 遷移紀錄。

## 審查紀錄

push 前由三個獨立審查（GitLab CI 語意、wrangler / Cloudflare 行為、安全與失敗模式）共提出 31 條，
採納的改動：精確分支取代 wildcard、`deploy:not-protected` 佔位 job、固定 cache key + 40 分鐘
timeout、拿掉 `NODE_OPTIONS`、`corepack enable pnpm`、artifact 1 天、wrangler 釘版、關 telemetry、
不遮 `project create` 的 stderr、以結構化輸出取代 grep 反推網址並斷言環境、`resource_group`
`newest_first`。未採納：`deploy:production` 改 `when: manual`（與群組慣例不同，由 owner 決定）。
