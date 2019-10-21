export default function publishHooks(model, exchange) {
  const types = [ 'Create', 'Update', 'Destroy' ];
  for (let type of types) {
    let method = model.prototype['notify' + type];
    if (typeof method != 'function') continue;
    let hook = model['after' + type].bind(model);
    // console.log(`${model.name}: adding notify${type} hook`);
    hook((instance, options) => notify('notify' + type, instance, options, exchange));
  }
}

export function notify(type, instance, options, exchange) {
  let transaction = namespace.get('transaction');
  if (transaction) {
    if (!transaction.notifyQueue) transaction.notifyQueue = [];
    transaction.notifyQueue.push({ instance, exchange, options, type });
  } else {
    console.log(`${type} to ${instance.constructor.name}#${instance.id}`);
    if (typeof instance[type] == 'function') instance[type](exchange, options);
  }
}
