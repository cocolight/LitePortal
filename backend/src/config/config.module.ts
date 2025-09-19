import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configuration } from './configuration';

console.log('>>> process.env.NODE_ENV =', process.env.NODE_ENV);
console.log('>>> process.env.DB_PATH   =', process.env.DB_PATH);

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'], // 关键一行
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}