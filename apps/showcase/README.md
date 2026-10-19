# @tzuchi/tceditor-showcase

The tceditor showcase (spec §10): an activity page built from the 8 demo
blocks of `@tzuchi/tceditor-blocks`.

| Path                 | What it is                                                              |
| -------------------- | ----------------------------------------------------------------------- |
| `/activity/edit`     | The editor. Loads the published page, or `content/activity.preset.json` |
| `/activity`          | The public page, rendered on the server with `@tzuchi/tceditor/rsc`     |
| `GET /api/activity`  | The current page data                                                   |
| `POST /api/activity` | Publish: validates the page, then writes it                             |

```sh
pnpm dev:showcase   # http://127.0.0.1:3010/activity/edit (bound to 127.0.0.1)
```

Published pages go to `apps/showcase/.data/activity.json` (gitignored), or to
`$SHOWCASE_DATA_DIR/activity.json`. Delete the file to go back to the preset.
