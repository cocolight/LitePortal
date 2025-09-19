import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getOrCreateUser(username: string): Promise<number> {
    let user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      user = this.userRepository.create({ username });
      await this.userRepository.save(user);
    }

    return user.id;
  }
}