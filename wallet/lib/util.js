import { eachOfLimit } from 'async';

export function promiseLimit(coll, iteratee, limit = 16) {
    return new Promise((resolve, reject) => {
        const wrapperFn = async (item, idx, callback) => {
            // TODO: figure out whats wrong with callbacks
            try {
                await iteratee(item, idx);
                // callback(null);
            } catch (error) {
                // callback(error);
            }
        };
        eachOfLimit(coll, limit, wrapperFn, error => error ? reject(error) : resolve());
    });
}
