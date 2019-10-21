import retry from '../lib/retry';
import { Message } from '../models';

export async function create({ text, isPrivate, dstUserId }, respond) {
  try {
    if (!this.authToken) throw new Error(2);
    let msg = await Message.create({
      text,
      isPrivate,
      dstUserId,
      userId: this.authToken.id
    });
    respond(null, msg);
  } catch (error) {
    console.log(error);
    respond(error);
  }
}