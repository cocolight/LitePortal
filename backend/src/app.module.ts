import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LinkModule } from './modules/links/link.module';
import { UserModule } from './modules/users/user.module';
import { InitModule } from './init/init.module'

@Module({
  imports: [
    ConfigModule,      // 1. 注入配置中心，支持 @Injectable() 里直接取环境变量
    DatabaseModule,    // 2. 连接数据库（TypeORM/Mongoose 等）并导出连接实例
    UserModule,        // 3. 用户业务（控制器+服务+实体）
    LinkModule,        // 4. 链接业务（控制器+服务+实体）
    InitModule
  ],
  controllers: [],
  providers:[ ]
})
export class AppModule {}