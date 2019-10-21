import Raven from 'raven';
Raven.config('https://b8c2495870bb11e7a9c84201c0a8d02a@sentry.io/160813').install();
import * as models from './models';
import publishHooks from './lib/publish_hooks';
import handleSocket from './socket_handler';
import throttle from './lib/throttle';
import processStuckOrders from './lib/process_stuck_orders';
import { setupHooks as orderbookHooks } from './lib/order_book';
import db from './db';

export default async function run(worker) {
  let scServer = worker.scServer;
  throttle(scServer);
  scServer.on('connection', handleSocket);
  orderbookHooks(models, scServer.exchange);
  for (let model in models) publishHooks(models[model], scServer.exchange);
  setInterval(processStuckOrders, process.env.NODE_ENV === 'production' ? 10000 : 1000);

  for (let currency of await models.Currency.all()) currency.cryptoClient().start();

  scServer.addMiddleware(scServer.MIDDLEWARE_EMIT, async (req, next) => {
    const allowedEvents = [ 'user.logout' ];
    if (allowedEvents.includes(req.event)) return next();
    if (req.socket.authState !== req.socket.AUTHENTICATED) return next();
    let user = await db.models.user.findById(req.socket.authToken.id);
    return next(user.banned ? new Error(15) : null);
  });
}
