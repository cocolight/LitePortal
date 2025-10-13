import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from '../modules/links/link.entity';
import { User } from '../modules/users/user.entity';
import { Init } from './init.entity'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InitDataService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    @InjectRepository(Init)
    private readonly initRepository: Repository<Init>,
    private readonly configService: ConfigService,
  ) { }

  async __initData() {
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

    await this.userRepository.manager.transaction(async (manager) => {
      // 在事务里重新拿 Respository
      const userRepo = manager.getRepository(User);
      const linkRepo = manager.getRepository(Link);
      // 下方的所有操作都是用manager的Repository
      let user = await userRepo.findOne({ where: { username: 'guest' } });
      if (!user) {
        user = userRepo.create({ username: 'guest' });
        await userRepo.save(user);
      }

      for (const linkData of sampleLinks) {
        const exists = await linkRepo.findOne({
          where: { user: { id: user.id }, linkId: linkData.linkId },
          withDeleted: true,
        });

        if (exists) continue
        await linkRepo.save(linkRepo.create({ ...linkData, user }))

      }

      console.log('测试数据初始化完成');

    })



  }

  async initTestData() {

    // 检查是否应该初始化测试数据
    if (!this.configService.get('initTestData')) {
      console.log('当前环境配置为不初始化测试数据');
      return;
    }

    console.log('当前环境允许初始化测试数据...');

    await this.__initData();

  }

  async initProdData() {
    const initRecord = await this.initRepository.findOne({
      where: { key: 'dataInitialized' },
      withDeleted: true,
    })
    if (initRecord) {
      console.log('测试数据已初始化，无需重复初始化');
      return;
    }

    await this.__initData();

    // 标记初始化完成
    await this.initRepository.save({
      key: 'dataInitialized',
      value: true,
    });

  }
}