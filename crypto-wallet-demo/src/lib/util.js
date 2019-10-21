export function numericArray(length) {
    return Array.apply(null, { length }).map(Number.call, Number)
};

export function sleep (ms) {
    return new Promise((resolve, _) => setTimeout(() => resolve(), ms))
}

export function chunkString(str, length) {
    return str.match(new RegExp('.{1,' + length + '}', 'g'));
}

export default {
    sleep,
    chunkString,
    numericArray,
};
