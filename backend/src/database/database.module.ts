import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbPath = configService.get('dbPath');
        // console.log('>>> dbPath =', dbPath);

        return {
          type: 'better-sqlite3',
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