# Changelog

## 1.0.4

- Generate E-Invoice: the Profile dropdown drops Minimum and Basic WL. Neither carries invoice lines, which EN 16931 requires (BR-16), and the PolyDoc API has answered both with 400 since 2026-09-19.
- The e-invoice setup guide documents three new optional fields the API accepts: `contactName` on seller and buyer (BT-41/BT-56), `electronicAddress` on seller and buyer (BT-34/BT-49), and `buyerItemId` on each line (BT-156).

## 1.0.3

- Connection label no longer includes the integration name. Zapier numbers multiple PolyDoc connections automatically.
- Reworded the action descriptions to start with a third-person verb (Converts, Captures, Generates).

## 1.0.2

- Security hardening: when merging the Advanced (JSON) field into the request, the integration now ignores the prototype-pollution keys __proto__, constructor, and prototype.

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
