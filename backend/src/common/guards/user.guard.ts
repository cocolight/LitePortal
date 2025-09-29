import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserService } from '../../modules/users/user.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const username = request.headers['x-user'] || 'guest';
    request.userId = await this.userService.getOrCreateUser(username);
    return true; // 永远放行，只负责“把 userId 挂在请求上”
  }
}