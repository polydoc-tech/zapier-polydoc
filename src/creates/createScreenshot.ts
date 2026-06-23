import type { Bundle, PlainInputField, ZObject } from 'zapier-platform-core';
import { additionalFields, deliveryFields, fileOutputFields, sourceFields } from '../lib/fields';
import { convert } from '../lib/perform';
import { screenshotSample } from '../lib/samples';

const screenshotOptionFields: PlainInputField[] = [
  {
    key: 'image_type',
    label: 'Image Type',
    type: 'string',
    default: 'png',
    choices: { png: 'PNG', jpeg: 'JPEG', webp: 'WebP' },
    helpText: 'Output image format.',
  },
  {
    key: 'full_page',
    label: 'Full Page',
    type: 'boolean',
    default: 'false',
    helpText: 'Capture the entire scrollable page.',
  },
  {
    key: 'quality',
    label: 'Quality',
    type: 'integer',
    helpText: 'Compression quality for JPEG/WebP, 0 to 100.',
  },
  {
    key: 'viewport_width',
    label: 'Viewport Width',
    type: 'integer',
    default: '1280',
    helpText: 'Viewport width in CSS pixels.',
  },
  {
    key: 'viewport_height',
    label: 'Viewport Height',
    type: 'integer',
    default: '800',
    helpText: 'Viewport height in CSS pixels.',
  },
  {
    key: 'device_pixel_ratio',
    label: 'Device Pixel Ratio',
    type: 'number',
    helpText: 'Device pixel ratio, for example 2 for retina (0 to 10).',
  },
];

export default {
  key: 'create_screenshot',
  noun: 'Screenshot',
  display: {
    label: 'Capture Screenshot',
    description: 'Captures a screenshot of a URL or inline HTML as PNG, JPEG, or WebP.',
  },
  operation: {
    inputFields: [
      ...sourceFields(),
      ...screenshotOptionFields,
      ...deliveryFields(),
      ...additionalFields(),
    ],
    perform: (z: ZObject, bundle: Bundle) => convert(z, bundle, 'screenshot'),
    sample: screenshotSample,
    outputFields: fileOutputFields(),
  },
};
