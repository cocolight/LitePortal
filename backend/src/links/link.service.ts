import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Link } from './link.entity';
import { User } from '../users/user.entity';

@Injectable()
export class LinkService {
  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    private readonly dataSource: DataSource,
  ) {}

  async getLinks(userId: number): Promise<Link[]> {
    return this.linkRepository.find({
      where: { user: { id: userId } },
      select: ['link_id', 'name', 'online_icon', 'text_icon', 'upload_icon', 'paid_icon','icon_type', 'int_url', 'ext_url', 'desc'],
      order: { created_at: 'DESC' }
    });
  }

  async createLink(userId: number, payload: any): Promise<Link> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const linkData = {
        user: { id: userId },
        link_id: payload.linkId || Date.now().toString(),
        name: payload.name,
        online_icon: payload.onlineIcon || '',
        text_icon: payload.textIcon || '',
        upload_icon: payload.uploadIcon || '',
        paid_icon: payload.paidIcon || '',
        icon_type: payload.iconType || 'online_icon',
        int_url: payload.intUrl,
        ext_url: payload.extUrl,
        desc: payload.desc || '',
      };

      // 创建新链接
      const link = await queryRunner.manager.create(Link, {
        ...linkData,
        created_at: new Date(),
        updated_at: new Date()
      });

      const savedLink = await queryRunner.manager.save(Link, link);

      await queryRunner.commitTransaction();
      return savedLink;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if(err instanceof Error){
        throw new BadRequestException(`创建链接失败: ${err.message}`);
      } else {
        throw new BadRequestException(`创建链接失败: ${String(err)}`);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async updateLink(userId: number, linkId: string, payload: any): Promise<Link> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查找现有链接
      const existingLink = await queryRunner.manager.findOne(Link, {
        where: { user: { id: userId }, link_id: linkId }
      });

      if (!existingLink) {
        throw new NotFoundException('链接不存在或无权更新');
      }

      const linkData = {
        name: payload.name,
        online_icon: payload.onlineIcon || '',
        text_icon: payload.textIcon || '',
        upload_icon: payload.uploadIcon || '',
        paid_icon: payload.paidIcon || '',
        icon_type: payload.iconType || 'online_icon',
        int_url: payload.intUrl,
        ext_url: payload.extUrl,
        desc: payload.desc || '',
      };

      // 更新现有链接
      const updatedLink = await queryRunner.manager.save(Link, {
        ...existingLink,
        ...linkData,
        updated_at: new Date()
      });

      await queryRunner.commitTransaction();
      return updatedLink;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException) {
        throw err; // 重新抛出 NotFoundException
      }
      if(err instanceof Error){
        throw new BadRequestException(`更新链接失败: ${err.message}`);
      } else {
        throw new BadRequestException(`更新链接失败: ${String(err)}`);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async deleteLink(userId: number, linkId: string): Promise<void> {
    const result = await this.linkRepository.delete({ user: { id: userId }, link_id: linkId });
    if (result.affected === 0) {
      throw new NotFoundException('链接不存在或无权删除');
    }
  }

  // 保持向后兼容的旧方法
  async createOrUpdateLink(userId: number, payload: any): Promise<Link> {
    if (payload.linkId) {
      return this.updateLink(userId, payload.linkId, payload);
    } else {
      return this.createLink(userId, payload);
    }
  }
}