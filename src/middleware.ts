import type { BeforeRequestMiddleware } from 'zapier-platform-core';

// Inject the Bearer token on every outbound request. X-Sandbox stays per-request
// (set in perform and in the credential test) so the test can force sandbox
// regardless of the account's Sandbox toggle.
export const addAuthHeader: BeforeRequestMiddleware = (request, _z, bundle) => {
  const apiKey = bundle.authData?.apiKey;
  if (apiKey) {
    request.headers = { ...(request.headers ?? {}), Authorization: `Bearer ${apiKey}` };
  }
  return request;
};
