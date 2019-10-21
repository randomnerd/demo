const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const routes = {};
try {
    const routesJSON = require('fs').readFileSync(__dirname + '/routes.json').toString();
    Object.assign(routes, JSON.parse(routesJSON));
} catch (e) { }
const branch = process.env.BACKEND_BRANCH || 'test';

module.exports = {
    branch,
    dbType: 'postgres',
    dbUrl: process.env.DB_URL || 'postgres://postgres@localhost/exchange',
    env: process.env.ENV || process.env.NODE_ENV || 'development',
    cacheTTL: 60, // seconds
    exchangeTTL: 10 * minute,
    partners: {},
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    reserves: {},
    routes: {
        ...routes,
        default: {
            disabled: true,
            interest: 0.005,
            min: 0.00001,
            max: 1000000
        },
    },
    sessionTTL: 7 * day,
    webhookUrl: process.env.WEBHOOK_URL || `http://backend-${branch}.z-pay.local:3000/v1/private/webhook`,
    zpayToken: process.env.ZPAY_TOKEN || 'PBYDIjdJhfz7ozI2dgb4vDzIUlbDT3OAUcGFV0XgP1OzeX15',
    zpayUrl: process.env.ZPAY_URL || `http://backend-${branch}.z-pay.local:3001/v2`,
};
