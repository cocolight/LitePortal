import { Controller, Get, Post, Put, Delete, Body, Headers, Res, HttpStatus, Param, NotFoundException } from '@nestjs/common';
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

  @Get('links')
  @ApiOperation({ summary: '获取所有链接' })
  @ApiResponse({ status: 200, description: '获取链接列表成功' })
  async getLinks(@Headers('X-User') username: string) {
    const userId = await this.userService.getOrCreateUser(username || 'guest');
    const links = await this.linkService.getLinks(userId);
    return { 
      code: 200,
      success: true,
      message: '获取链接列表成功',
      data: { links }
    };
  }

  @Post('links')
  @ApiOperation({ summary: '创建新链接' })
  @ApiBody({ type: CreateLinkDto })
  @ApiResponse({ status: 201, description: '创建链接成功' })
  async createLink(
    @Headers('X-User') username: string,
    @Body() linkData: CreateLinkDto,
    @Res() res: Response,
  ) {
    try {
      const userId = await this.userService.getOrCreateUser(username || 'guest');
      const link = await this.linkService.createLink(userId, linkData);
      return res.status(HttpStatus.CREATED).json({
        code: 201,
        success: true,
        message: '创建链接成功',
        data: link
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        code: 400,
        success: false,
        message: error.message || '创建链接失败'
      });
    }
  }

  @Put('links/:id')
  @ApiOperation({ summary: '更新链接' })
  @ApiParam({ name: 'id', description: '链接ID' })
  @ApiBody({ type: CreateLinkDto })
  @ApiResponse({ status: 200, description: '更新链接成功' })
  async updateLink(
    @Headers('X-User') username: string,
    @Param('id') linkId: string,
    @Body() linkData: CreateLinkDto,
    @Res() res: Response,
  ) {
    try {
      const userId = await this.userService.getOrCreateUser(username || 'guest');
      const link = await this.linkService.updateLink(userId, linkId, linkData);
      return res.status(HttpStatus.OK).json({
        code: 200,
        success: true,
        message: '更新链接成功',
        data: link
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          code: 404,
          success: false,
          message: error.message
        });
      }
      return res.status(HttpStatus.BAD_REQUEST).json({
        code: 400,
        success: false,
        message: error.message || '更新链接失败'
      });
    }
  }

  @Delete('links/:id')
  @ApiOperation({ summary: '删除链接' })
  @ApiParam({ name: 'id', description: '链接ID' })
  @ApiResponse({ status: 200, description: '删除链接成功' })
  async deleteLink(
    @Headers('X-User') username: string,
    @Param('id') linkId: string,
    @Res() res: Response,
  ) {
    try {
      const userId = await this.userService.getOrCreateUser(username || 'guest');
      await this.linkService.deleteLink(userId, linkId);
      return res.status(HttpStatus.OK).json({
        code: 200,
        success: true,
        message: '删除链接成功'
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          code: 404,
          success: false,
          message: error.message
        });
      }
      return res.status(HttpStatus.BAD_REQUEST).json({
        code: 400,
        success: false,
        message: error.message || '删除链接失败'
      });
    }
  }

  // 保持向后兼容的旧接口
  @Get('config')
  @ApiOperation({ summary: '获取links配置 (已弃用，请使用 /api/links)' })
  @ApiResponse({ status: 200, description: '获取links配置' })
  async getConfig(@Headers('X-User') username: string) {
    const userId = await this.userService.getOrCreateUser(username || 'guest');
    const links = await this.linkService.getLinks(userId);
    return { links };
  }

  @Post('config')
  @ApiOperation({ summary: '创建或更新links配置 (已弃用，请使用 /api/links)' })
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