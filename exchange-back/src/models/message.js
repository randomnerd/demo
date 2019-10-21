import Sequelize from 'sequelize';
import db from '../db';
import notifiers from '../lib/notify_model';

export const Message = db.define('message', {
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  dstUserId: {
    type: Sequelize.INTEGER,
    references: { model: 'users', key: 'id' }
  },
  text: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  username: {
    type: Sequelize.STRING
  },
  dstUserName: {
    type: Sequelize.STRING
  },
  isPrivate: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
}, {
  indexes: [
    { fields: [ 'userId', 'dstUserId', 'isPrivate' ] },
  ],
  hooks: {
    async beforeCreate(instance, options) {
      let user = await db.models.user.findById(instance.userId);
      if (user.chatBanned) throw new Error(14);
      instance.username = user.username;
      if (instance.dstUserId) {
        let dstUser = await db.models.user.findById(instance.dstUserId);
        instance.dstUsername = user.username;
      }
      return instance;
    }
  }
});

Object.assign(Message, {
  seed(params = {}) {
    let where = {};
    if (params.userId) {
      where.$or = [
        { isPrivate: false },
        { isPrivate: true, dstUserId: params.userId }
      ];
    } else {
      where.isPrivate = false;
    }
    return this.findAll({ where, limit: 100, order: ['createdAt'] });
  }
});

Object.assign(Message.prototype, {
    channelName() {
        return this.isPrivate ? [ `message.${this.userId}`, `message.${this.dstUserId}` ] : [ 'message' ];
    }
});

Object.assign(Message.prototype, notifiers);

export default Message;
