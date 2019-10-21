module.exports = {
    db: {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_ENV_POSTGRES_PASSWORD || null,
        host: 'db',
        port: 5432,
        name: process.env.DB_ENV_POSTGRES_DB || 'exchange'
    }
}