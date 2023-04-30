import {Result} from "./result";

export class Failure implements Result {

    timestamp: number;
    errMsg: string;

    constructor(timestamp: number, errMsg: string) {
        this.timestamp = timestamp;
        this.errMsg = errMsg;
    }
}