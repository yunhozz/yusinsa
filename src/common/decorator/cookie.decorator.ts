import {createParamDecorator, ExecutionContext} from "@nestjs/common";

export const Cookie = createParamDecorator((data: string, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    return req.cookies?.[data];
});