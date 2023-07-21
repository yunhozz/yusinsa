import { HttpStatus } from '@nestjs/common';
import { Failure } from './failure';
import { Result } from './result';
import { Success } from './success';

export class ApiResponse {
    success: boolean;
    status: HttpStatus;
    result: Result;

    private constructor(success: boolean, status: HttpStatus, result: Result) {
        this.success = success;
        this.status = status;
        this.result = result;
    }

    static ok<T>(status: HttpStatus, message: string, data?: T): ApiResponse {
        return new ApiResponse(true, status, new Success<T>(message, data));
    }

    static fail(status: HttpStatus, errMsg: string): ApiResponse {
        return new ApiResponse(false, status, new Failure(new Date(), errMsg));
    }
}