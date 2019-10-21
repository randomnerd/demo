import retry from './retry';
import {TradePair, Order} from '../models';

export default async function processStuckOrders() {
  let pairs = await TradePair.findAll();
  for (let pair in pairs) processPair(pairs[pair]);
}

async function processPair(pair) {
  let order = await getBest(pair);
  if (!order) return;
  retry(() => order.execute());
}

function getBest(pair) {
  let where = {
    type:          'sell',
    tradePairId:   pair.id,
    complete:      false,
    canceled:      false
  };
  return Order.findOne({
    where,
    order: [
      [ 'price', 'ASC' ],
      [ 'createdAt', 'DESC' ]
    ]
  });
}
