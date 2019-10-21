import { Card } from './models';
import { preparePOSResponse } from "./lib/pos";

export async function dispatch(req) {
    try {
        switch (req['0']) {
            // purchase
            case '0200':
                return await payment(req);
            case '0000':
            case '0201':
            case '0400':
            case '0420':
                return Object.assign(preparePOSResponse(req), { '39': '00' });
            // fallback to invalid transaction code
            default:
                throw new Error('12')
        }
    } catch (error) {
        console.error(error);
        // return error code
        return Object.assign(preparePOSResponse(req), { '39': '12' });
        // return Object.assign(preparePOSResponse(req), { '39': error.message });
    }
}

function _purchase(req) {
    switch (req['3'].substr(0, 2)) {
        case '00':
            return payment(req);
        case '09':
            return purchaseWithCashback(req);
        case '20':
            return refund(req);
        default:
            throw new Error('unknown processing code');
    }
}

async function payment(req) {
    const time = +new Date();
    try {
        const card = await Card.getByPan(req['2']);
        const client = global.clients[card.symbol];
        if (!client) throw new Error('12');
        return await client.posPayment(card.uid, req);
    } catch (e) {
        return Object.assign(preparePOSResponse(req), {
            '39': e.message
        });
    } finally {
        console.log(`time for processing: ${(+new Date() - time)/1000}s`)
    }
}

export default dispatch;
