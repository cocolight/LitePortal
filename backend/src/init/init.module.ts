import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { InitDataService } from './init-data.service';
import { User } from '../users/user.entity';
import { Link } from '../links/link.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Link]), // 本模块要用 Repository
    ConfigModule,                           // 要用 ConfigService
  ],
  providers: [InitDataService],
  exports: [InitDataService],              // 可选：方便 AppModule 调用
})
export class InitModule {}