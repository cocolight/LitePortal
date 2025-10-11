import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from '../modules/links/link.entity';
import { User } from '../modules/users/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InitDataService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    private readonly configService: ConfigService,
  ) {}

  async initTestData() {
    // 检查是否应该初始化测试数据
    if (!this.configService.get('initTestData')) {
      console.log('当前环境配置为不初始化测试数据');
      return;
    }

    console.log('当前环境允许初始化测试数据...');

    // 查找或创建默认用户
    let user = await this.userRepository.findOne({ where: { username: 'guest' } });
    if (!user) {
      user = this.userRepository.create({ username: 'guest' });
      await this.userRepository.save(user);
    }

    // 添加一些示例链接
    const sampleLinks = [
      {
        linkId: '1',
        name: '个人博客',
        onlineIcon: 'https://alili.website/favicon.ico',
        intUrl: 'https://alili.website',
        extUrl: 'https://alili.website',
        desc: '我的博客',
      },
      {
        linkId: '2',
        name: 'LitePortal',
        onlineIcon: 'https://github.com/favicon.ico',
        intUrl: 'https://github.com/cocolight/LitePortal',
        extUrl: 'https://github.com/cocolight/LitePortal',
        desc: 'LitePortal github地址',
      },
    ];

    for (const linkData of sampleLinks) {
      const existingLink = await this.linkRepository.findOne({
        where: { user: { id: user.id }, linkId: linkData.linkId }
      });

      if (!existingLink) {
        const link = this.linkRepository.create({
          ...linkData,
          user,
        });
        await this.linkRepository.save(link);
        console.log(`添加链接: ${linkData.name}`);
      }
    }

    console.log('测试数据初始化完成');
  }
}