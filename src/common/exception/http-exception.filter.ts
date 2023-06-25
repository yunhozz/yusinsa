import {ArgumentsHost, Catch, ExceptionFilter, HttpException} from "@nestjs/common";
import {ApiResponse} from "../response/api-response";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost): any {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        response.json(ApiResponse.fail(exception.getStatus(), exception.message));
    }
}