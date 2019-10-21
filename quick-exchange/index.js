require('source-map-support').install({ environment: 'node' });
const dsn = 'https://6b1c2c07280940abb22f41d86b7e64a1@sentry.io/1515386';
require('@sentry/node').init({ dsn });
require('./dist/main');
