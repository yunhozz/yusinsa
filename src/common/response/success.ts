import {Result} from "./result";

export class Success<T> implements Result {

    message: string;
    data?: T;

    constructor(message: string, data?: T) {
        this.message = message;
        this.data = data;
    }
}