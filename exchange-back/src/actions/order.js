import retry from '../lib/retry';
import { Order } from '../models';

export async function create({tradePairId, amount, price, type}, respond) {
  try {
    if (!this.authToken) throw new Error(2);
    await retry(async () => {
      let order = await Order.create({
        type,
        price,
        amount,
        tradePairId,
        userId: this.authToken.id
      });
      respond(null, order);
    });
  } catch (error) {
    console.log(error);
    respond(error);
  }
}

export async function cancel({id}, respond) {
  let cancelById = async (orderId) => {
    await retry(async () => {
      let order = await Order.findById(orderId);
      if (order.userId !== this.authToken.id) throw new Error(2);
      await order.cancel();
    });
  }
  try {
    if (!this.authToken) throw new Error(2);
    if (typeof id === "object") {
      for (let i of id) await cancelById(i);
      respond(null, id);
    } else {
      await cancelById(id);
      respond(null, id);
    }
  } catch (error) {
    console.log(error);
    respond(error);
  }
}
