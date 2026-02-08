// FetchedWorker
import {PromisedWorker} from './PromisedWorker.js';
import {FWRequest, FWHeaders, RequestClass, FWResponse} from "./FWClass.js";

export class FetchedWorker {
    private readonly worker: PromisedWorker;

    constructor(webWorker: PromisedWorker | Worker) {
        if (webWorker instanceof Worker) {
            webWorker = new PromisedWorker(webWorker);
        } else if (!((webWorker as unknown) instanceof PromisedWorker)) {
            throw TypeError('worker must be a PromisedWorker');
        }
        this.worker = webWorker as PromisedWorker;
        Object.defineProperty(this, 'worker', {
            value: webWorker,
            writable: false,
            enumerable: true,
            configurable: false,
        });
        if (!window.isSecureContext) {
            throw new TypeError('PromisedWorker relies on secure context only things (crypto.randomUUID)');
        }
    }

    fetch(input: RequestInfo | URL | RequestClass, init?: RequestInit): Promise<FWResponse> {
        const request = (new FWRequest(input, init)).clone(), date = new Date;
        const headers = new FWHeaders(request.headers.entries());
        if (!headers.has('date')) headers.set('date', date.toUTCString());
        return this.worker.awaitMessage<FWRequest, FWResponse>(request);
    }

    terminate() {
        this.worker.terminate();
    }
}
