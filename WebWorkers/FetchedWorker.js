// FetchedWorker
import { PromisedWorker } from './PromisedWorker.js';
import { FWRequest, FWHeaders } from "./FWClass.js";
export class FetchedWorker {
    worker;
    constructor(webWorker) {
        if (webWorker instanceof Worker) {
            webWorker = new PromisedWorker(webWorker);
        }
        else if (!(webWorker instanceof PromisedWorker))
            throw new TypeError('worker must be a PromisedWorker');
        this.worker = webWorker;
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
    fetch(input, init) {
        const request = (new FWRequest(input, init)).clone(), date = new Date;
        const headers = new FWHeaders(request.headers.entries());
        if (!headers.has('date'))
            headers.set('date', date.toUTCString());
        return this.worker.awaitMessage(request);
    }
    terminate() {
        this.worker.terminate();
    }
}
