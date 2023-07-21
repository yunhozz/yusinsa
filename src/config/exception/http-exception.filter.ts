import { ApiResponse } from '../../common/response/api-response';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost): any {
        const res = host.switchToHttp().getResponse();
        res.json(ApiResponse.fail(exception.getStatus(), exception.message));
    }
}