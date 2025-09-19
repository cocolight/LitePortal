import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from './link.entity';
import { User } from '../users/user.entity';

@Injectable()
export class LinkService {
  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
  ) {}

  async getLinks(userId: number): Promise<any[]> {
    return this.linkRepository.find({
      where: { user: { id: userId } },
      select: ['id', 'link_id', 'name', 'online_icon', 'text_icon', 'upload_icon', 'icon_type', 'int_url', 'ext_url', 'description']
    });
  }

  async createOrUpdateLink(userId: number, payload: any): Promise<void> {
    const linkData = {
      user: { id: userId },
      link_id: payload.id || Date.now().toString(),
      name: payload.name,
      online_icon: payload.onlineIcon || payload.icon,
      text_icon: payload.textIcon || '',
      upload_icon: payload.uploadIcon || '',
      icon_type: payload.iconType || 'online_icon',
      int_url: payload.int,
      ext_url: payload.ext,
      description: payload.desc,
    };

    const existingLink = await this.linkRepository.findOne({
      where: { user: { id: userId }, link_id: payload.id }
    });

    if (existingLink) {
      await this.linkRepository.update(
        { id: existingLink.id },
        { ...linkData, updated_at: new Date() }
      );
    } else {
      await this.linkRepository.save(linkData);
    }
  }

  async deleteLink(userId: number, linkId: string): Promise<void> {
    await this.linkRepository.delete({ user: { id: userId }, link_id: linkId });
  }
}