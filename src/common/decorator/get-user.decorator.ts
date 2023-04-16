import {createParamDecorator, ExecutionContext} from "@nestjs/common";

export const GetUser = createParamDecorator((data: string, context: ExecutionContext): any => {
    const { user } = context.switchToHttp().getRequest();
    return data ? user?.[data] : user;
});