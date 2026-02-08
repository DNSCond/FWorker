// CustomError
export class CustomError extends Error {
    detail;
    constructor(message, detail) {
        super(message);
        this.detail = detail;
        this.name = new.target?.name ?? 'CustomError';
    }
    get [Symbol.toStringTag]() {
        return this.name;
    }
}
export function toStringTag(mixed) {
    return Object.prototype.toString.call(mixed).slice(8, -1);
}
