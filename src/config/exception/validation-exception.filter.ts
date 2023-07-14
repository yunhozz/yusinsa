import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '../../common/response/api-response';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
    catch(exception: BadRequestException, host: ArgumentsHost): any {
        const res = host.switchToHttp().getResponse();
        res.json(ApiResponse.fail(HttpStatus.BAD_REQUEST, exception.getResponse()['message']));
    }
}