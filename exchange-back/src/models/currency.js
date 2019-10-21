import _ from 'lodash';
import Sequelize from 'sequelize';
import db from '../db';
import notifiers from '../lib/notify_model';
import CryptoClient from '../lib/crypto_client';

export const Currency = db.define('currency', {
  name: {
    type: Sequelize.STRING,
    unique: true
  },
  short: {
    type: Sequelize.STRING,
    unique: true
  },
  host: {
    type: Sequelize.STRING
  },
  port: {
    type: Sequelize.INTEGER
  },
  hotAddress: {
    type: Sequelize.STRING
  },
  username: {
    type: Sequelize.STRING
  },
  password: {
    type: Sequelize.STRING
  },
  hotSecret: {
    type: Sequelize.STRING
  },
  numConf: {
    type: Sequelize.INTEGER,
    defaultValue: 3
  },
  height: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  withdrawalFee: {
    type: Sequelize.DECIMAL,
    defaultValue: 0.001
  },
  href: {
    type: Sequelize.STRING
  }
});

// Class methods
Object.assign(Currency, {
  seed(params) {
    return this.findAll({ order: [['short', 'ASC']] });
  },
  async userBalance(userId, currencyId) {
    let balance = await db.models.balance.findOne({ where: { userId, currencyId } });
    if (balance) return balance;
    return await db.models.balance.create({ userId, currencyId });
  }
});

// Instance methods
Object.assign(Currency.prototype, {
  channelName() {
    return ['currency'];
  },

  cryptoClient() {
    if (this._cryptoClient instanceof CryptoClient) return this._cryptoClient;
    return this._cryptoClient = new CryptoClient(this);
  },

  toJSON() {
    let fields = ['id', 'name', 'short', 'numConf', 'height', 'withdrawalFee', 'href'];
    return _.pick(this.dataValues, fields);
  }
});

// Notify methods
Object.assign(Currency.prototype, notifiers);

export default Currency;
