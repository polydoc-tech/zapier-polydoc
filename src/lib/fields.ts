import type { PlainInputField } from 'zapier-platform-core';

// Shared input field fragments composed by each create. Zapier has no
// conditional-display primitive like n8n's displayOptions, so every source and
// delivery field is shown with helpText naming when it applies; perform()
// validates that the field matching the chosen mode is filled.

export function sourceFields(): PlainInputField[] {
  return [
    {
      key: 'source_type',
      label: 'Source',
      type: 'string',
      required: true,
      default: 'url',
      choices: { url: 'URL', html: 'HTML', template: 'Template' },
      helpText:
        'Where the content comes from. Fill in the matching field below (URL, HTML, or Template ID).',
    },
    {
      key: 'url',
      label: 'URL',
      type: 'string',
      placeholder: 'https://example.com',
      helpText: 'The page to render. Used when Source is URL.',
    },
    {
      key: 'html',
      label: 'HTML',
      type: 'text',
      helpText: 'Inline HTML to render. Used when Source is HTML.',
    },
    {
      // Plain text, not a dynamic dropdown: the PolyDoc API exposes no
      // endpoint to list a key's templates (they resolve by ID at convert
      // time), so the D004 "looks like an ID field" warning is expected here.
      key: 'template_id',
      label: 'Template ID',
      type: 'string',
      helpText: 'ID of a saved PolyDoc template (from the dashboard). Used when Source is Template.',
    },
    {
      key: 'template_data',
      label: 'Template Data (JSON)',
      type: 'text',
      helpText: 'JSON data passed to the Liquid template renderer. Used when Source is Template.',
    },
  ];
}

export function deliveryFields(): PlainInputField[] {
  return [
    {
      key: 'delivery_mode',
      label: 'Delivery',
      type: 'string',
      default: 'download',
      choices: {
        download: 'Download (file)',
        cloudStorage: 'Cloud Storage (presigned URL)',
        webhook: 'Webhook',
      },
      helpText:
        'How the generated file is returned. Download gives you a File for downstream steps; Cloud Storage and Webhook return a JSON confirmation.',
    },
    {
      key: 'presigned_url',
      label: 'Presigned URL',
      type: 'string',
      helpText:
        'HTTP PUT presigned URL from your storage provider. Used when Delivery is Cloud Storage.',
    },
    {
      key: 'webhook_url',
      label: 'Webhook URL',
      type: 'string',
      helpText: 'URL the generated file is delivered to. Used when Delivery is Webhook.',
    },
    {
      key: 'webhook_options',
      label: 'Webhook Options (JSON)',
      type: 'text',
      helpText:
        'Optional JSON merged with the webhook (async, method, headers, retries, retryDelay, timeout).',
    },
  ];
}

export function additionalFields(): PlainInputField[] {
  return [
    {
      key: 'filename',
      label: 'Filename',
      type: 'string',
      helpText: 'Output filename, for example report.pdf.',
    },
    {
      key: 'tag',
      label: 'Tag',
      type: 'string',
      helpText: 'Label for logging and analytics (max 30 characters).',
    },
    {
      key: 'timeout',
      label: 'Timeout (ms)',
      type: 'integer',
      helpText: 'Conversion timeout in milliseconds.',
    },
    {
      key: 'advanced',
      label: 'Advanced (JSON)',
      type: 'text',
      helpText:
        'Raw JSON deep-merged into the request body for any API option not exposed above (pdf.watermark, pdf.pdfa, render, request).',
    },
  ];
}

export function fileOutputFields(): PlainInputField[] {
  return [
    { key: 'success', label: 'Success', type: 'boolean' },
    { key: 'file', label: 'File', type: 'file' },
    { key: 'filename', label: 'Filename' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'sizeBytes', label: 'Size (bytes)', type: 'integer' },
    { key: 'conversionId', label: 'Conversion ID' },
    { key: 'creditUsed', label: 'Credit Used' },
  ];
}
