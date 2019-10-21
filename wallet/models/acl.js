import db from '../db';
import { random } from '../lib/hash';
import { methods } from '../dispatcher';

const ACL = db.define('acl', {
    name: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    pubkey: {
        type: db.Sequelize.STRING,
    },
    privkey: {
        type: db.Sequelize.STRING,
    },
    methods: {
        type: db.Sequelize.JSONB,
        allowNull: false
    }
}, {
    indexes: [
        { fields: ['pubkey'], unique: true },
        { fields: ['name'], unique: true },
    ],
    hooks: {
        beforeCreate(instance) {
            instance.pubkey = random();
            instance.privkey = random();
            return instance;
        }
    },
    validate: {
        methodsValid() {
            if (!Array.isArray(this.methods)) throw new Error('methods field is not an array');
            if (!this.methods.length) throw new Error('methods array is empty');
            for (let method of this.methods) {
                if (!Array.prototype.includes.call(this.methods, method)) throw new Error(`unknown method ${method}`);
            }
        }
    }
});

Object.assign(ACL.prototype, {
    isMethodAllowed(method) {
        return this.methods.includes('*') || this.methods.includes(method);
    },

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            pubkey: this.pubkey,
            methods: this.methods,
        };
    },
});

Object.assign(ACL, {
    byPubkey(pubkey) {
        return ACL.findOne({ where: { pubkey } });
    },
    async methodsByPubkey(pubkey) {
        const acl = await this.byPubkey(pubkey);
        if (!acl) throw new Error('ACL not found');
        return acl.methods;
    },
    async isMethodAllowed(pubkey, method) {
        const allowedMethods = await this.methodsByPubkey(pubkey);
        return allowedMethods.includes('*') || allowedMethods.includes(method);
    }
});

export default ACL;
