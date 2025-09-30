import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserService } from '../../modules/users/user.service';

/**
 * 用户守卫类，用于实现路由守卫功能
 * 该守卫主要负责在请求处理前获取或创建用户，并将用户ID附加到请求对象上
 */
@Injectable()
export class UserGuard implements CanActivate {
  /**
   * 构造函数，注入UserService服务
   * @param userService 用户服务，用于处理用户相关操作
   */
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const username = request.headers['x-user'] || 'guest';
    request.userId = await this.userService.getOrCreateUser(username);
    return true; // 永远放行，只负责“把 userId 挂在请求上”
  }
}