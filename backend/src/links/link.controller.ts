import { Controller, Get, Post, Body, Headers, Res, HttpStatus } from '@nestjs/common';
import { LinkService } from './link.service';
import { UserService } from '../users/user.service';
import { CreateLinkDto, DeleteLinkDto } from './dto/link.dto';
import { Response } from 'express';

@Controller('api')
export class LinkController {
  constructor(
    private readonly linkService: LinkService,
    private readonly userService: UserService,
  ) {}

  @Get('config')
  async getConfig(@Headers('X-User') username: string) {
    const userId = await this.userService.getOrCreateUser(username || 'guest');
    const links = await this.linkService.getLinks(userId);
    return { links };
  }

  @Post('config')
  async postConfig(
    @Headers('X-User') username: string,
    @Body() payload: CreateLinkDto | DeleteLinkDto,
    @Res() res: Response,
  ) {
    const userId = await this.userService.getOrCreateUser(username || 'guest');

    if ('action' in payload && payload.action === 'delete') {
      await this.linkService.deleteLink(userId, payload.id);
      return res.status(HttpStatus.NO_CONTENT).send();
    }

    await this.linkService.createOrUpdateLink(userId, payload);
    return res.status(HttpStatus.NO_CONTENT).send();
  }
}