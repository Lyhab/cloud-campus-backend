import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import { users } from '../../db/schema';
import { AuthenticatedRequest } from './auth.guard';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly dbService: DbService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userSub = request.user?.sub;

    if (!userSub) {
      throw new UnauthorizedException('Authenticated user not found.');
    }

    const user = await this.dbService.db
      .select({
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userSub))
      .limit(1);

    if (!user[0]) {
      throw new UnauthorizedException('User not found.');
    }

    if (user[0].status !== 'active') {
      throw new ForbiddenException('Account is not active.');
    }

    if (user[0].role !== 'admin') {
      throw new ForbiddenException('Admin access required.');
    }

    return true;
  }
}
