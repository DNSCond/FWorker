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
