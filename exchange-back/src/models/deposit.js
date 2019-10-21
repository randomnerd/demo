import _ from 'lodash';
import Decimal from 'decimal.js';
import Sequelize from 'sequelize';
import db from '../db';
import notifiers from '../lib/notify_model';

export const Deposit = db.define('deposit', {
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
    addressId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'addresses', key: 'id' }
    },
    address: {
        type: Sequelize.STRING,
        allowNull: false
    },
    hash: {
        type: Sequelize.STRING,
        allowNull: false
    },
    vout: {
        type: Sequelize.INTEGER
    },
    blockHash: {
        type: Sequelize.STRING,
        allowNull: false
    },
    blockNum: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    confirmations: {
        type: Sequelize.INTEGER,
        defaultValue: 1
    },
    confirmed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    amount: {
        type: Sequelize.DECIMAL,
        allowNull: false
    },
    moved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
}, {
    indexes: [
        {
            fields: ['userId', 'currencyId', 'addressId', 'address', 'moved']
        }, {
            fields: ['hash', 'blockHash', 'blockNum', 'confirmations', 'confirmed']
        }
    ],
    hooks: {
        async afterCreate(instance) {
            let curr = await db.models.currency.findById(instance.currencyId);
            let body = `Поступление на Ваш ${curr.name} счет: ${instance.amount} ${curr.short}.\
                        Средства станут доступны после ${curr.numConf} подтверждений сети.`;
            db.models.notification.create({
                body,
                userId: instance.userId
            });
        }
    }
});

Object.assign(Deposit, {
    seed(params) {
        return this.findAll({ where: { userId: params[0] } });
    }
});

Object.assign(Deposit.prototype, {
    channelName() {
        return [`deposit.${this.userId}`];
    },

    toJSON() {
        let fields = [
            'id', 'userId', 'currencyId', 'address', 'amount', 'createdAt', 'hash', 'blockNum',
            'confirmations'
        ];
        return _.pick(this.dataValues, fields);
    },
    
    async mature() {
        try {
            if (!this.confirmed) return;
            let { userId, currencyId } = this;
            let balance = await db.models.balance.findOne({ where: { userId, currencyId }});
            if (!balance) balance = await db.models.balance.create({ userId, currencyId });
            db.models.balancechange.create({
                subjectId: this.id,
                subjectType: 'deposit',
                userId: this.userId,
                currencyId: this.currencyId,
                change: this.amount.toString(),
                total: balance.amount.plus(this.amount).toString()
            });
            await db.models.address.update({
                received: db.literal(`received +${this.amount}`)
            }, {
                    where: { id: this.addressId }
            });
            balance.amount = new Decimal(this.amount).plus(balance.amount).toString();
            await balance.save();
            let curr = await db.models.currency.findById(this.currencyId);
            let body = `Ваш ${curr.name} счет пополнен на ${this.amount} ${curr.short}.`;
            db.models.notification.create({
                body,
                userId: this.userId
            });
        } catch (error) {
            console.error(error);
        }
    }
});

Object.assign(Deposit.prototype, notifiers);

export default Deposit;
