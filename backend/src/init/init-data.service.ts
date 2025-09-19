import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from '../links/link.entity';
import { User } from '../users/user.entity';
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
        link_id: '1',
        name: 'Google',
        online_icon: 'https://www.google.com/favicon.ico',
        int_url: 'https://www.google.com',
        ext_url: 'https://www.google.com',
        description: 'Google 搜索引擎',
      },
      {
        link_id: '2',
        name: 'GitHub',
        online_icon: 'https://github.com/fluidicon.png',
        int_url: 'https://github.com',
        ext_url: 'https://github.com',
        description: 'GitHub 代码托管平台',
      },
    ];

    for (const linkData of sampleLinks) {
      const existingLink = await this.linkRepository.findOne({
        where: { user: { id: user.id }, link_id: linkData.link_id }
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