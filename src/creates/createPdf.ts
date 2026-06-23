import type { Bundle, PlainInputField, ZObject } from 'zapier-platform-core';
import { additionalFields, deliveryFields, fileOutputFields, sourceFields } from '../lib/fields';
import { convert } from '../lib/perform';
import { pdfSample } from '../lib/samples';

const pdfOptionFields: PlainInputField[] = [
  {
    key: 'format',
    label: 'Page Format',
    type: 'string',
    default: 'A4',
    choices: { A3: 'A3', A4: 'A4', A5: 'A5', Ledger: 'Ledger', Legal: 'Legal', Letter: 'Letter', Tabloid: 'Tabloid' },
    helpText: 'Paper size for the PDF.',
  },
  { key: 'landscape', label: 'Landscape', type: 'boolean', default: 'false', helpText: 'Use landscape orientation.' },
  {
    key: 'print_background',
    label: 'Print Background',
    type: 'boolean',
    default: 'true',
    helpText: 'Print background graphics and colors.',
  },
  { key: 'scale', label: 'Scale', type: 'number', helpText: 'Render scale, 0.1 to 2.' },
  {
    key: 'page_ranges',
    label: 'Page Ranges',
    type: 'string',
    helpText: 'Pages to include, for example 1-5, 8. Empty means all pages.',
  },
  {
    key: 'outline',
    label: 'Outline (Bookmarks)',
    type: 'boolean',
    default: 'false',
    helpText: 'Generate PDF bookmarks from HTML headings.',
  },
  {
    key: 'tagged',
    label: 'Tagged (Accessible)',
    type: 'boolean',
    default: 'false',
    helpText: 'Produce a tagged (accessible) PDF.',
  },
  { key: 'margin_top', label: 'Margin Top', type: 'string', helpText: 'Top margin with optional unit, for example 10mm.' },
  { key: 'margin_right', label: 'Margin Right', type: 'string', helpText: 'Right margin with optional unit.' },
  { key: 'margin_bottom', label: 'Margin Bottom', type: 'string', helpText: 'Bottom margin with optional unit.' },
  { key: 'margin_left', label: 'Margin Left', type: 'string', helpText: 'Left margin with optional unit.' },
];

export default {
  key: 'create_pdf',
  noun: 'PDF',
  display: {
    label: 'Create PDF',
    description: 'Converts a URL, inline HTML, or a saved template into a PDF.',
  },
  operation: {
    inputFields: [...sourceFields(), ...pdfOptionFields, ...deliveryFields(), ...additionalFields()],
    perform: (z: ZObject, bundle: Bundle) => convert(z, bundle, 'pdf'),
    sample: pdfSample,
    outputFields: fileOutputFields(),
  },
};
