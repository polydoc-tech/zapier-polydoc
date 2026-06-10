import type { Bundle, ZObject } from 'zapier-platform-core';
import { baseUrlOf } from '../authentication';
import {
  buildRequestBody,
  defaultFilename,
  extractApiErrorMessage,
  type Json,
  type PolyDocDeliveryMode,
  type PolyDocOperation,
  type PolyDocParams,
  type PolyDocSourceType,
} from './buildRequestBody';

export interface ConvertResult {
  success: boolean;
  file?: string;
  filename?: string;
  contentType?: string;
  sizeBytes?: number;
  conversionId?: string | null;
  creditUsed?: string | null;
  [key: string]: unknown;
}

function str(value: unknown): string | undefined {
  if (typeof value === 'string') return value === '' ? undefined : value;
  if (typeof value === 'number') return String(value);
  return undefined;
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

// Boolean fields can arrive as a real boolean or as the strings 'true'/'false'
// (a field default is stored as a string).
function bool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function parseJsonField(value: unknown): Json | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'object' && !Array.isArray(value)) return value as Json;
  if (typeof value === 'string') {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Json)
      : undefined;
  }
  return undefined;
}

// Honor the explicit Source dropdown when its matching field is filled.
// Otherwise infer from the single filled source field, so a user who fills HTML
// (or Template ID) but leaves the Source dropdown on its 'url' default still
// gets what they typed. Zapier has no conditional field display, so the dropdown
// and the filled field can disagree; the filled field is the stronger signal.
function resolveSourceType(input: Json): PolyDocSourceType {
  const explicit = (str(input.source_type) ?? 'url') as PolyDocSourceType;
  const filled: Record<PolyDocSourceType, string | undefined> = {
    url: str(input.url),
    html: str(input.html),
    template: str(input.template_id),
  };
  if (filled[explicit]) return explicit;
  const present = (Object.keys(filled) as PolyDocSourceType[]).filter((k) => filled[k]);
  return present.length === 1 ? present[0] : explicit;
}

export function paramsFromInput(input: Json, operation: PolyDocOperation): PolyDocParams {
  const sourceType = resolveSourceType(input);
  const deliveryMode = (str(input.delivery_mode) ?? 'download') as PolyDocDeliveryMode;

  const params: PolyDocParams = {
    operation,
    sourceType,
    filename: str(input.filename),
    tag: str(input.tag),
    timeout: num(input.timeout),
    advanced: parseJsonField(input.advanced),
    delivery: { mode: deliveryMode },
  };

  if (sourceType === 'url') params.url = str(input.url);
  else if (sourceType === 'html') params.html = str(input.html);
  else {
    params.templateId = str(input.template_id);
    params.templateData = parseJsonField(input.template_data);
  }

  if (operation === 'pdf') {
    params.pdfOptions = {
      format: str(input.format),
      landscape: bool(input.landscape),
      printBackground: bool(input.print_background),
      scale: num(input.scale),
      pageRanges: str(input.page_ranges),
      outline: bool(input.outline),
      tagged: bool(input.tagged),
      marginTop: str(input.margin_top),
      marginRight: str(input.margin_right),
      marginBottom: str(input.margin_bottom),
      marginLeft: str(input.margin_left),
    };
  } else if (operation === 'screenshot') {
    params.screenshotOptions = {
      imageType: str(input.image_type),
      fullPage: bool(input.full_page),
      quality: num(input.quality),
      viewportWidth: num(input.viewport_width),
      viewportHeight: num(input.viewport_height),
      devicePixelRatio: num(input.device_pixel_ratio),
    };
  } else {
    params.eInvoiceStandard = (str(input.einvoice_standard) ?? 'zugferd') as 'facturx' | 'zugferd';
    params.eInvoiceProfile = str(input.einvoice_profile) ?? 'en16931';
    params.eInvoiceVerify = bool(input.einvoice_verify) ?? false;
    params.invoice = parseJsonField(input.invoice) ?? {};
  }

  if (deliveryMode === 'cloudStorage') {
    params.delivery.presignedUrl = str(input.presigned_url);
  } else if (deliveryMode === 'webhook') {
    const extra = parseJsonField(input.webhook_options) ?? {};
    params.delivery.webhook = { url: str(input.webhook_url) ?? '', ...extra };
  }

  return params;
}

function requireSource(z: ZObject, params: PolyDocParams): void {
  const value =
    params.sourceType === 'url'
      ? params.url
      : params.sourceType === 'html'
        ? params.html
        : params.templateId;
  if (!value) {
    throw new z.errors.Error(
      'Provide a source: fill in the URL, HTML, or Template ID field.',
      'InvalidInput',
      400,
    );
  }
}

/**
 * Map a create's input fields to PolyDoc parameters, call the API, and return
 * the result. For Download delivery the binary is stashed to a Zapier-hosted
 * URL so downstream steps can attach it; Cloud Storage and Webhook delivery
 * return the API's JSON confirmation.
 */
export async function convert(
  z: ZObject,
  bundle: Bundle,
  operation: PolyDocOperation,
): Promise<ConvertResult> {
  const params = paramsFromInput(bundle.inputData as Json, operation);
  requireSource(z, params);

  const { endpoint, body, isBinary } = buildRequestBody(params);
  const url = `${baseUrlOf()}${endpoint}`;
  const sandbox = bool(bundle.authData.sandbox) ?? false;
  const headers = {
    'Content-Type': 'application/json',
    'X-Sandbox': sandbox ? 'true' : 'false',
  };

  if (isBinary) {
    const response = await z.request({
      url,
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      raw: true,
      skipThrowForStatus: true,
    });
    if (response.status >= 400) {
      const detail = extractApiErrorMessage(await response.text());
      throw new z.errors.Error(
        detail || `PolyDoc request failed (HTTP ${response.status}).`,
        'PolyDocError',
        response.status,
      );
    }
    const buffer = await response.buffer();
    const contentType =
      (response.getHeader('content-type') ?? '').split(';')[0].trim() || 'application/octet-stream';
    const imageType = str(params.screenshotOptions?.imageType);
    const filename = params.filename || defaultFilename(operation, imageType);
    const file = await z.stashFile(buffer, buffer.length, filename, contentType);

    return {
      success: true,
      file,
      filename,
      contentType,
      sizeBytes: buffer.length,
      conversionId: response.getHeader('x-conversion-id') ?? null,
      creditUsed: response.getHeader('x-credit-used') ?? null,
    };
  }

  const response = await z.request({
    url,
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    skipThrowForStatus: true,
  });
  if (response.status >= 400) {
    const detail = extractApiErrorMessage(response.content);
    throw new z.errors.Error(
      detail || `PolyDoc request failed (HTTP ${response.status}).`,
      'PolyDocError',
      response.status,
    );
  }
  const data = response.data && typeof response.data === 'object' ? (response.data as Json) : {};
  return { success: true, ...data };
}
