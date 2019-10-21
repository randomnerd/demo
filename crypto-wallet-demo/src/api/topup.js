import db from '../db';

export default async function(req, res) {
    const { accountId, amount } = req.body;
    try {
        await db.model('Balance').topup(accountId, amount.toString());
    } catch (err) {
        return res.status(403).json({
            error: {
                message: err.message,
                stack: err.stack.split("\n")
            }
        });
    }
};
