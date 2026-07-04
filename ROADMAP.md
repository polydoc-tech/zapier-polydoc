# Zapier PolyDoc connector - implementation roadmap

Living roadmap for the Zapier integration, built per `../../CONNECTOR-PLAYBOOK.md`,
mirroring the n8n reference (`../../n8n-nodes-polydoc`). Fresh standalone repo at
`~/Projects/polydoc/tools/zapier-polydoc/`.

Status legend: ☐ todo · ◐ in progress · ☑ done

---

## 0. Decision record (why this shape)

Zapier is a published, review-gated CLI platform integration (`zapier-platform-core`,
Node 22). The playbook model maps on cleanly, with these platform-specific calls:

| Decision | Choice | Why |
|---|---|---|
| Action modeling | **Three creates** (Create PDF, Capture Screenshot, Generate E-Invoice) | Zapier surfaces each action in its picker. Three actions give three indexed App Directory pages, three Zap-template hooks, and the SEO the marketing roadmap wants. (n8n used one node + an operation dropdown because that is the n8n idiom; Airtable used one extension panel for the same reason.) |
| File output | **`z.stashFile` to a Zapier File URL** in a `file` output field | Zapier creates return JSON, never raw binary. Stashing makes the PDF/image usable by downstream attach/upload steps. Cloud Storage / Webhook delivery return the API JSON as-is. |
| Language / tests | **TypeScript + vitest** | Matches the PolyDoc connector family. `zapier-platform test` just runs `npm test`, so vitest is fine. |
| Auth test | **Function POSTing a sandbox screenshot** | PolyDoc has no cheap auth-only endpoint. `X-Sandbox: true` forces sandbox so the test never touches production quota. A working test is mandatory for App Directory review. |
| Publishing | **register -> push -> promote -> App Directory review** | No npm publish / OIDC / provenance (that is the n8n path). |
| Template ID field | **Plain string, not a dynamic dropdown** | PolyDoc has only 2 endpoints and no list-templates endpoint, so a dynamic dropdown is impossible. `zapier-platform validate` flags this as a non-blocking D004 warning; expected. |

No cross-repo dependency: the integration runs server-side on Zapier, so (unlike
the Airtable Blocks extension) no `polydoc-gateway` CORS change is needed.

### Free vs paid (the cost answer)

- Build + `validate` + unit/live tests: **free** (local tooling + the sandbox key).
- `register` + `push` + private use + inviting testers: **free**.
- App Directory listing (going public): **free**, but review-gated (human review).
- Net: no paid plan needed. Use the dev account `hello@polydoc.tech` / `polydoc-tech`.

---

## 1. Product model (mirror the n8n node exactly)

PolyDoc API = 2 endpoints: `POST /pdf/convert`, `POST /screenshot/convert`.
Auth `Authorization: Bearer <key>`; sandbox via per-request `X-Sandbox: true`
(so the credential test can force sandbox). Field source of truth:
`../../polydoc-gateway/src/schemas/{common,pdf,screenshot}.ts`.

Operations: **PDF** `/pdf/convert` · **Screenshot** `/screenshot/convert` ·
**E-Invoice** `/pdf/convert` with an `eInvoice` payload. Source mode: URL /
inline HTML / Template (`source: "[template:<id>]"` + templateData). Delivery:
Download (stash a File) / Cloud Storage (presigned) / Webhook, plus an
**Advanced (JSON)** deep-merge escape hatch.

The pure body builder (`src/lib/buildRequestBody.ts`) is ported near-verbatim
from the n8n `GenericFunctions.ts` so every connector assembles identical bodies.

### Three angle-split Zap templates (analog of the n8n template JSONs)

| n8n template | Zap template | Angle |
|---|---|---|
| `invoice-pdf-from-template.json` | "PDF from your data" (Sheets/DB row -> Create PDF -> email/Drive) | PDF |
| `url-screenshot-scheduled.json` | "Scheduled URL screenshot" (Schedule -> Capture Screenshot -> Slack/Drive) | Screenshot |
| `einvoice-webhook-to-pdf.json` | "Webhook to ZUGFeRD/Factur-X e-invoice" (Webhook -> Generate E-Invoice -> email) | E-Invoice |

Zapier Zap templates are authored in the developer dashboard (not committed JSON),
so they are built in Pass 3 after the first push.

---

## 2. Passes

### Pass 1 - Local integration code + tests ☑
The buildable, verifiable-now foundation.
- ☑ `package.json` (MIT, name `zapier-polydoc`, exact `zapier-platform-core` pin), `tsconfig`, `vitest.config`, `.gitignore`, `LICENSE`.
- ☑ `src/lib/buildRequestBody.ts` - ported pure helpers (`buildRequestBody`, `mergeDeep`, `defaultFilename`, `extractApiErrorMessage`).
- ☑ `src/authentication.ts` (apiKey/sandbox + sandbox-screenshot test + connectionLabel) and `src/middleware.ts` (Bearer beforeRequest).
- ☑ `src/lib/fields.ts`, `src/lib/perform.ts` (input -> params -> request -> stash/JSON), `src/lib/samples.ts`.
- ☑ `src/creates/{createPdf,createScreenshot,createEinvoice}.ts` + `src/index.ts` App definition.
- ☑ `test/buildRequestBody.test.ts` (14 unit cases) + `test/creates.test.ts` (live sandbox smoke, gated on `POLYDOC_API_KEY`).
- ☑ `npm run build` clean, `zapier-platform validate` structurally sound (0 errors, 0 publishing warnings), `npm test` green, live sandbox tests green (PDF/template/screenshot/e-invoice).
- ☑ `assets/polydoc-logo-1024.png` for the dashboard branding step.
- ☑ README, this ROADMAP, CI workflow.

