import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { InitDataService } from './init-data.service';
import { User } from '../modules/users/user.entity';
import { Link } from '../modules/links/link.entity';
import { Init} from './init.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Link, Init]), // 本模块要用 Repository
    ConfigModule,                           // 要用 ConfigService
  ],
  providers: [InitDataService],
  exports: [InitDataService],              // 可选：方便 AppModule 调用
})
export class InitModule {}