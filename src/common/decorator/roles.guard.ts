import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const roles: string[] = this.reflector.get<string[]>(ROLES, context.getHandler());
        const req = context.switchToHttp().getRequest();
        return roles.some(role => req.user?.roles.includes(role));
    }
}