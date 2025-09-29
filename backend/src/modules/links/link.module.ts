import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkController } from './link.controller';
import { LinkService } from './link.service';
import { Link } from './link.entity';
import { UserModule} from '../users/user.module'
import { UserGuard } from '../../common/guards/user.guard';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([Link])],
  controllers: [LinkController],
  providers: [LinkService, UserGuard],
  exports: [LinkService],
})
export class LinkModule {}