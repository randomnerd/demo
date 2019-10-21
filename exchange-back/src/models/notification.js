import Sequelize from 'sequelize';
import db from '../db';
import notifiers from '../lib/notify_model';

export const Notification = db.define('notification', {
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  title: {
    type: Sequelize.STRING
  },
  body: {
    type: Sequelize.TEXT
  },
  icon: {
    type: Sequelize.ENUM('info', 'notice', 'warning', 'error'),
    defaultValue: 'info',
    allowNull: false
  },
  ack: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  indexes: [
    { fields: [ 'userId', 'ack' ] }
  ]
});

// Class methods
Object.assign(Notification, {
  seed(params) {
    return this.findAll({
      where: { userId: params[0] },
      order: [['createdAt', 'DESC']]
    });
  }
});

// Instance methods
Object.assign(Notification.prototype, {
  channelName() {
    return [`notification.${this.userId}`];
  }
});

// Notify methods
Object.assign(Notification.prototype, notifiers);

export default Notification;
