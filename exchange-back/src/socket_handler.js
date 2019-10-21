import db from './db';
import * as crud from './actions/crud';
import * as user  from './actions/user';
import * as admin from './actions/admin';
import * as order from './actions/order';
import * as message from './actions/message';
import { orderBook } from './lib/order_book';

export default function handleSocket(socket) {
  socket.on('subscribe', channel => seedData(channel, socket));

  const { session } = db.models;
  socket.on('authenticate', session.onLogin.bind(socket));
  socket.on('deauthenticate', session.onLogout.bind(socket));
  socket.on('disconnect', session.onLogout.bind(socket));

  bindActions(socket, 'crud', crud);
  bindActions(socket, 'user',  user);
  bindActions(socket, 'admin', admin);
  bindActions(socket, 'order', order);
  bindActions(socket, 'message', message);
}

function bindActions(socket, namespace, actions) {
  for (let action in actions)
    socket.on([namespace, action].join('.'), actions[action].bind(socket));
}

function publishData(socket, channel, rows) {
  for (let data of rows) {
    socket.emit('#publish', { channel, data: { event: 'create', data } });
  }
  socket.emit('#publish', { channel, data: { event: 'ready' } });
}

async function seedData(channel, socket) {
  let [ name, ...params ] = channel.split('.');
  let model = db.models[name];
  if (model && model.seed) {
    publishData(socket, channel, await model.seed(params));
  } else if (name === 'orderbook') {
    publishData(socket, channel, await orderBook(...params));
  }
}
