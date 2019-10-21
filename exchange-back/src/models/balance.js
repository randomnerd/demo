import Sequelize from 'sequelize';
import Decimal from 'decimal.js';
import db from '../db';
import notifiers from '../lib/notify_model';

export const Balance = db.define('balance', {
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
  amount: {
    type: Sequelize.DECIMAL,
    defaultValue: 0,
    validate: { min: 0 }
  },
  held: {
    type: Sequelize.DECIMAL,
    defaultValue: 0,
    validate: { min: 0 }
  }
}, {
  indexes: [
    {
      unique: true,
      fields: [ 'userId', 'currencyId' ]
    }
  ],
  hooks: {
  },
  getterMethods: {
    amount() { return new Decimal(this.getDataValue('amount')); },
    held()   { return new Decimal(this.getDataValue('held')); }
  },
  setterMethods: {
    amount(val) { this.setDataValue('amount', val.toString()) },
    held(val)   { this.setDataValue('held', val.toString()) }
  }
});

Object.assign(Balance, {
  seed(params) {
    return this.findAll({ where: { userId: params[0] } });
  }
});

Object.assign(Balance.prototype, {
  channelName() {
    return [`balance.${this.userId}`];
  }
});

Object.assign(Balance.prototype, notifiers);

export default Balance;
