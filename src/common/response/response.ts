import {Result} from "./result";
import {HttpStatus} from "@nestjs/common";
import {Success} from "./success";
import {Failure} from "./failure";

export class Response {

    success: boolean;
    status: HttpStatus;
    result: Result;

    constructor(success: boolean, status: HttpStatus, result: Result) {
        this.success = success;
        this.status = status;
        this.result = result;
    }

    static ok<T>(status: HttpStatus, message: string, data?: T): Response {
        return new Response(true, status, new Success<T>(message, data));
    }

    static fail(status: HttpStatus, errMsg: string): Response {
        return new Response(false, status, new Failure(Date.now(), errMsg));
    }
}