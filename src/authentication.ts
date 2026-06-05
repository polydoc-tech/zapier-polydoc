import type { Authentication, Bundle, ZObject } from 'zapier-platform-core';
import { extractApiErrorMessage } from './lib/buildRequestBody';

export const DEFAULT_BASE_URL = 'https://api.polydoc.tech';

export function baseUrlOf(bundle: Bundle): string {
  return (bundle.authData.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

// PolyDoc has no cheap auth-only endpoint, so the credential test runs a minimal
// sandbox screenshot: X-Sandbox forces sandbox quota (never production), 200
// means the key is valid, 401/403 means it is not. A working test is mandatory
// for App Directory review.
const test = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: `${baseUrlOf(bundle)}/screenshot/convert`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Sandbox': 'true' },
    body: JSON.stringify({ source: '<p>polydoc</p>', screenshot: { type: 'png' } }),
    raw: true,
    skipThrowForStatus: true,
  });

  if (response.status === 401 || response.status === 403) {
    throw new z.errors.Error('The PolyDoc API key is invalid.', 'AuthenticationError', response.status);
  }
  if (response.status >= 400) {
    const detail = extractApiErrorMessage(await response.text());
    throw new z.errors.Error(
      detail || `PolyDoc credential test failed (HTTP ${response.status}).`,
      'AuthenticationError',
      response.status,
    );
  }
  return { connected: true };
};

const authentication: Authentication = {
  type: 'custom',
  fields: [
    {
      key: 'apiKey',
      label: 'API Key',
      type: 'password',
      required: true,
      helpText:
        'Your PolyDoc API key. Create one in the [PolyDoc dashboard](https://dashboard.polydoc.tech) under API Keys.',
    },
    {
      key: 'sandbox',
      label: 'Sandbox',
      type: 'boolean',
      default: 'false',
      helpText:
        'Run conversions in sandbox mode (higher quota, watermarked output). Sends the X-Sandbox header.',
    },
    {
      key: 'baseUrl',
      label: 'Base URL',
      type: 'string',
      default: DEFAULT_BASE_URL,
      helpText: 'PolyDoc API base URL. Change only for self-hosted or staging environments.',
    },
  ],
  test,
  connectionLabel: 'PolyDoc ({{bundle.authData.baseUrl}})',
};

export default authentication;
