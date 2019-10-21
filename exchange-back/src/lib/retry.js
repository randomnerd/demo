import db from '../db';

export default async function retry(fn, retries = 5, interval = 100) {
  retries--;
  return await db.transaction(async t => {
    try {
      let result = await fn(t);
      if (t.notifyQueue && t.notifyQueue.length) {
        for (let notify of t.notifyQueue) {
          let {type, instance, exchange, options} = notify;
          console.log(`${type} to ${instance.constructor.name}#${instance.id}`);
          if (typeof instance[type] == 'function') await instance[type](exchange, options);
        }
      }
      return result;
    } catch (error) {
      if (retries === 0) throw error;
      if (error.name !== 'SequelizeDatabaseError') throw error;
      console.log(error);
      setTimeout(function() { retry(fn, retries, interval) }, interval);
    }
  });
}
