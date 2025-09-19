import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbPath = configService.get('dbPath');
        console.log('>>> dbPath =', dbPath);

        return {
          type: 'sqlite',
          database: dbPath,
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: configService.get('nodeEnv') === 'development',
          logging: configService.get('logLevel') === 'debug',
        };
      },
      inject: [ConfigService],
    })
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}