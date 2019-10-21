exports.up = (pgm) => {
    pgm.createTable('sessions', {
        id: { type: 'string', primaryKey: true },
        userId: { type: 'int', references: 'users(id)', onUpdate: 'cascade', onDelete: 'cascade' },
        ip: { type: 'string', notNull: true },
        forwardedIp: 'string',
        online: { type: 'boolean', default: true },
        login: { type: 'timestamp', default: pgm.func('NOW()') },
        logout: 'timestamp'
    });
    pgm.createIndex('sessions', ['userId', 'online']);
};

exports.down = (pgm) => {
    pgm.dropTable('sessions');
    pgm.dropIndex('sessions', ['userId', 'online']);
};
