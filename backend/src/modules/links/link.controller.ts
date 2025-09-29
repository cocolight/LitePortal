#!/usr/bin/env ts-node
/**
 * @文件    : link.controller.ts
 * @时间    : 2025/09/29 15:54:36
 * @版本    : 1.0
 * @作者    : coocolight
 * @依赖    : 无
 * @说明    :
 */

// 内置模块

// 三方包
import {
  Controller, Get, Post, Put, Delete, Body, Param, HttpCode, UseGuards,HttpStatus, ValidationPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, getSchemaPath, ApiBearerAuth } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
// 本地模块

import { UserGuard } from '../../common/guards/user.guard';              // 🚀 引入守卫装饰器
import { UserId } from '../../common/decorators/user.decorator'; // 🚀 引入自定义
import { LinkService } from './link.service';
import { CreateLinkDto, UpdateLinkDto } from './dto/link-request.dto';
import { LinkResponseDto } from './dto/link-response.dto';

@ApiTags('links')
@UseGuards(UserGuard)
@Controller()
export class LinkController {
  constructor(
    private readonly linkService: LinkService,
  ) { }

  /* 获取用户全部链接 */
  @Get('links')
  @ApiOperation({ summary: '获取所有链接' })
  @ApiResponse({ status: 200, schema: { type: 'object', properties: { links: { type: 'array', items: { $ref: getSchemaPath(LinkResponseDto) } } } } })
  async getLinks(
    @UserId() userId: number,
  ): Promise<{ links: LinkResponseDto[] }> {
    const links = await this.linkService.getLinks(userId);
    return { "links": plainToInstance(LinkResponseDto, links) };
  }

  /* 创建链接 */
  @Post('links')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建新链接' })
  @ApiBody({ type: CreateLinkDto })
  @ApiResponse({ status: 201, description: '创建成功', schema: { type: 'object', properties: { link: { $ref: getSchemaPath(LinkResponseDto) } } } })
  async createLink(
    @UserId() userId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreateLinkDto,
  ): Promise<{ link: LinkResponseDto }> {
    const link = await this.linkService.createLink(userId, dto);
    return { "link": plainToInstance(LinkResponseDto, link) };
  }

  /* 更新链接 */
  @Put('links/:linkId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新链接' })
  @ApiParam({ name: 'linkId', description: '链接业务ID' })
  @ApiBody({ type: UpdateLinkDto })
  @ApiResponse({ status: 201, description: '创建成功', schema: { type: 'object', properties: { link: { $ref: getSchemaPath(LinkResponseDto) } } } })
  async updateLink(
    @UserId() userId: number,
    @Param('linkId') linkId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: UpdateLinkDto,
  ): Promise<{ link: LinkResponseDto }> {
    const link = await this.linkService.updateLink(userId, linkId, dto);
    return { "link": plainToInstance(LinkResponseDto, link) };
  }

  /* 删除链接 */
  @Delete('links/:linkId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除链接' })
  @ApiParam({ name: 'linkId', description: '链接业务ID' })
  @ApiResponse({ status: 201, description: '创建成功', schema: { type: 'object', properties: { link: { $ref: getSchemaPath(LinkResponseDto) } } } })
  async deleteLink(
    @UserId() userId: number,
    @Param('linkId') linkId: string,
  ): Promise<{ link: LinkResponseDto }> {
    const link = await this.linkService.deleteLink(userId, linkId);
    return { "link": plainToInstance(LinkResponseDto, link) };
  }
}