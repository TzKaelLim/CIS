# tceditor 自架 Supabase（本機開發）

tceditor 本機開發用的自架 Supabase，與本機其他 Supabase stack（tciam、tcdata 等）互不干擾。設計見 `docs/superpowers/specs/2026-10-08-s1-fork-baseline-design.md` §7。

## 組成

| 路徑                                 | 內容                                                                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docker/`                            | 官方 [supabase/supabase](https://github.com/supabase/supabase) 的 `docker/` 目錄，ref 記在 `docker/.supabase-version`。官方檔案一律不改，Prettier 也略過整個目錄。 |
| `LICENSE`                            | `docker/` 內官方檔案的授權（Apache License 2.0，取自同一個 ref）。根目錄的 MIT 授權不涵蓋這些檔案。                                                                |
| `docker/docker-compose.tceditor.yml` | tceditor 的 override：compose 專案名 `tceditor`、container 名稱 `tceditor-*`、host port 只綁 `127.0.0.1`、Realtime 的網路別名。                                    |
| `setup-env.sh`                       | 產生 `docker/.env`（祕密由官方 `utils/generate-keys.sh` 產生）。`.env` 已存在時拒絕覆蓋。                                                                          |
| `up.sh` / `down.sh` / `reset.sh`     | 啟動、停止、清除資料。三者共用 `lib.sh`，只會操作 `tceditor` 這個 compose 專案。                                                                                   |

不含 logs 子系統（Logflare、Vector），也不含寄信服務：Auth 設為 email 自動確認。

## Port

| 服務                                   | host port        |
| -------------------------------------- | ---------------- |
| API gateway（Envoy，同時提供 Studio）  | `127.0.0.1:8200` |
| Postgres（Supavisor session 模式）     | `127.0.0.1:5434` |
| Postgres（Supavisor transaction 模式） | `127.0.0.1:6545` |

`up.sh` 啟動前會用 `lsof` 與 `nc` 檢查這些 port；被其他程式佔用就停止，不會啟動。

## 需求

- Docker Desktop，Compose v2.24.4 以上（override 用到 `!override`）。
- `openssl`、`lsof`、`nc`（macOS 內建）。

## 第一次使用

```sh
infra/supabase/setup-env.sh
infra/supabase/up.sh
```

## 日常操作

| 指令                      | 作用                                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `infra/supabase/up.sh`    | 啟動，並等到所有服務都是 healthy。                                                                                                                 |
| `infra/supabase/down.sh`  | 停止並移除 container；資料保留。                                                                                                                   |
| `infra/supabase/reset.sh` | 刪除 `tceditor` 的 container、volume 與 `docker/volumes/db/data`、`docker/volumes/storage`。要輸入專案名稱確認，或加 `--yes`。`docker/.env` 保留。 |

在 `docker/` 目錄裡直接執行 `docker compose ...` 也可以：`.env` 的 `COMPOSE_FILE` 會疊上 `docker-compose.tceditor.yml`，專案名同樣是 `tceditor`。但 docker compose 會讓 shell 中 export 的同名變數（例如為其他 stack 設過的 `POSTGRES_PASSWORD`）蓋過 `.env`；三個腳本會先清掉這些變數，所以啟動與清除資料請用腳本。

## 帳密與金鑰

全部在 `infra/supabase/docker/.env`（不進版控，權限 600）：

| 用途                                            | `.env` 的鍵                                |
| ----------------------------------------------- | ------------------------------------------ |
| Studio 登入（瀏覽器開 `http://127.0.0.1:8200`） | `DASHBOARD_USERNAME`、`DASHBOARD_PASSWORD` |
| API key                                         | `ANON_KEY`、`SERVICE_ROLE_KEY`             |
| Postgres（使用者 `postgres.tceditor`）          | `POSTGRES_PASSWORD`                        |

```sh
sed -n 's/^DASHBOARD_USERNAME=//p; s/^DASHBOARD_PASSWORD=//p' infra/supabase/docker/.env
```

## 快速檢查

```sh
ANON_KEY=$(sed -n 's/^ANON_KEY=//p' infra/supabase/docker/.env)
curl -sS -o /dev/null -w '%{http_code}\n' -H "apikey: ${ANON_KEY}" http://127.0.0.1:8200/auth/v1/settings
```

預期輸出 `200`。注意：官方 gateway 只允許 `SERVICE_ROLE_KEY` 讀取 `/rest/v1/` 根路徑（OpenAPI 描述），用 anon key 會得到 `403 RBAC: access denied`，這是官方設定，不是故障；anon key 查詢資料表（`/rest/v1/<table>`）則正常。

## 注意事項

- 不要執行 `docker/reset.sh`（官方版本）。它以 `docker-compose.yml` 加 `dev/docker-compose.dev.yml` 操作，專案名會變成 `supabase`，並會重設 `.env`。清除資料一律用 `infra/supabase/reset.sh`。
- 更換祕密：`reset.sh` → 刪除 `docker/.env` → `setup-env.sh` → `up.sh`。資料庫初始化後就固定使用當時的密碼，只換 `.env` 會讓服務連不上資料庫。
- `SITE_URL` 目前指向 gateway（`http://127.0.0.1:8200`）。之後串接前端時，改成前端網址並重新啟動。
- 升級官方版本屬於另一項工作：官方的 `docker/update.sh` 會以 `.supabase-version` 為基準做三方合併，升級後要重新跑一次上面的檢查。
