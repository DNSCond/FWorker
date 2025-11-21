// FetchedWorkerWithin.ts
import {PromisedWorkerInside, TimeoutError, callWith} from "./PromisedWorkerInside.js";

type responseWith = {
    respondWith: (response: Response) => unknown;
    match: (response: Request) => unknown;
};
type Callback<T> = (req: Request, res: responseWith) => T;

export class FetchedWorkerWithin extends PromisedWorkerInside {
    //private expressHandlers = [];
    private callback: Callback<unknown> | null;

    constructor(settings?: { timeout: number, callback: Callback<unknown> }) {
        super(settings);
        this.callback = null;
        this.setCallback(settings?.callback ?? ((req: Request, res: responseWith) => res.match(req)));
    }

    get [Symbol.toStringTag]() {
        return 'FetchedWorkerWithin';
    };

    static get [Symbol.toStringTag]() {
        return 'FetchedWorkerWithin';
    };

    setCallback<RETURN>(eventListener: Callback<RETURN>) {
        const window = this;
        super.setMessageEventListener(function (request) {
            if (!(request instanceof Request)) {
                return new Response(String(new TypeError('Request received wasnt a Request')), {status: 400});
            }
            // safeCallCallback(eventListener, window, [request, {__proto__
            // : null,match:( (request) => window._match()),} as responseWith
            // ], window.defaultTimeout);const timeout = window.defaultTimeout;
            const {promise, resolve, reject} = Promise.withResolvers<Response>();
            let result_Sync, error_Sync;
            try {
                result_Sync = callWith(eventListener, window, [{
                    __proto__: null, match: ((request) => window._match(request)),
                    respondWith: ((response) => resolve(response)),
                } as responseWith]);
            } catch (errorSyncCatched) {
                error_Sync = errorSyncCatched;
            }
            // if (!isFinite(timeout)) reject(new TypeError("timeout reached"));
            // else if (timeout > 0) setTimeout(() => reject(new TimeoutError("timeout reached")), timeout);
            let resultASync: Promise<unknown>;
            if (result_Sync !== undefined) {
                resultASync = Promise.resolve(result_Sync);
                reject(new Error('this is not needed anymore'));
            } else if (error_Sync !== undefined) {
                resultASync = Promise.reject(error_Sync);
                reject(new Error('this is not needed anymore'));
            } else resultASync = Promise.resolve(promise);

            return resultASync.then(function (response) {
                const date = new Date;
                if (response instanceof Response) {
                    return response;
                } else if (response instanceof Blob) {
                    return new Response(response, {
                        status: 200,
                        headers: {
                            'Date': date.toUTCString(),
                            'Content-type': response.type,
                            'Last-Modified': date.toUTCString(),
                        },
                    });
                } else if (response instanceof ArrayBuffer) {
                    return new Response(response, {
                        status: 200,
                        headers: {
                            'Date': date.toUTCString(),
                            'Content-type': 'application/octet-stream',
                            'Last-Modified': date.toUTCString(),
                        },
                    });
                } else if (helpers.isTypedArray(response)) {
                    // @ts-ignore
                    return new Response(response as TypedArray, {
                        status: 200,
                        headers: {
                            'Date': date.toUTCString(),
                            'Content-type': 'application/octet-stream',
                            'Last-Modified': date.toUTCString(),
                        },
                    });
                } else if (response instanceof URLSearchParams) {
                    return new Response(response, {
                        status: 200,
                        headers: {
                            'Date': date.toUTCString(),
                            'Content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                            'Last-Modified': date.toUTCString(),
                        },
                    });
                } else if (response instanceof String || typeof response === 'string') {
                    response = String(response);
                    return new Response(response as string, {
                        status: 200,
                        headers: {
                            'Date': date.toUTCString(),
                            'Content-type': `text/plain;charset=UTF-8`,
                            'Last-Modified': date.toUTCString(),
                        },
                    });
                } else throw new TypeError(`${toStringTag(response)}`);
            });
        });
    }

    setMessageEventListener(): never {
        throw new TypeError('use setCallback');
    }

    _match(response: Request) {
        throw new TypeError;
    }
}

function toStringTag(mixed: any): string {
    return Object.prototype.toString.call(mixed);
}

export type TypedArray =
    | Uint8Array
    | Uint16Array
    | Uint32Array
    | BigUint64Array
    | Int8Array
    | Int16Array
    | Int32Array
    | Uint8ClampedArray
    | Float32Array
    | BigInt64Array;
export const helpers = {
    isTypedArray(object: TypedArray | unknown): boolean {
        if (object instanceof Uint8Array) return true;
        if (object instanceof Uint16Array) return true;
        if (object instanceof Uint32Array) return true;
        if (object instanceof BigUint64Array) return true;
        if (object instanceof Int8Array) return true;
        if (object instanceof Int16Array) return true;
        if (object instanceof Int32Array) return true;

        if (object instanceof Uint8ClampedArray) return true;
        if (object instanceof Float32Array) return true;
        return (object instanceof BigInt64Array);
    },
};
