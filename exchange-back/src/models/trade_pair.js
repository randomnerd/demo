import _ from 'lodash';
import Sequelize from 'sequelize';
import db from '../db';
import notifiers from '../lib/notify_model';

export const TradePair = db.define('tradepair', {
  permalink: {
    type: Sequelize.STRING,
    unique: true
  },
  srcCurrencyId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'currencies', key: 'id' }
  },
  dstCurrencyId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'currencies', key: 'id' }
  },
  fee: {
    type: Sequelize.DECIMAL,
    defaultValue: 0
  },
  lastPrice: {
    type: Sequelize.DECIMAL,
    defaultValue: 0
  },
  volume: {
    type: Sequelize.DECIMAL,
    defaultValue: 0
  },
  delta: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  }
});

// Class methods
Object.assign(TradePair, {
  seed(params) {
    return this.findAll({ order: [['permalink', 'ASC']] });
  }
});

// Instance methods
Object.assign(TradePair.prototype, {
  channelName() {
    return ['tradepair'];
  },
  toJSON() {
    let fields = ['id', 'srcCurrencyId', 'dstCurrencyId', 'permalink', 'fee', 'lastPrice', 'volume', 'delta'];
    return _.pick(this.dataValues, fields);
  },
  async displayName() {
    let src = await db.models.currency.findById(this.srcCurrencyId);
    let dst = await db.models.currency.findById(this.dstCurrencyId);
    return `${src.short} / ${dst.short}`;
  }
});

// Notify methods
Object.assign(TradePair.prototype, notifiers);

export default TradePair;
