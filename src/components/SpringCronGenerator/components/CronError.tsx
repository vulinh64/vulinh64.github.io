export class CronError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CronError';
    }
}