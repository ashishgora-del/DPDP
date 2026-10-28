import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UsersService } from '../../users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Super admin can access everything
    if (user.isSuperAdmin) {
      return true;
    }

    // Get user roles from database
    const userWithRoles = await this.usersService.findByIdWithRoles(user.sub);
    if (!userWithRoles) {
      return false;
    }

    const userRoleNames = userWithRoles.userRoles.map((ur) => ur.role.name);

    return requiredRoles.some((role) => userRoleNames.includes(role));
  }
}