### Pass 2 - Register + push + in-product verification ☑
- ☑ `npm i -g zapier-platform-cli`; `zapier-platform login` (dev account).
- ☑ `zapier-platform register "PolyDoc"` (writes `.zapierapprc`); upload `assets/polydoc-logo-1024.png` + brand color `#F04E23` + descriptions in the dashboard.
- ☑ `zapier-platform push`; connect a PolyDoc account (confirm the auth test passes, and fails on a wrong key).
- ☑ Run each create once end to end; confirm the `file` arrives and opens in a downstream step (Gmail attachment / Drive upload).
- ☑ Confirm Cloud Storage delivery returns JSON + lands in the presigned bucket; Webhook delivery posts to a RequestBin.

### Pass 3 - Zap templates + App Directory submission ◐
- ☑ Record the walkthrough video (connect -> test passes -> run each create); production key for clean (unwatermarked) output, self-contained demo HTML to avoid the CDN-script hang.
- ☑ `zapier-platform promote 1.0.3` and submit for App Directory review.
- ☑ **App Directory review APPROVED (2026-07-01).** Live public listing: https://zapier.com/apps/polydoc/integrations (Create PDF, Capture Screenshot, Generate E-Invoice).
- ☐ Author the three Zap templates above in the developer dashboard (public templates, distinct from the private tester Zaps built for the adoption gates).
- ◐ Rework the docs guide (`polydoc-web` `documentation/.../integrations/Zapier.tsx` + `zapier.md`) from the free-plan Code-by-Zapier workaround to the native PolyDoc app flow.
  - **Finding (verified live in the Zap editor, 2026-07-01):** the native **PolyDoc app is NOT Premium** (standard action, free-plan usable). **Webhooks by Zapier / Catch Hook IS Premium** (editor flags "using 1 Enterprise feature") - so the old guide's "Catch Hook is free" premise was wrong. Decision: switch the guide's trigger to **Google Sheets** (free standard app) for a genuinely free-plan example.
  - New flow: **Google Sheets (New Spreadsheet Row) -> PolyDoc (Create PDF, Source=Template, Delivery=Download) -> Gmail**. Delivery=Download returns a File Gmail attaches directly, so no Code step / no bucket. Action fields + the 3 action descriptions match the connector source exactly (confirmed live).
  - ☑ Text/structure rewrite done on branch `zapier-native-app-guide` (3 steps). tsc clean. IntegrationsIndex card refreshed to surface the native app. Old Catch Hook/Code webp deleted.
  - ☑ 3 screenshots captured (user) + processed via the guide-screenshots skill to 1622x1064 webp and wired in: `zapier-sheets-step1-trigger.webp`, `zapier-create-pdf-step2.webp`, `zapier-gmail-step3.webp`. Full `yarn build` green.
  - Step-3 Gmail screenshot recaptured to show the Attachments field bound to the PolyDoc File output (the distinctive integration point); alt text updated to match. All 3 shots now accurate.
  - ☐ Deploy via `polydoc-infra/scripts/12-deploy-static-sites.sh docs` (docs deploy is a manual script; merging pdoc-web main deploys nothing).

Publishing-check sequencing (the real blockers, all gated on adoption, not code):
- Pushed Zapier versions are immutable. The validate-warning fixes (cleanInputData
  flag, baseUrl drop, connectionLabel environment) land in **1.0.1**, not 1.0.0, so
  promote 1.0.1.
- S001 needs 3 distinct users with a live Zap, S002 needs >=1 live Zap per action,
  T001 a successful live run per action, A001 a connected account, all **on the
  promoted version** (1.0.1). Build the 3 tester Zaps on 1.0.1, free 2-step
  (Sheets/Tables -> PolyDoc action). M002: set the dashboard description to start
  "PolyDoc is a" (no "Zapier"). Also: integration-testing@zapier.com test account,
  an @polydoc.tech admin team member, and the e-invoice doc link
  (docs/einvoice.md) in the submission notes.
- 4 validate warnings remain, all by design and non-blocking: 3x template_id/D004
  (no list-templates API endpoint; see comment in src/lib/fields.ts) and 1x
  connectionLabel/D003 (the label is intentionally blank so Zapier auto-numbers
  connections, since PolyDoc auth exposes no account value; the App Directory
  reviewer endorsed this in the 1.0.3 review round).

Reviewer round 1 (on 1.0.2), addressed in 1.0.3:
- Connection label must not contain the integration name (req 5.6). Removed it;
  Zapier auto-numbers connections. No account/email value exists to show instead.
- Action descriptions must start with a third-person verb (req 5.8). Reworded to
  Converts / Captures / Generates.

---

## 3. Gotchas honored

- No em-dashes in any user-facing text (labels, helpText, descriptions, README).
- Zero runtime deps beyond `zapier-platform-core` (everything else devDeps).
- `raw: true` on the download path so the PDF/PNG is not JSON-parsed; `skipThrowForStatus` so errors are surfaced with the API's message.
- `X-Sandbox` per-request only (the test forces `true`; creates use the Sandbox toggle).
- E-invoice default + smoke test are EN16931-valid (dueDate, seller taxId for VAT cat S, net+tax=gross, taxSummary) so they 200 rather than 422.
- Sandbox output is watermarked and rate-limited (~5 req/sec); the live test runs serially.
- `zapier-platform-core` pinned to an exact version (validate requires it).

## 4. Open questions / known unknowns

- Whether to add conditional field display (Zapier `altersDynamicFields` function-form inputFields) for the source/delivery fields, vs the current show-all + perform-side validation. Current approach is robust; dynamic fields are a possible polish.
- Exact App Directory review turnaround and any extra branding assets they request at submission.
