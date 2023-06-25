import {ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpStatus} from "@nestjs/common";
import {ApiResponse} from "../response/api-response";

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
    catch(exception: BadRequestException, host: ArgumentsHost): any {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        response.json(ApiResponse.fail(HttpStatus.BAD_REQUEST, exception.getResponse()['message']));
    }
}