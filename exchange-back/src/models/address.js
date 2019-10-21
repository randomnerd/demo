import _ from 'lodash';
import Sequelize from 'sequelize';
import db from '../db';
import keygen from '../lib/keygen';
import notifiers from '../lib/notify_model';

export const Address = db.define('address', {
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
  pubkey: {
    type: Sequelize.STRING,
    unique: true
  },
  privkey: {
    type: Sequelize.STRING,
    unique: true
  },
  received: {
    type: Sequelize.DECIMAL,
    defaultValue: 0
  },
  lasttx: {
    type: Sequelize.STRING
  }
}, {
  indexes: [
    {
      fields: [ 'userId', 'currencyId' ]
    },
    {
      unique: true,
      fields: [ 'currencyId', 'pubkey' ]
    }
  ],
  hooks: {
    async beforeCreate(instance, options) {
      let currency = await db.models.currency.findById(instance.currencyId);
      Object.assign(instance, keygen(currency.short));
      return instance;
    }
  }
});

// Class methods
Object.assign(Address, {
  seed(params) {
    return this.findAll({ where: { userId: params[0] } });
  }
});

// Instance methods
Object.assign(Address.prototype, {
  channelName() {
    return [ `address.${this.userId}` ];
  },

  toJSON() {
    let fields = ['id', 'userId', 'currencyId', 'pubkey'];
    return _.pick(this.dataValues, fields);
  },

  depositsToMove() {
    return db.models.deposit.findAll({ where: {
      addressId: this.id,
      confirmed: true,
      moved: false
    }});
  }
});

// Notify methods
Object.assign(Address.prototype, notifiers);

export default Address;
