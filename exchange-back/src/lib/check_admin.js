import db from '../db';

export default async function checkAdmin(socket) {
    if (socket.authState !== socket.AUTHENTICATED) throw new Error('Unauthorized');
    let user = await db.models.user.findById(socket.authToken.id);
    if (user.role !== 'admin') throw new Error('Must be admin');
}
