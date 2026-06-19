# Example assets for testing the PolyDoc Zapier integration

Self-contained sample documents for building test Zaps (one per action). The
HTML is intentionally free of external scripts, fonts, and stylesheets so it
renders reliably when pasted straight into an action's **HTML** source field.
The party names ("Your Company GmbH", "Customer Ltd.") are placeholders; replace
them with real details before any non-test use.

## Files

| File | Action | How to use |
|------|--------|------------|
| `invoice-pdf.html` | HTML/URL to PDF | Source = **HTML**, paste the file contents into the **HTML** field. |
| `invoice-pdf.html` | Capture Screenshot | Source = **HTML**, paste the same file. Set **Full Page** on, Image Type PNG. |
| `einvoice.html` + `einvoice.json` | Generate E-Invoice | Source = **HTML** (paste `einvoice.html`); paste `einvoice.json` into **Invoice Data (JSON)**. |

So the three files cover all three actions: the PDF invoice doubles as the
screenshot subject, and the e-invoice pair drives the e-invoice action.

## E-Invoice action settings

- Standard: **ZUGFeRD**
- Profile: **EN 16931**
- Verify: **on** (first run, to confirm compliance)
- Invoice Data (JSON): contents of `einvoice.json`

`einvoice.json` is consistent with `einvoice.html` (same number, parties, line
items, and totals) and meets EN 16931 minimums: due date plus payment terms,
seller tax ID for VAT category S, a tax summary, and net + tax = gross.
