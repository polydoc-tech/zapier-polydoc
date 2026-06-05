// Pure, side-effect-free request-body assembly for the PolyDoc API. Shared by
// every create and unit-tested without a Zapier runtime. Ported from the n8n
// connector's GenericFunctions.ts so all PolyDoc connectors assemble identical
// request bodies from the same inputs.

export type Json = Record<string, unknown>;

export type PolyDocOperation = 'pdf' | 'screenshot' | 'einvoice';
export type PolyDocSourceType = 'url' | 'html' | 'template';
export type PolyDocDeliveryMode = 'download' | 'cloudStorage' | 'webhook';

export interface PolyDocParams {
  operation: PolyDocOperation;
  sourceType: PolyDocSourceType;
  url?: string;
  html?: string;
  templateId?: string;
  templateData?: Json;
  filename?: string;
  tag?: string;
  timeout?: number;
  /** PDF UI options: format, landscape, printBackground, scale, pageRanges, outline, tagged, margin* */
  pdfOptions?: Json;
  /** Screenshot UI options: imageType, fullPage, quality, viewportWidth, viewportHeight, devicePixelRatio */
  screenshotOptions?: Json;
  eInvoiceStandard?: 'facturx' | 'zugferd';
  eInvoiceProfile?: string;
  eInvoiceVerify?: boolean;
  invoice?: Json;
  /** Raw object deep-merged into the request body for any field not surfaced as a control. */
  advanced?: Json;
  delivery: {
    mode: PolyDocDeliveryMode;
    presignedUrl?: string;
    webhook?: Json;
  };
}

export interface PolyDocRequest {
  endpoint: '/pdf/convert' | '/screenshot/convert';
  body: Json;
  isBinary: boolean;
}

function isPlainObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Deep-merge `source` into `target` (source wins). Arrays and scalars overwrite. */
export function mergeDeep(target: Json, source: Json): Json {
  const out: Json = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = mergeDeep(out[key] as Json, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function resolveSource(params: PolyDocParams): string {
  switch (params.sourceType) {
    case 'url':
      return params.url ?? '';
    case 'html':
      return params.html ?? '';
    case 'template':
      return `[template:${params.templateId ?? ''}]`;
    default:
      return '';
  }
}

function buildLayout(opts: Json): Json | undefined {
  const layout: Json = {};
  if (typeof opts.format === 'string' && opts.format !== '') layout.format = opts.format;
  for (const flag of ['landscape', 'printBackground', 'outline', 'tagged'] as const) {
    if (typeof opts[flag] === 'boolean') layout[flag] = opts[flag];
  }
  if (typeof opts.scale === 'number') layout.scale = opts.scale;
  if (typeof opts.pageRanges === 'string' && opts.pageRanges !== '')
    layout.pageRanges = opts.pageRanges;

  const margins = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const;
  if (margins.some((m) => opts[m] !== undefined && opts[m] !== '')) {
    layout.margin = {
      top: opts.marginTop ?? '0',
      right: opts.marginRight ?? '0',
      bottom: opts.marginBottom ?? '0',
      left: opts.marginLeft ?? '0',
    };
  }
  return Object.keys(layout).length > 0 ? layout : undefined;
}

function buildScreenshot(opts: Json): Json | undefined {
  const shot: Json = {};
  if (typeof opts.imageType === 'string' && opts.imageType !== '') shot.type = opts.imageType;
  if (typeof opts.fullPage === 'boolean') shot.fullPage = opts.fullPage;
  if (typeof opts.quality === 'number') shot.quality = opts.quality;
  if (typeof opts.viewportWidth === 'number' && typeof opts.viewportHeight === 'number') {
    const viewport: Json = { width: opts.viewportWidth, height: opts.viewportHeight };
    if (typeof opts.devicePixelRatio === 'number' && opts.devicePixelRatio > 0)
      viewport.devicePixelRatio = opts.devicePixelRatio;
    shot.viewport = viewport;
  }
  return Object.keys(shot).length > 0 ? shot : undefined;
}

/**
 * Assemble the PolyDoc request body from resolved parameters. Pure and
 * side-effect free so it can be unit-tested in isolation.
 */
export function buildRequestBody(params: PolyDocParams): PolyDocRequest {
  const endpoint = params.operation === 'screenshot' ? '/screenshot/convert' : '/pdf/convert';
  const body: Json = { source: resolveSource(params) };

  if (params.templateData && Object.keys(params.templateData).length > 0)
    body.templateData = params.templateData;
  if (params.filename) body.filename = params.filename;
  if (params.tag) body.tag = params.tag;
  if (typeof params.timeout === 'number' && params.timeout > 0) body.timeout = params.timeout;

  if (params.operation === 'pdf') {
    const layout = params.pdfOptions ? buildLayout(params.pdfOptions) : undefined;
    if (layout) body.layout = layout;
  }

  if (params.operation === 'screenshot') {
    const shot = params.screenshotOptions ? buildScreenshot(params.screenshotOptions) : undefined;
    if (shot) body.screenshot = shot;
  }

  if (params.operation === 'einvoice') {
    const eInvoice: Json = {
      standard: params.eInvoiceStandard,
      profile: params.eInvoiceProfile,
      invoice: params.invoice ?? {},
    };
    if (typeof params.eInvoiceVerify === 'boolean') eInvoice.verify = params.eInvoiceVerify;
    body.eInvoice = eInvoice;
  }

  const isBinary = params.delivery.mode === 'download';
  if (params.delivery.mode === 'cloudStorage' && params.delivery.presignedUrl) {
    body.cloudStorage = { presignedUrl: params.delivery.presignedUrl };
  }
  if (params.delivery.mode === 'webhook' && params.delivery.webhook) {
    body.webhook = params.delivery.webhook;
  }

  const merged =
    params.advanced && Object.keys(params.advanced).length > 0
      ? mergeDeep(body, params.advanced)
      : body;

  return { endpoint, body: merged, isBinary };
}

/** Default output filename when the user did not set one. */
export function defaultFilename(operation: PolyDocOperation, imageType?: string): string {
  if (operation === 'screenshot') {
    const ext = imageType === 'jpeg' ? 'jpg' : (imageType ?? 'png');
    return `screenshot.${ext}`;
  }
  return 'document.pdf';
}

/**
 * Best-effort extraction of PolyDoc's `{ error, message }` from a thrown HTTP
 * error or an error response body, including the binary path where the body
 * arrives as bytes.
 */
export function extractApiErrorMessage(payloadInput: unknown): string | undefined {
  let payload: unknown = payloadInput;
  if (payload instanceof ArrayBuffer) payload = Buffer.from(payload).toString('utf8');
  if (Buffer.isBuffer(payload)) payload = payload.toString('utf8');
  if (typeof payload === 'string') {
    const text = payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return text || undefined;
    }
  }
  if (isPlainObject(payload)) {
    return (payload.message as string) ?? (payload.error as string) ?? undefined;
  }
  return undefined;
}
