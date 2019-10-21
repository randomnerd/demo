import request from 'request';
import db from '../db';
import cnf from 'config';

const HookLog = db.define('hooklog', {
    name: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    url: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    body: {
        type: db.Sequelize.JSONB,
        allowNull: false,
    },
    sent: {
        type: db.Sequelize.BOOLEAN,
        defaultValue: false
    }
}, {
    indexes: [
        { fields: ['name', 'sent'] },
    ],
    hooks: {
        afterCreate(instance) {
            request.post({
                json: true,
                url: instance.url,
                body: instance.body
            }, function (error, response) {
                if (error || response.statusCode !== 200) {
                    console.log(`${instance.name} hook didnt work`, error, response.statusCode);
                }
                else {
                    instance.update({ sent: true });
                }
            });
            return instance;
        }
    }
});

Object.assign(HookLog, {
    noBlocks(symbol, lastBlock) {
        const url = cnf.hooks.noBlocks;
        HookLog.create({
            url,
            symbol,
            sent: false,
            name: 'noBlocks',
            body: { lastBlock }
        });
    }
});

Object.assign(HookLog.prototype, {
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            body: this.body,
        };
    },
});

export default HookLog;
