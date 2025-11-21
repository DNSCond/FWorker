// FetchedWorkerWithin.ts
import { PromisedWorkerInside, callWith } from "./PromisedWorkerInside.js";
export class FetchedWorkerWithin extends PromisedWorkerInside {
    //private expressHandlers = [];
    callback;
    constructor(settings) {
        super(settings);
        this.callback = null;
        this.setCallback(settings?.callback ?? ((req, res) => res.match(req)));
    }
    get [Symbol.toStringTag]() {
        return 'FetchedWorkerWithin';
    }
    ;
    static get [Symbol.toStringTag]() {
        return 'FetchedWorkerWithin';
    }
    ;
    setCallback(eventListener) {
        const window = this;
        super.setMessageEventListener(function (request) {
            if (!(request instanceof Request)) {
                return new Response(String(new TypeError('Request received wasnt a Request')), { status: 400 });
            }
            // safeCallCallback(eventListener, window, [request, {__proto__
            // : null,match:( (request) => window._match()),} as responseWith
            // ], window.defaultTimeout);const timeout = window.defaultTimeout;
            const { promise, resolve, reject } = Promise.withResolvers();
            let result_Sync, error_Sync;
            try {
                result_Sync = callWith(eventListener, window, [{
                        __proto__: null, match: ((request) => window._match(request)),
                        respondWith: ((response) => resolve(response)),
                    }]);
            }
            catch (errorSyncCatched) {
                error_Sync = errorSyncCatched;
            }
            // if (!isFinite(timeout)) reject(new TypeError("timeout reached"));
            // else if (timeout > 0) setTimeout(() => reject(new TimeoutError("timeout reached")), timeout);
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
            return resultASync.then(function (response) {
                const date = new Date;
                if (response instanceof Response) {
                    return response;
                }
                else if (response instanceof Blob) {
                    return new Response(response, {
                        status: 200,
                        headers: {
                            'Date': date.toUTCString(),
                            'Content-type': response.type,
                            'Last-Modified': date.toUTCString(),
                        },
                    });
                }
                else if (response instanceof ArrayBuffer) {
                    return new Response(response, {
                        status: 200,
                        headers: {
                            'Date': date.toUTCString(),
                            'Content-type': 'application/octet-stream',
                            'Last-Modified': date.toUTCString(),
                        },
                    });
                }
                else if (helpers.isTypedArray(response)) {
                    // @ts-ignore
                    return new Response(response, {
                        status: 200,
                        headers: {
                            'Date': date.toUTCString(),
                            'Content-type': 'application/octet-stream',
                            'Last-Modified': date.toUTCString(),
                        },
                    });
                }
                else if (response instanceof URLSearchParams) {
                    return new Response(response, {
                        status: 200,
                        headers: {
                            'Date': date.toUTCString(),
                            'Content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                            'Last-Modified': date.toUTCString(),
                        },
                    });
                }
                else if (response instanceof String || typeof response === 'string') {
                    response = String(response);
                    return new Response(response, {
                        status: 200,
                        headers: {
                            'Date': date.toUTCString(),
                            'Content-type': `text/plain;charset=UTF-8`,
                            'Last-Modified': date.toUTCString(),
                        },
                    });
                }
                else
                    throw new TypeError(`${toStringTag(response)}`);
            });
        });
    }
    setMessageEventListener() {
        throw new TypeError('use setCallback');
    }
    _match(response) {
        throw new TypeError;
    }
}
function toStringTag(mixed) {
    return Object.prototype.toString.call(mixed);
}
export const helpers = {
    isTypedArray(object) {
        if (object instanceof Uint8Array)
            return true;
        if (object instanceof Uint16Array)
            return true;
        if (object instanceof Uint32Array)
            return true;
        if (object instanceof BigUint64Array)
            return true;
        if (object instanceof Int8Array)
            return true;
        if (object instanceof Int16Array)
            return true;
        if (object instanceof Int32Array)
            return true;
        if (object instanceof Uint8ClampedArray)
            return true;
        if (object instanceof Float32Array)
            return true;
        return (object instanceof BigInt64Array);
    },
};
