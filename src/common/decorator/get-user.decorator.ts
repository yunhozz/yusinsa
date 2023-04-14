import {createParamDecorator, ExecutionContext} from "@nestjs/common";

export const GetUser = createParamDecorator((data: string, input: ExecutionContext): any => {
    const { user } = input.switchToHttp().getRequest();
    return data ? user?.[data] : user;
});