import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { InitDataService } from './init-data.service';
import { Link } from '../links/link.entity';
import { User } from '../users/user.entity';
import { UserModule } from '../users/user.module';
import { LinkModule } from '../links/link.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // 确保数据库目录存在
        const dbPath = configService.get('dbPath');
        let dbDir;
        
        if (process.env.NODE_ENV === 'development' && !dbPath.includes('://')) {
          // 开发环境，确保src/data目录存在
          dbDir = join(__dirname, '../../data');
          if (!existsSync(dbDir)) {
            mkdirSync(dbDir, { recursive: true });
          }
        } else {
          // 生产环境或其他情况，使用数据库路径的目录
          dbDir = dirname(dbPath);
          if (!existsSync(dbDir)) {
            mkdirSync(dbDir, { recursive: true });
          }
        }

        return {
          type: 'sqlite',
          database: dbPath,
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: configService.get('nodeEnv') === 'development',
          logging: configService.get('logLevel') === 'debug',
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
    LinkModule,
  ],
  providers: [InitDataService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}