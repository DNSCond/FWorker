import { toStringTag } from "./CustomError.js";
export class FWRequest {
    url;
    body;
    bodyUsed;
    cache;
    destination;
    credentials;
    keepalive;
    method;
    mode;
    redirect;
    headers;
    constructor(input, init) {
        if (input instanceof FWRequest) {
            const clone = input.clone();
            this.url = new URL(clone.url);
            this.destination = clone.destination;
            this.credentials = clone.credentials;
            this.keepalive = clone.keepalive;
            this.redirect = clone.redirect;
            this.bodyUsed = clone.bodyUsed;
            this.headers = clone.headers;
            this.method = clone.method;
            this.cache = clone.cache;
            this.body = clone.body;
            this.mode = clone.mode;
        }
        else if (init) {
            this.url = new URL(input);
            this.method = this._normalizeRequestMethod(init.method || 'GET');
            this.credentials = init.credentials || 'same-origin';
            this.headers = new FWHeaders(init.headers);
            this.keepalive = Boolean(init.keepalive);
            this.redirect = init.redirect || 'follow';
            this.cache = init.cache || 'default';
            this.mode = init.mode || 'cors';
            this.body = init.body || null;
            this.destination = "";
            this.bodyUsed = false;
        }
        else {
            throw TypeError('FWRequest must be made of either RequestInfo | URL | FWRequest' +
                ', received ' + toStringTag(input));
        }
    }
    _normalizeRequestMethod(string) {
        if (typeof string !== 'string')
            throw new TypeError('_normalizeRequestMethod must accept a string only');
        if (/^(?:GET|HEAD|POST|DELETE|OPTIONS|PUT)$/i.test(string)) {
            return String.prototype.toUpperCase.call(string);
        }
        return string;
    }
    static [Symbol.hasInstance](instance) {
        return (instance instanceof Request) || this.prototype.isPrototypeOf(instance);
    }
    clone() {
        // todo actually clone
        return this;
    }
}
export class FWResponse {
    constructor(input, init) {
    }
    static [Symbol.hasInstance](instance) {
        return (instance instanceof Response) || this.prototype.isPrototypeOf(instance);
    }
    clone() {
        // todo actually clone
        return this;
    }
}
export class FWCookie {
    name;
    value;
    expires;
    maxAge;
    path;
    httpOnly;
    secure;
    constructor(name, value, options) {
        options = Object(options);
        this.name = encodeURIComponent(name);
        this.value = encodeURIComponent(value);
        this.expires = options.expires ? new Date(options.expires) : undefined;
        this.maxAge = Math.trunc(options.maxAge);
        this.path = `${options.path}`;
        this.secure = Boolean(options.secure);
        this.httpOnly = Boolean(options.httpOnly);
    }
    toString() {
        const maxAge = !isNaN(this.maxAge) ? `;Max-Age=${this.maxAge}` : ''; // @ts-expect-error
        const expires = !isNaN(this.expires) ? `;Expires=${this.expires.toUTCString()}` : '';
        const booleans = [this.httpOnly ? 'HttpOnly' : '', this.secure ? 'Secure' : '',].join(';');
        return `${this.name}=${this.value}${maxAge}${expires}${booleans ? ';' + booleans : ''}`;
    }
    asCookie() {
        return `${this.name}=${this.value}`;
    }
}
export class FWCookieJar {
    cookies;
    constructor(cookies = []) {
        this.cookies = Array.from(cookies, cookie => (cookie instanceof FWCookie) ? cookie : null).filter(m => m);
    }
    set cookie(value) {
        if (value instanceof FWCookie) {
            this.cookies.push(value);
        }
        else {
            const [pair, ...attrs] = String(value).split(";").map(s => s.trim());
            {
                const [name, value] = pair.split("=");
                const options = {
                    secure: false, expires: new Date(0),
                    path: '', maxAge: 0, httpOnly: false,
                };
                for (const attr of attrs) {
                    const [key, val] = attr.split("=").map(m => m.trim());
                    switch (key.toLowerCase().trim()) {
                        case "path":
                            options.path = val;
                            break;
                        case "max-age":
                            options.maxAge = Math.trunc(val);
                            break;
                        case "expires":
                            options.expires = new Date(val);
                            break;
                        case "httponly":
                            options.httpOnly = true;
                            break;
                        case "secure":
                            options.secure = true;
                            break;
                    }
                }
                this.cookies.push(new FWCookie(name, value, options));
            }
        }
    }
    get cookie() {
        const result = [];
        for (const cookie1 of this.cookies) {
            result.push(cookie1.asCookie());
        }
        return result.join('; ');
    }
}
export class FWHeaders {
    map;
    cookies;
    constructor(headers) {
        this.map = new Map;
        let array;
        const callback = (m) => [String(m[0]), String(m[1])];
        if (headers instanceof FWHeaders || headers instanceof Map) {
            array = Array.from(headers.entries(), callback);
        }
        else {
            // @ts-expect-error
            array = Object.entries(headers).map(callback);
        }
        for (const [headerName, headerValue] of array) {
            this.map.set(headerName.toLowerCase(), headerValue);
        }
        this.cookies = [];
    }
    static [Symbol.hasInstance](instance) {
        return (instance instanceof Headers) || this.prototype.isPrototypeOf(instance);
    }
    entries() {
        return this.map.entries();
    }
    fwAddCookie(cookie) {
        if (cookie instanceof FWCookie) {
            return this.cookies.push(cookie);
        }
        throw new TypeError('cookie must be a FWCookie');
    }
    set(name, value) {
        this.map.set(`${name}`.toLowerCase(), `${value}`);
    }
    has(name) {
        return this.map.has(this.fwNormalizeName(`${name}`));
    }
    fwNormalizeName(name) {
        return `${name}`.toLowerCase();
    }
}
