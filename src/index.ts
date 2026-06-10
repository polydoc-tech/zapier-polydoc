import { version as platformVersion } from 'zapier-platform-core';
import authentication from './authentication';
import { addAuthHeader } from './middleware';
import createPdf from './creates/createPdf';
import createScreenshot from './creates/createScreenshot';
import createEinvoice from './creates/createEinvoice';

const { version } = require('../package.json');

const App = {
  version,
  platformVersion,

  // We normalize empty values ourselves in perform (str/parseJsonField/source
  // inference), so keep the raw input rather than letting Zapier prune it.
  flags: { cleanInputData: false },

  authentication,
  beforeRequest: [addAuthHeader],
  afterResponse: [],

  creates: {
    [createPdf.key]: createPdf,
    [createScreenshot.key]: createScreenshot,
    [createEinvoice.key]: createEinvoice,
  },
};

export = App;
