export type RequestClass = FWRequest | Request;

export class FWRequest {
    private url: URL;
    private body: BodyInit | null;
    private bodyUsed: boolean;
    private cache: RequestCache;
    private destination: RequestDestination;
    private credentials: RequestCredentials;
    private keepalive: boolean;
    private method: string;
    private mode: RequestMode;
    private redirect: RequestRedirect;

    constructor(input: RequestInfo | URL | FWRequest, init?: RequestInit) {
        if (input instanceof FWRequest) {
            const clone = input.clone();
            this.url = new URL(clone.url);
            this.destination = clone.destination;
            this.credentials = clone.credentials;
            this.keepalive = clone.keepalive;
            this.redirect = clone.redirect;
            this.bodyUsed = clone.bodyUsed;
            this.method = clone.method;
            this.cache = clone.cache;
            this.body = clone.body;
            this.mode = clone.mode;
        } else if (init) {
            this.url = new URL(input as string | URL);
            this.method = this._normalizeRequestMethod(init.method || 'GET');
            this.credentials = init.credentials || 'same-origin';
            this.keepalive = Boolean(init.keepalive);
            this.redirect = init.redirect || 'follow';
            this.cache = init.cache || 'default';
            this.mode = init.mode || 'cors';
            this.body = init.body || null;
            this.destination = "";
            this.bodyUsed = false;
        } else {
            throw new TypeError;
        }
    }

    _normalizeRequestMethod(string: string): string {
        if (typeof (string as unknown) !== 'string') throw new TypeError('_normalizeRequestMethod must accept a string only');
        if (/^(?:GET|HEAD|POST|DELETE|OPTIONS|PUT)$/i.test(string)) {
            return String.prototype.toUpperCase.call(string);
        }
        return string;
    }

    static [Symbol.hasInstance](instance: any) {
        return (instance instanceof Request) || this.prototype.isPrototypeOf(instance);
    }

    clone() {
        // todo actually clone
        return this;
    }
}

class FWResponse {
    constructor(input: BodyInit | URL | FWResponse, init?: ResponseInit) {
    }

    static [Symbol.hasInstance](instance: any) {
        return (instance instanceof Response) || this.prototype.isPrototypeOf(instance);
    }

    clone() {
        // todo actually clone
        return this;
    }
}

export class FWCookie {
    private readonly name: string;
    private readonly value: string;
    private readonly expires?: Date;
    private readonly maxAge: number;
    private readonly path: string;
    private httpOnly: boolean;
    private secure: boolean;

    constructor(name: string, value: string, options: {
        expires: Date,
        maxAge: number,
        path: string,
        httpOnly: boolean,
        secure: boolean,
    }) {
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
        const maxAge = !isNaN(this.maxAge as unknown as number) ? `;Max-Age=${this.maxAge}` : '';// @ts-expect-error
        const expires = !isNaN(this.expires as unknown as number) ? `;Expires=${this.expires.toUTCString()}` : '';
        const booleans = [this.httpOnly ? 'HttpOnly' : '', this.secure ? 'Secure' : '',].join(';');
        return `${this.name}=${this.value}${maxAge}${expires}${booleans ? ';' + booleans : ''}`;
    }

    asCookie() {
        return `${this.name}=${this.value}`;
    }
}

export class FWCookieJar {
    cookies: FWCookie[];

    constructor(cookies: FWCookie[] = []) {
        this.cookies = Array.from(cookies, cookie => ((cookie as unknown) instanceof FWCookie) ? cookie : null).filter(m => m) as FWCookie[];
    }

    set cookie(value: string | FWCookie) {
        if (value instanceof FWCookie) {
            this.cookies.push(value);
        } else {
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
                            options.maxAge = Math.trunc(val as unknown as number);
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
                this.cookies.push(new FWCookie(name, value, options))
            }
        }
    }

    get cookie(): string {
        const result = [];
        for (const cookie1 of this.cookies) {
            result.push(cookie1.asCookie());
        }
        return result.join('; ');
    }
}

export class FWHeaders {
    map: Map<string, string>;
    cookies: FWCookie[];

    constructor(headers: Headers | any) {
        this.map = new Map;
        let array: string[][];
        const callback = (m: [string, string]) => [String(m[0]), String(m[1])];
        if (headers instanceof FWHeaders || headers instanceof Map) {
            array = Array.from(headers.entries(), callback);
        } else {
            // @ts-expect-error
            array = Object.entries(headers).map(callback);
        }
        for (const [headerName, headerValue] of array) {
            this.map.set(headerName.toLowerCase(), headerValue);
        }
        this.cookies = [];
    }

    static [Symbol.hasInstance](instance: any) {
        return (instance instanceof Headers) || this.prototype.isPrototypeOf(instance);
    }

    entries() {
        return this.map.entries();
    }

    fwAddCookie(cookie: FWCookie) {
        if ((cookie as unknown) instanceof FWCookie) {
            return this.cookies.push(cookie);
        }
        throw new TypeError('cookie must be a FWCookie');
    }

    set(name: string, value: string) {
        this.map.set(String(name).toLowerCase(), String(value));
    }

    has() {
    }

    normalizeName(name: string) {
        return `${name}`.toLowerCase();
    }
}
