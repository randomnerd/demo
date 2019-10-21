import cnf from 'config';
import Promise from 'bluebird';
import Sequelize from 'sequelize';
import clsBluebird from 'cls-bluebird';
import cls from 'continuation-local-storage';
const ns = global.namespace = cls.createNamespace('exchange');
clsBluebird(ns, Promise);
Sequelize.useCLS(ns);

const dbUrl = `postgres://${cnf.db.user}:${cnf.db.password}@${cnf.db.host}:${cnf.db.port}/${cnf.db.name}`;
const sequelize = new Sequelize(dbUrl, {
  native: true,
  logging: false
});
export default sequelize;
