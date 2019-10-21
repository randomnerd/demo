import Sequelize from 'sequelize';
import Decimal from 'decimal.js';
import db from '../db';
import notifiers from '../lib/notify_model';

export const Order = db.define('order', {
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  tradePairId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'tradepairs', key: 'id' }
  },
  type: {
    type: Sequelize.ENUM('buy', 'sell'),
    allowNull: false
  },
  amount: {
    type: Sequelize.DECIMAL,
    allowNull: false,
    validate: { min: 0.00000001 }
  },
  price: {
    type: Sequelize.DECIMAL,
    allowNull: false,
    validate: { min: 0.00000001 }
  },
  remain: {
    type: Sequelize.DECIMAL,
    validate: { min: 0 }
  },
  complete: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  canceled: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  fee: {
    type: Sequelize.DECIMAL,
    defaultValue: 0
  }
}, {
  scopes: {
    active: {
      where: {
        complete: false,
        canceled: false
      }
    },
    pair: function(srcCurrencyId, dstCurrencyId) {
      return {
        where: { srcCurrencyId, dstCurrencyId }
      };
    },
    user: function(userId) {
      return {
        where: { userId }
      };
    }
  },
  getterMethods: {
    fee()       { return new Decimal(this.getDataValue('fee') || 0) },
    price()     { return new Decimal(this.getDataValue('price') || 0) },
    remain()    { return new Decimal(this.getDataValue('remain') || 0) },
    amount()    { return new Decimal(this.getDataValue('amount') || 0) },
    dstRemain() { return this.remain.mul(this.price) },
    dstAmount() { return this.amount.mul(this.price) }
  },
  setterMethods: {
    fee(val)    { this.setDataValue('fee', val.toString()) },
    price(val)  { this.setDataValue('price', val.toString()) },
    remain(val) { this.setDataValue('remain', val.toString()) },
    amount(val) { this.setDataValue('amount', val.toString()) }
  },
  validate: {
    validOrder() {
      if (this.dstAmount.lt(0.0001))
        throw new Error('dstAmount is too low');
      if (this.remain.gt(0) && this.complete)
        throw new Error('order cant be complete with remain > 0');
      if (this.complete && this.canceled)
        throw new Error('complete order cant be canceled');
    }
  },
  hooks: {
    async beforeUpdate(instance, options) {
      if (!instance.complete && instance.remain.eq(0)) {
        let pair = await db.models.tradepair.findById(instance.tradePairId);
        let curr = await db.models.currency.findById(pair.srcCurrencyId);
        let type = instance.type == 'buy' ? 'продажу' : 'покупку';
        let pairName = await pair.displayName();
        let body = `Ваша заявка на ${type} ${instance.amount} ${curr.short} (пара ${pairName}) была исполнена.`;
        db.models.notification.create({
            body,
            userId: instance.userId
        });
      }
      instance.complete = instance.remain.eq(0);
      return instance;
    },
    async beforeCreate(instance, options) {
      let pair = await db.models.tradepair.findById(instance.tradePairId);
      if (!pair) throw new Error('pair not found');
      instance.fee = pair.fee;
      instance.remain = instance.amount;
      await instance.lockFunds();
      return instance;
    },
    afterCreate(instance, options) {
      setImmediate(() => instance.execute());
      return instance;
    }
  },
  indexes: [
    { fields: [ 'tradePairId', 'complete', 'canceled' ] },
    { fields: [ 'type', 'price' ] },
  ]
});

// Class methods
Object.assign(Order, {
  seed(params) {
    return this.scope('active', { method: [ 'user', params[0] ] }).findAll({ order: [['createdAt', 'DESC']] });
  }
});

// Instance methods
Object.assign(Order.prototype, {
  channelName() {
    return [`order.${this.userId}`];
  },
  async findMatches() {
    let price = this.price.toString();
    let where = {
      type:          this.type === 'buy' ? 'sell' : 'buy',
      price:         this.type === 'buy' ? { $lte: price } : { $gte: price },
      tradePairId:   this.tradePairId,
      complete:      false,
      canceled:      false
    };
    return await db.models.order.findAll({
      where,
      order: [
        [ 'price', this.type === 'buy' ? 'ASC' : 'DESC'],
        [ 'createdAt', 'ASC' ]
      ]
    });
  },

  async execute() {
      for (let match of await this.findMatches()) {
        await this.processMatch(match);
      }
  },

  decideAmount(their) {
    return this.remain.lte(their.remain) ? this.remain : their.remain;
  },

  decidePrice(their) {
    if (this.type === 'buy') {
      return their.price.lt(this.price) ? their.price : this.price;
    } else {
      return their.price.gt(this.price) ? their.price : this.price;
    }
  },

  async cancel() {
    if (this.complete || this.canceled || this.remain.lte(0)) return false;
    await this.unlockFunds();
    await this.update({ canceled: true });
    return true;
  },

  async processMatch(match) {
    if (this.complete || this.canceled || this.remain.lte(0)) return false;
    let amount = this.decideAmount(match);
    if (amount.eq(0)) return false;
    let price = this.decidePrice(match);
    let trade = await db.models.trade.create({
      price,
      amount,
      fee: this.fee,
      srcOrderId: this.id,
      dstOrderId: match.id,
      srcUserId: this.userId,
      dstUserId: match.userId,
      tradePairId: this.tradePairId,
    });
    await trade.execute(this, match);
    return true;
  },

  unlockFunds() {
    return this.lockFunds(true);
  },

  async lockFunds(unlock = false) {
    let pair = await db.models.tradepair.findById(this.tradePairId);
    let currId = this.type === 'buy' ? pair.dstCurrencyId : pair.srcCurrencyId;
    let amount = this.type === 'buy' ? this.dstRemain : this.remain;
    let balance = await db.models.currency.userBalance(this.userId, currId);
    if (!balance) throw new Error('Balance not found');
    if (unlock) {
      if (amount.gt(balance.held)) throw new Error('Not enough held');
      balance.amount = balance.amount.plus(amount);
      balance.held   = balance.held.minus(amount);
    } else {
      if (amount.gt(balance.amount)) throw new Error('Not enough funds');
      balance.amount = balance.amount.minus(amount);
      balance.held   = balance.held.plus(amount);
    }
    await balance.save();
  },
});

// Notify methods
Object.assign(Order.prototype, notifiers);

export default Order;
