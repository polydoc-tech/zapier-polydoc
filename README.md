# zapier-polydoc

A [Zapier](https://zapier.com) integration for [PolyDoc](https://polydoc.tech), a REST API that converts HTML or URLs to **PDF**, captures **screenshots**, and generates EU-compliant **e-invoices** (Factur-X / ZUGFeRD hybrid PDF/A-3).

Three actions:

- **Create PDF** - layout, margins, page format, page ranges, bookmarks, accessible/tagged PDFs.
- **Capture Screenshot** - PNG / JPEG / WebP, full page, viewport and device-pixel-ratio control.
- **Generate E-Invoice** - Factur-X or ZUGFeRD, profiles from `minimum` to `extended`. Setup walkthrough and a complete worked example: [docs/einvoice.md](./docs/einvoice.md).

Content can come from a **URL**, an inline **HTML** string, or a saved **template** (with Liquid template data). Each action returns a Zapier **File** by default (ready to attach in a downstream Gmail, Drive, or Slack step), or uploads to your **cloud storage** (presigned URL) or delivers to a **webhook**.

## Connect your account

Create a **PolyDoc API key** at [dashboard.polydoc.tech](https://dashboard.polydoc.tech) (API Keys). Paste it into the **API Key** field when connecting. Toggle **Sandbox** to draw sandbox quota (watermarked output) while testing. The key is sent as `Authorization: Bearer <key>`; the connection test runs a tiny sandbox screenshot to confirm it works.

## What you get back

Each action returns:

- `file` - a Zapier-hosted **File** (use it as an attachment or upload in the next step). Returned for **Download** delivery.
- `filename`, `contentType`, `sizeBytes`, `conversionId`, `creditUsed` - metadata.

**Cloud Storage** and **Webhook** delivery return the API's JSON confirmation instead of a file.

## Anything not in the UI?

Every action has an **Advanced (JSON)** field that is deep-merged into the request body, so any API capability not surfaced as a control (for example `pdf.watermark`, `pdf.pdfa`, `pdf.encryption`, `render.*`, `request.*`) is still reachable. See the full request schema at [docs.polydoc.tech](https://docs.polydoc.tech).

## Zap templates

Three example Zaps ship in the App Directory, one per angle (see `ROADMAP.md`):

- **PDF from your data** - a Sheets/Airtable/DB row to a branded PDF, emailed or saved.
- **Scheduled URL screenshot** - capture a URL on a schedule to Slack or Drive.
- **Webhook to e-invoice** - POST an invoice to a webhook, get back a ZUGFeRD / Factur-X PDF.

## Development

```bash
npm install
npm run build        # tsc -> dist/
npm test             # unit tests (request body builder)
npx zapier-platform validate   # structural + conformance checks
```

Live smoke test against the real API (uses sandbox quota):

```bash
POLYDOC_API_KEY=api_xxx POLYDOC_TEMPLATE_ID=jlE-whg npm run test:integration
```

Push a private version to your Zapier editor:

```bash
npx zapier-platform login
npx zapier-platform register "PolyDoc"   # first time only
npx zapier-platform push
```

## License

[MIT](./LICENSE)
