function minutes(n) { return n * 60 * 1000; }
function seconds(n) { return n * 1000; }

module.exports = {
    auth: {
        enabled: false,
        user: 'api',
        pass: 'password'
    },
    db: {
        user: process.env.DB_USER || 'postgres',
        pass: process.env.DB_PASS || null,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'wallet'
    },
    crypto: [],
    tokens: []
};
