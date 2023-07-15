import { Result } from './result';

export class Failure implements Result {
    timestamp: Date;
    errMsg: string;

    constructor(timestamp: Date, errMsg: string) {
        this.timestamp = timestamp;
        this.errMsg = errMsg;
    }
}