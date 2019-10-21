import Sequelize from 'sequelize';
import db from '../db';
import notifiers from '../lib/notify_model';

export const BalanceChange = db.define('balancechange', {
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    currencyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'currencies', key: 'id' }
    },
    subjectId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    subjectType: {
        type: Sequelize.STRING,
        allowNull: false
    },
    change: {
        type: Sequelize.DECIMAL,
        allowNull: false
    },
    total: {
        type: Sequelize.DECIMAL,
        allowNull: false
    }
}, {
    indexes: [
        {
            fields: ['userId', 'currencyId']
        },
        {
            fields: ['subjectType', 'subjectId']
        }
    ]
});

Object.assign(BalanceChange, {
    seed(params) {
        if (params.length > 1) return this.findAll({ where: { userId: params[0], currencyId: params[1] } });
        return this.findAll({ where: { userId: params[0] } });
    }
});

Object.assign(BalanceChange.prototype, {
    channelName() {
        return [`balancechange.${this.userId}`];
    }
});

Object.assign(BalanceChange.prototype, notifiers);

export default BalanceChange;
