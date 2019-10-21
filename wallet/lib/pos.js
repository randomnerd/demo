import { random } from './hash';

export function numFmt(num, strLen) {
    let s = num.toString();
    while (s.length < strLen) s = '0' + s;
    return s;
}

export function getCurrency(pos) {
    switch(pos['49']) {
        case '643':
        case '840':
            return 'rur';
        case '810':
            return 'usd';
        case '978':
            return 'eur';
        default:
            throw new Error('12');
    }
}

export function getAmount(pos) {
    return parseFloat(pos['4']) / 100;
}

export function convertAmount(srcSymbol, dstSymbol, amount) {
    return amount/1000;
}

export function preparePOSResponse(pos) {
    console.log('prepare response for request:', pos);
    let s = Date.now().toString();
    const RRN = s.substr(s.length-12, s.length);
    const MTI = numFmt(parseInt(pos['0']) + 10, 4);
    const authCode = random(3);
    return {
        '0': MTI,
        '2': pos['2'],
        '3': pos['3'],
        '4': pos['4'],
        '37': RRN,
        '38': authCode,
        '41': pos['41']
    };
}
