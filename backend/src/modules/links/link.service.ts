#!/usr/bin/env ts-node
/**
 * @文件    : link.service.ts
 * @时间    : 2025/09/29 15:42:50
 * @版本    : 1.0
 * @作者    : coocolight
 * @依赖    : 无
 * @说明    :
 */

// 内置模块

// 三方包
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// 本地模块
import { Link } from './link.entity';
import { User } from '../users/user.entity';
import { CreateLinkDto, UpdateLinkDto } from './dto/link-request.dto'
import { LinkResponseDto } from './dto/link-response.dto';


@Injectable()
export class LinkService {
  constructor(
    @InjectRepository(Link)
    private readonly linkRepo: Repository<Link>,
  ) {}

  async getLinks(userId: number): Promise<Link[]> {
    return this.linkRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: number, linkId: string): Promise<Link> {
    const link = await this.linkRepo.findOneBy({ user: { id: userId }, linkId });
    if (!link) throw new NotFoundException('链接不存在或无权操作');
    return link;
  }

  async createLink(userId: number, dto: CreateLinkDto): Promise<Link> {
    return this.linkRepo.manager.transaction(async (em) => {
      const link = em.create(Link, {
        user: { id: userId } as User,
        linkId: dto.linkId || Date.now().toString(),
        ...dto,
      });
      return em.save(link);
    });
  }

  async updateLink(userId: number, linkId: string, dto: UpdateLinkDto): Promise<Link> {
    return this.linkRepo.manager.transaction(async (em) => {
      const link = await em.findOneBy(Link, { user: { id: userId }, linkId });
      if (!link) throw new NotFoundException('链接不存在或无权操作');
      em.merge(Link, link, dto);
      return em.save(link);
    });
  }

  async deleteLink(userId: number, linkId: string): Promise<LinkResponseDto> {
    const link = await this.linkRepo.findOneBy({ user: { id: userId }, linkId });
    if (!link) throw new NotFoundException('链接不存在或无权删除');

    await this.linkRepo.softDelete({ user: { id: userId }, linkId });

    return link
  }
}