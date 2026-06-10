# Generate E-Invoice: setup guide

The **Generate E-Invoice** action produces a hybrid **PDF/A-3** invoice: a normal,
human-readable PDF with a machine-readable **EN 16931** XML file embedded inside
it. The same file opens as a PDF for a person and parses as structured data for
accounting software. PolyDoc supports both **ZUGFeRD** (German) and **Factur-X**
(French) flavours of that standard.

This action has more moving parts than Create PDF, so this guide walks through
every input and gives a complete, working example you can paste in.

## The two inputs you must provide

An e-invoice carries the same information twice, so the action takes two separate
inputs and you fill in **both**:

1. **Source** (URL, HTML, or Template): this is what the PDF *looks like* to a
   human reading it. It is the visible invoice page.
2. **Invoice Data (JSON)**: this is the structured data that gets embedded as XML
   for machines. It drives EN 16931 validation.

Keep the two consistent (the same totals, dates, and parties). The Source renders
the picture; the Invoice Data is the source of truth for the embedded XML.

## Step by step in the Zap editor

1. Add an action step and pick **PolyDoc -> Generate E-Invoice**.
2. **Source**: choose `HTML` (simplest for testing) and paste an invoice HTML into
   the **HTML** field, or choose `Template` and supply a saved PolyDoc Template ID
   plus **Template Data (JSON)**.
3. **Standard**: `ZUGFeRD` or `Factur-X`. Both embed EN 16931 XML; pick the one
   your recipient expects.
4. **Profile**: `EN 16931` is the safe default. Lower profiles (`Minimum`,
   `Basic WL`, `Basic`) carry less data and validate more loosely; `Extended`
   carries more. Most real invoices use `EN 16931`.
5. **Invoice Data (JSON)**: paste the structured invoice (schema and example
   below). The field is prefilled with a valid example you can edit.
6. **Verify** (optional): turn on to have PolyDoc reject the result if it fails
   PDF/A or EN 16931 compliance, instead of returning a non-compliant file.
7. **Delivery**: leave on `Download (file)` to get a **File** you can attach in a
   later email step. `Cloud Storage` and `Webhook` return a JSON confirmation
   instead of a file.
8. **Filename** (optional): for example `invoice-INV-001.pdf`.

## Invoice Data (JSON) reference

Top level:

| Field | Required | Notes |
|---|---|---|
| `number` | yes | Invoice number, for example `INV-001`. |
| `issueDate` | yes | `YYYY-MM-DD`. |
| `dueDate` | see rules | `YYYY-MM-DD`. Provide this **or** `paymentTerms`. |
| `currencyCode` | yes | 3-letter ISO 4217, for example `EUR`. |
| `seller` | yes | Party object (see below). |
| `buyer` | yes | Party object. |
| `lines` | yes | At least one line item. |
| `taxSummary` | recommended | One entry per VAT rate. Strongly advised for EN 16931. |
| `paymentTerms` | see rules | Free text, for example `Net 30 days`. Provide this or `dueDate`. |
| `paymentMeans` | no | Bank details (IBAN/BIC) for payment. |
| `totalNetAmount` | yes | Sum of line totals, before tax. |
| `totalTaxAmount` | yes | Total VAT. |
| `totalGrossAmount` | yes | `net + tax`. |
| `note` | no | Free text shown on the invoice. |
| `buyerReference` | no | Buyer's reference / PO number. |

**Party** (`seller`, `buyer`):

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Legal name. |
| `address` | yes | Address object (see below). |
| `taxId` | seller: see rules | VAT ID. Required on the seller when any line uses VAT category `S`. |
| `email`, `phone` | no | Optional contact details. |

**Address**: `line1` (yes), `line2` (no), `city` (yes), `postalCode` (yes),
`countryCode` (yes, 2-letter ISO, for example `DE`).

**Line** (each entry in `lines`):

| Field | Required | Notes |
|---|---|---|
| `description` | yes | What was sold. |
| `quantity` | yes | Number. |
| `unitPrice` | yes | Price per unit. |
| `lineTotal` | yes | `quantity * unitPrice`. |
| `unitCode` | no | UN/ECE unit, for example `C62` (piece), `HUR` (hour). |
| `vatRate` | no | Percentage, for example `19`. |
| `vatCategoryCode` | no | EN 16931 category. `S` = standard rate, `Z` = zero, `E` = exempt. |

**Tax summary** (each entry in `taxSummary`): `categoryCode`, `rate`,
`taxableAmount`, `taxAmount` (all required within the entry).

**Payment means** (`paymentMeans`): `typeCode` (required, for example `58` for
SEPA credit transfer), plus optional `iban`, `bic`, `accountName`,
`paymentReference`.

## A complete, valid example

### Invoice Data (JSON)

Paste this into the **Invoice Data (JSON)** field. It passes EN 16931 validation:
totals reconcile, the seller has a VAT ID, there is a due date, and the tax
summary matches the lines.

