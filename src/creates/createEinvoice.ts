import type { Bundle, PlainInputField, ZObject } from 'zapier-platform-core';
import { additionalFields, deliveryFields, fileOutputFields, sourceFields } from '../lib/fields';
import { convert } from '../lib/perform';
import { einvoiceSample } from '../lib/samples';

// EN 16931-valid default: dueDate (rule BR-CO-25), seller taxId for VAT category
// S, a taxSummary, and consistent totals (net + tax = gross). Renders as-is so a
// user gets a 200 on the first run instead of a 422.
const defaultInvoice = JSON.stringify(
  {
    number: 'INV-001',
    issueDate: '2026-01-31',
    dueDate: '2026-03-02',
    currencyCode: 'EUR',
    seller: {
      name: 'Your Company GmbH',
      address: { line1: 'Main St 1', city: 'Berlin', postalCode: '10115', countryCode: 'DE' },
      taxId: 'DE123456789',
    },
    buyer: {
      name: 'Customer SARL',
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
  },
  null,
  2,
);

const einvoiceOptionFields: PlainInputField[] = [
  {
    key: 'einvoice_standard',
    label: 'Standard',
    type: 'string',
    default: 'zugferd',
    choices: { zugferd: 'ZUGFeRD', facturx: 'Factur-X' },
    helpText: 'The hybrid e-invoice standard to embed.',
  },
  {
    key: 'einvoice_profile',
    label: 'Profile',
    type: 'string',
    default: 'en16931',
    choices: {
      minimum: 'Minimum',
      basicwl: 'Basic WL',
      basic: 'Basic',
      en16931: 'EN 16931',
      extended: 'Extended',
    },
    helpText: 'The data granularity profile to validate against.',
  },
  {
    key: 'invoice',
    label: 'Invoice Data (JSON)',
    type: 'text',
    default: defaultInvoice,
    helpText:
      'Structured invoice data: seller, buyer, lines, totals. See the [setup guide and worked example](https://github.com/polydoc-tech/zapier-polydoc/blob/main/docs/einvoice.md), or the [full schema](https://docs.polydoc.tech).',
  },
  {
    key: 'einvoice_verify',
    label: 'Verify',
    type: 'boolean',
    default: 'false',
    helpText: 'Verify PDF/A and e-invoice compliance (returns an error if it fails).',
  },
];

export default {
  key: 'create_einvoice',
  noun: 'E-Invoice',
  display: {
    label: 'Generate E-Invoice',
    description:
      'Generate a ZUGFeRD or Factur-X hybrid PDF/A-3 e-invoice (a human-readable PDF with embedded EN 16931 XML).',
  },
  operation: {
    inputFields: [
      ...sourceFields(),
      ...einvoiceOptionFields,
      ...deliveryFields(),
      ...additionalFields(),
    ],
    perform: (z: ZObject, bundle: Bundle) => convert(z, bundle, 'einvoice'),
    sample: einvoiceSample,
    outputFields: fileOutputFields(),
  },
};
