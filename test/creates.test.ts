import { describe, expect, it } from 'vitest';
import { buildRequestBody } from '../src/lib/buildRequestBody';
import { paramsFromInput } from '../src/lib/perform';

// Live smoke test against the real PolyDoc API. Skipped unless POLYDOC_API_KEY
// is set; always uses X-Sandbox so it draws sandbox quota, never production.
//
// It maps Zapier-style inputData (the exact field keys the creates produce)
// through paramsFromInput + buildRequestBody, then calls the live API. That
// validates the whole field-mapping + body-assembly chain against the live
// contract. The z.stashFile delivery path runs only on Zapier, so it is
// verified in-product during the push/connect step, not here.
const API_KEY = process.env.POLYDOC_API_KEY;
const BASE = (process.env.POLYDOC_BASE_URL ?? 'https://api.polydoc.tech').replace(/\/+$/, '');
const TEMPLATE_ID = process.env.POLYDOC_TEMPLATE_ID ?? 'jlE-whg';

async function call(input: Record<string, unknown>, operation: Parameters<typeof paramsFromInput>[1]) {
  const { endpoint, body } = buildRequestBody(paramsFromInput(input, operation));
  return fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'X-Sandbox': 'true',
    },
    body: JSON.stringify(body),
  });
}

describe('paramsFromInput source resolution', () => {
  it('infers HTML when the field is filled but Source is left on its url default', () => {
    const p = paramsFromInput({ html: '<h1>Invoice</h1>' }, 'einvoice');
    expect(p.sourceType).toBe('html');
    expect(p.html).toBe('<h1>Invoice</h1>');
    expect(p.url).toBeUndefined();
  });

  it('infers Template when only Template ID is filled', () => {
    const p = paramsFromInput({ template_id: 'jlE-whg' }, 'pdf');
    expect(p.sourceType).toBe('template');
    expect(p.templateId).toBe('jlE-whg');
  });

  it('honors the explicit Source when its matching field is filled', () => {
    const p = paramsFromInput({ source_type: 'url', url: 'https://example.com' }, 'pdf');
    expect(p.sourceType).toBe('url');
    expect(p.url).toBe('https://example.com');
  });

  it('keeps the explicit Source when more than one source field is filled (ambiguous)', () => {
    const p = paramsFromInput(
      { source_type: 'url', url: 'https://example.com', html: '<p>x</p>' },
      'pdf',
    );
    expect(p.sourceType).toBe('url');
  });
});

describe.skipIf(!API_KEY)('PolyDoc live API (sandbox)', () => {
  it('Create PDF from inline HTML returns a PDF', async () => {
    const res = await call({ source_type: 'html', html: '<h1>Smoke</h1>', delivery_mode: 'download' }, 'pdf');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/pdf');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('Create PDF from a saved template renders', async () => {
    const res = await call(
      { source_type: 'template', template_id: TEMPLATE_ID, delivery_mode: 'download' },
      'pdf',
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/pdf');
  });

  it('Capture Screenshot of a URL returns a PNG', async () => {
    const res = await call(
      { source_type: 'url', url: 'https://example.com', image_type: 'png', delivery_mode: 'download' },
      'screenshot',
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/png');
  });

  it('Generate E-Invoice (ZUGFeRD / EN 16931) returns a hybrid PDF', async () => {
    const invoice = {
      number: 'INV-SMOKE-1',
      issueDate: '2026-06-04',
      dueDate: '2026-07-04',
      currencyCode: 'EUR',
      seller: {
        name: 'Acme GmbH',
        address: { line1: 'Hauptstr. 1', city: 'Berlin', postalCode: '10115', countryCode: 'DE' },
        taxId: 'DE123456789',
      },
      buyer: {
        name: 'Buyer SARL',
        address: { line1: 'Rue 2', city: 'Paris', postalCode: '75001', countryCode: 'FR' },
      },
      lines: [
        { description: 'Widget', quantity: 2, unitPrice: 10, lineTotal: 20, vatRate: 19, vatCategoryCode: 'S' },
      ],
      taxSummary: [{ categoryCode: 'S', rate: 19, taxableAmount: 20, taxAmount: 3.8 }],
      paymentTerms: 'Net 30 days',
      totalNetAmount: 20,
      totalTaxAmount: 3.8,
      totalGrossAmount: 23.8,
    };
    const res = await call(
      {
        source_type: 'html',
        html: '<h1>Invoice INV-SMOKE-1</h1>',
        einvoice_standard: 'zugferd',
        einvoice_profile: 'en16931',
        invoice: JSON.stringify(invoice),
        delivery_mode: 'download',
      },
      'einvoice',
    );
    if (res.status !== 200) {
      // Surface the validation detail to make a failure actionable.
      throw new Error(`e-invoice failed (${res.status}): ${await res.text()}`);
    }
    expect(res.headers.get('content-type')).toContain('application/pdf');
  });
});
