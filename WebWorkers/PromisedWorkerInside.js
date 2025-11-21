// inside the worker
import { CustomError } from "./CustomError.js";
export class PromisedWorkerInside {
    defaultTimeout;
    eventListener_;
    constructor(settings) {
        addEventListener('message', event => this.eventListener(event));
        this.defaultTimeout = Number(settings?.timeout ?? 100_000);
        this.eventListener_ = null;
    }
    eventListener(event) {
        const promisedWorker = this, uuid = event.data?.uuid;
        if (uuid) {
            const eventListener = this.eventListener_;
            if (typeof eventListener !== 'function') {
                const message = new TypeError('eventListener is not a function');
                postMessage({ uuid, message, errored: true });
                return;
            }
            const { promise, resolve, reject } = Promise.withResolvers();
            let result_Sync, error_Sync;
            try {
                result_Sync = callWith(eventListener, promisedWorker, [event.data.message, resolve, reject]);
            }
            catch (errorSyncCatched) {
                error_Sync = errorSyncCatched;
            }
            let resultASync;
            if (result_Sync !== undefined) {
                resultASync = Promise.resolve(result_Sync);
                reject(new Error('this is not needed anymore'));
            }
            else if (error_Sync !== undefined) {
                resultASync = Promise.reject(error_Sync);
                reject(new Error('this is not needed anymore'));
            }
            else
                resultASync = Promise.resolve(promise);
            resultASync.then(message => ({ message, errored: false }), message => ({ message, errored: true }))
                .then(function (result) {
                const { message, errored } = result;
                postMessage({ uuid, message, errored });
            });
            // safeCallCallback(eventListener, promisedWorker, [event.data.message], this.defaultTimeout)
            // .then(message => ({message, errored: false}), message => ({message, errored: true}))
            // .then(function (result) {
            //     const {message, errored} = result;
            //     postMessage({uuid, message, errored});
            // });
        }
    }
    setMessageEventListener(eventListener) {
        if (typeof eventListener !== 'function')
            return false;
        return Reflect.set(this, 'eventListener_', eventListener);
    }
    get [Symbol.toStringTag]() {
        return 'PromisedWorkerInside';
    }
    ;
    static get [Symbol.toStringTag]() {
        return 'PromisedWorkerInside';
    }
    ;
}
export class TimeoutError extends CustomError {
    constructor(message) {
        super(message, null);
    }
}
export function callWith(callable, thisContext, ...args) {
    return Function.prototype.apply.call(callable, thisContext, args);
}
// export function safeCallCallback(callable: Function, thisContext: any, args: any[], timeout: number) {
//     const {promise, resolve, reject} = Promise.withResolvers();
//     let result_Sync, error_Sync;
//     try {
//         result_Sync = callWith(callable, thisContext, ...args, resolve, reject);
//     } catch (errorSyncCatched) {
//         error_Sync = errorSyncCatched;
//     }
//     if (!isFinite(timeout)) reject(new TypeError("timeout reached"));
//     else if (timeout > 0) setTimeout(() => reject(new TimeoutError("timeout reached")), timeout);
//     let resultASync: Promise<unknown>;
//     if (result_Sync !== undefined) {
//         resultASync = Promise.resolve(result_Sync);
//         reject(new Error('this is not needed anymore'));
//     } else if (error_Sync !== undefined) {
//         resultASync = Promise.reject(error_Sync);
//         reject(new Error('this is not needed anymore'));
//     } else resultASync = Promise.resolve(promise);
// return resultASync;}
