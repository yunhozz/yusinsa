import {createParamDecorator, ExecutionContext} from "@nestjs/common";

export const GetUser = createParamDecorator((data: string, context: ExecutionContext): bigint => {
    const req = context.switchToHttp().getRequest();
    return req.user.sub;
});