```json
{
  "number": "INV-2026-014",
  "issueDate": "2026-06-01",
  "dueDate": "2026-07-01",
  "currencyCode": "EUR",
  "buyerReference": "PO-5582",
  "seller": {
    "name": "Northwind Studio GmbH",
    "address": {
      "line1": "Lindenstrasse 12",
      "city": "Berlin",
      "postalCode": "10969",
      "countryCode": "DE"
    },
    "taxId": "DE298765432",
    "email": "billing@northwind.example"
  },
  "buyer": {
    "name": "Meridian Retail SARL",
    "address": {
      "line1": "24 Rue de Rivoli",
      "city": "Paris",
      "postalCode": "75004",
      "countryCode": "FR"
    }
  },
  "lines": [
    {
      "description": "UX design retainer (June)",
      "quantity": 10,
      "unitCode": "HUR",
      "unitPrice": 120,
      "lineTotal": 1200,
      "vatRate": 19,
      "vatCategoryCode": "S"
    },
    {
      "description": "Design system license (annual)",
      "quantity": 1,
      "unitCode": "C62",
      "unitPrice": 300,
      "lineTotal": 300,
      "vatRate": 19,
      "vatCategoryCode": "S"
    }
  ],
  "taxSummary": [
    { "categoryCode": "S", "rate": 19, "taxableAmount": 1500, "taxAmount": 285 }
  ],
  "paymentMeans": {
    "typeCode": "58",
    "iban": "DE89370400440532013000",
    "bic": "COBADEFFXXX",
    "accountName": "Northwind Studio GmbH"
  },
  "paymentTerms": "Net 30 days",
  "totalNetAmount": 1500,
  "totalTaxAmount": 285,
  "totalGrossAmount": 1785,
  "note": "Thank you for your business."
}
```

### Source HTML

Paste this into the **HTML** field (with **Source** set to `HTML`). It is
self-contained, uses only inline CSS, and loads no external scripts or fonts, so
it renders reliably. Edit the values to match the JSON above.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2933; font-size: 13px; margin: 40px; }
  h1 { font-size: 26px; letter-spacing: 1px; margin: 0 0 4px; }
  .muted { color: #66707a; }
  .row { display: flex; justify-content: space-between; }
  .parties { margin: 28px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { text-align: left; border-bottom: 2px solid #1f2933; padding: 8px 6px; font-size: 11px; text-transform: uppercase; }
  td { padding: 8px 6px; border-bottom: 1px solid #e1e5ea; }
  .num { text-align: right; }
  .totals { width: 280px; margin-left: auto; margin-top: 16px; }
  .totals td { border: none; padding: 4px 6px; }
  .grand td { border-top: 2px solid #1f2933; font-weight: bold; font-size: 15px; }
</style>
</head>
<body>
  <div class="row">
    <div>
      <h1>INVOICE</h1>
      <div class="muted">INV-2026-014</div>
    </div>
    <div class="muted" style="text-align:right">
      Issued 2026-06-01<br />Due 2026-07-01
    </div>
  </div>

  <div class="row parties">
    <div>
      <strong>From</strong><br />
      Northwind Studio GmbH<br />
      Lindenstrasse 12<br />
      10969 Berlin, DE<br />
      VAT DE298765432
    </div>
    <div style="text-align:right">
      <strong>Bill to</strong><br />
      Meridian Retail SARL<br />
      24 Rue de Rivoli<br />
      75004 Paris, FR<br />
      Ref PO-5582
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Description</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Total</th></tr>
    </thead>
    <tbody>
      <tr><td>UX design retainer (June)</td><td class="num">10</td><td class="num">120.00</td><td class="num">1200.00</td></tr>
      <tr><td>Design system license (annual)</td><td class="num">1</td><td class="num">300.00</td><td class="num">300.00</td></tr>
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Net</td><td class="num">EUR 1500.00</td></tr>
    <tr><td>VAT 19%</td><td class="num">EUR 285.00</td></tr>
    <tr class="grand"><td>Total due</td><td class="num">EUR 1785.00</td></tr>
  </table>

  <p class="muted" style="margin-top:32px">
    Payment: IBAN DE89 3704 0044 0532 0130 00 (BIC COBADEFFXXX). Net 30 days.<br />
    Thank you for your business.
  </p>
</body>
</html>
```

## Validation rules (why you might get an HTTP 422)

The API rejects an invoice that is not EN 16931 compliant. The usual causes:

- **No payment date.** Provide `dueDate` **or** `paymentTerms` (EN 16931 rule
  BR-CO-25). The example has both.
- **Totals do not reconcile.** `totalNetAmount` must equal the sum of line totals,
  and `totalNetAmount + totalTaxAmount` must equal `totalGrossAmount`.
- **Missing seller VAT ID with standard-rated VAT.** When any line uses
  `vatCategoryCode: "S"`, the seller needs a `taxId`.
- **Wrong code lengths.** `currencyCode` is exactly 3 letters, `countryCode`
  exactly 2, and dates are `YYYY-MM-DD`.
- **No line items.** `lines` needs at least one entry.

Higher profiles (`en16931`, `extended`) validate more strictly than `minimum` or
`basic`. If you hit a 422, the error message names the failing rule.

## What you get back

With **Download** delivery the action returns:

- `file`: the PDF/A-3 e-invoice as a Zapier File, ready to attach in a Gmail,
  Outlook, or Drive step.
- `filename`, `contentType` (`application/pdf`), `sizeBytes`, `conversionId`,
  `creditUsed`.

With **Cloud Storage** or **Webhook** delivery you get the API's JSON confirmation
instead of a file.

## Full schema

The Invoice Data fields mirror the PolyDoc API e-invoice schema. The complete
reference, including every optional field and all profile differences, is at
[docs.polydoc.tech](https://docs.polydoc.tech).
