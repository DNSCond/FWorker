// PromisedWorker
import {CustomError} from "./CustomError.js";

export class PromisedWorker {
    private jobs: Map<string, { resolve: Function, reject: Function, promiseId: string }>;
    private readonly worker: Worker;

    constructor(webWorker: Worker) {
        this.worker = webWorker;
        Object.defineProperty(this, 'worker', {
            value: webWorker,
            writable: false,
            enumerable: true,
            configurable: false,
        });
        if (!window.isSecureContext) throw new TypeError('PromisedWorker relies on secure context only things (crypto.randomUUID)');
        webWorker.addEventListener("message", event => this.eventListener(event))
        this.jobs = new Map;
    }

    awaitMessage<SEND, RETURN>(message: SEND, timeout = 100_000): Promise<RETURN> {
        const {promise, resolve, reject} = Promise.withResolvers(),
            uuid = self.crypto.randomUUID();
        if (this.jobs.has(uuid)) throw new RangeError("UUID collision detected");
        this.jobs.set(uuid, {resolve, reject, promiseId: uuid});
        this.worker.postMessage({message, uuid});
        {
            const self = this;
            if (!isFinite(timeout)) {
                reject(new RangeError("timeout is not a number or undefined"));
            } else if (timeout > 0) {
                setTimeout(function () {
                    if (self.jobs.has(uuid)) {
                        self.jobs.delete(uuid);
                        reject(new TimeoutError("timeout reached"));
                    }
                }, timeout);
            }
        }
        return promise as Promise<RETURN>;
    }

    eventListener(event: MessageEvent) {
        const uuid = event.data?.uuid;
        if (this.jobs.has(uuid)) {
            const {resolve, reject} = this.jobs.get(uuid)!;
            this.jobs.delete(uuid);
            if (event.data?.errored === false) {
                resolve(event.data.message);
            } else if (event.data?.message instanceof Error) {
                reject(event.data?.message);
            } else {
                reject(new TypeError('an Error has occurred'));
            }
        }
        return this;
    }

    terminate() {
        this.worker.terminate();
        for (const {reject} of this.jobs.values()) {
            reject(new TerminationError("worker is terminated"));
        }
        this.jobs.clear();
    }

    get [Symbol.toStringTag]() {
        return 'PromisedWorker';
    };

    static get [Symbol.toStringTag]() {
        return 'PromisedWorker';
    };
}

export class TerminationError extends CustomError<null> {
    constructor(message: string) {
        super(message, null);
    }

    get [Symbol.toStringTag]() {
        return this.name;
    };
}

export class TimeoutError extends CustomError<null> {
    constructor(message: string) {
        super(message, null);
    }
}
