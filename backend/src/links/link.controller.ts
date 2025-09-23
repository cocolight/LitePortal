import { Controller, Get, Post, Body, Headers, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { LinkService } from './link.service';
import { UserService } from '../users/user.service';
import { CreateLinkDto, DeleteLinkDto } from './dto/link.dto';
import { Response } from 'express';

@ApiTags('links')
@Controller('api')
export class LinkController {
  constructor(
    private readonly linkService: LinkService,
    private readonly userService: UserService,
  ) {}

  @Get('config')
  @ApiOperation({ summary: '获取links配置' })
  @ApiResponse({ status: 200, description: '获取links配置' ,type: [CreateLinkDto]})
  async getConfig(@Headers('X-User') username: string) {
    const userId = await this.userService.getOrCreateUser(username || 'guest');
    const links = await this.linkService.getLinks(userId);
    return { links };
  }

  @Post('config')
  @ApiOperation({ summary: '创建或更新links配置' })
  @ApiBody({ type: CreateLinkDto })
  @ApiResponse({ status: 204, description: '创建或更新links配置' })
  async postConfig(
    @Headers('X-User') username: string,
    @Body() payload: CreateLinkDto | DeleteLinkDto,
    @Res() res: Response,
  ) {
    const userId = await this.userService.getOrCreateUser(username || 'guest');

    if ('action' in payload && payload.action === 'delete' && payload.linkId) {
      await this.linkService.deleteLink(userId, payload.linkId);
      return res.status(HttpStatus.NO_CONTENT).send();
    }

    await this.linkService.createOrUpdateLink(userId, payload);
    return res.status(HttpStatus.NO_CONTENT).send();
  }
}