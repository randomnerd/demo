import db from '../db';
import checkAdmin from '../lib/check_admin';

export async function create({model, doc}, respond) {
  try {
    await checkAdmin(this);
    let collection = db.models[model];
    if (!collection) respond(new Error('Unknown model'));
    respond(null, await collection.create(doc));
  } catch (error) {
    console.error(error);
    respond(error);
  }
}

export async function read({ model, options }, respond) {
  try {
    await checkAdmin(this);
    let collection = db.models[model];
    if (!collection) respond(new Error('Unknown model'));
    return collection.findAll(options).then(obj => respond(null, obj)).catch(respond);
  } catch (error) {
    console.error(error);
    respond(error);
  }
}

export async function update({ model, options, doc }, respond) {
  try {
    await checkAdmin(this);
    let collection = db.models[model];
    if (!collection) respond(new Error('Unknown model'));
    const items = await collection.findAll(options);
    await Promise.all(items.map(item => item.update(doc)));
    return respond(null, { updated: items.map(item => item.id) });
  } catch (error) {
    console.error(error);
    respond(error);
  }
}

export async function destroy({ model, options }, respond) {
  try {
    await checkAdmin(this);
    let collection = db.models[model];
    if (!collection) respond(new Error('Unknown model'));
    const items = await collection.findAll(options);
    await Promise.all(items.map(item => item.destroy()));
    return respond(null, {destroyed: items.map(item => item.id)});
  } catch (error) {
    console.error(error);
    respond(error);
  }
}
