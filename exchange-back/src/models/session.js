import _ from 'lodash';
import Sequelize from 'sequelize';
import db from '../db';
import notifiers from '../lib/notify_model';

export const Session = db.define('session', {
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    ip: {
        type: Sequelize.STRING,
        allowNull: false
    },
    forwardedIp: {
        type: Sequelize.STRING
    },
    login: {
        type: Sequelize.DATE
    },
    logout: {
        type: Sequelize.DATE
    },
    online: {
        type: Sequelize.BOOLEAN
    }
}, {
    timestamps: false
});

// Class methods
Object.assign(Session, {
    seed(params) {
        return this.findAll({ order: [['permalink', 'ASC']] });
    },
    async onLogin() {
        const { request, authToken} = this;
        const { connection, headers } = request;
        const session = await Session.create({
            id: this.id,
            userId: authToken.id,
            ip: connection.remoteAddress,
            forwardedIp: headers['x-forwarded-for']
        });
    },
    async onLogout(t) {
        const { request, authToken } = this;
        const { connection, headers } = request;
        const token = this.authToken || t;
        if (!token) return;
        const session = await Session.findById(this.id);
        if (!session) return;
        session.update({ logout: new Date(), online: false });
    }
});

// Instance methods
Object.assign(Session.prototype, {
});

// Notify methods
// Object.assign(Session.prototype, notifiers);

export default Session;
