# Changelog

## 1.0.1

- The connection label now shows whether an account runs in Live or Sandbox mode, so multiple PolyDoc connections are easy to tell apart.
- Removed the Base URL field. The integration always uses the production API at api.polydoc.tech.
- Generate E-Invoice: the Invoice Data field links to a setup guide with a complete worked example.

## 1.0.0

Initial public release of the PolyDoc integration.

- New action: HTML/URL to PDF (create/create_pdf). Layout, margins, page format, page ranges, bookmarks, and tagged (accessible) output.
- New action: Capture Screenshot (create/create_screenshot). PNG, JPEG, or WebP, with full-page, viewport, and device-pixel-ratio control.
- New action: Generate E-Invoice (create/create_einvoice). Factur-X or ZUGFeRD hybrid PDF/A-3 invoices.
- Source content from a URL, inline HTML, or a saved PolyDoc template, plus an Advanced (JSON) field that reaches any API option not surfaced as a control.
- Deliver the result as a downloadable file, to cloud storage via a presigned URL, or to a webhook.
