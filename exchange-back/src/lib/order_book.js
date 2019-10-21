import { Order } from '../models';
export async function orderBook(tradePairId) {
  let query = {
    where: {
      tradePairId,
      type:     'buy',
      complete: false,
      canceled: false
    },
    attributes: [
      'type',
      'price',
      [ 'sum(remain)', 'remain' ]
    ],
    group: ['price', 'type'],
    order: [['price', 'DESC']],
    limit: 20
  };
  let buyBook = await Order.findAll(query);
  query.where.type = 'sell';
  query.order = [['price', 'ASC']];
  let sellBook = await Order.findAll(query);
  return sellBook.concat(buyBook);
}

export function setupHooks(models, exchange) {
  models.Order.afterCreate((instance, options) => {
    if (instance.complete) return;
    exchange.publish(`orderbook.${instance.tradePairId}`, {
      event: 'update',
      data: {
        type:   instance.type,
        price:  instance.price,
        remain: instance.amount
      }
    });
  });

  models.Order.afterUpdate((instance, options) => {
    if (instance.canceled && options.fields.includes('canceled')) {
      exchange.publish(`orderbook.${instance.tradePairId}`, {
        event: 'update',
        data: {
          type:   instance.type,
          price:  instance.price,
          remain: instance.remain.neg()
        }
      });
    }
  });
}
