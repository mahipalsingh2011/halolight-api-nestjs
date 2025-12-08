import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

// Mock documents data
const mockDocuments = [
  {
    id: 'doc_1',
    name: 'HaloLight API 使用指南',
    title: 'HaloLight API 使用指南',
    type: 'document',
    size: 2048,
    folder: '/documents',
    content:
      '# HaloLight API 使用指南\n\n## 概述\n\nHaloLight API 是基于 NestJS 构建的企业级后端服务...',
    author: {
      id: 'user_1',
      name: '系统管理员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
    shared: true,
    tags: ['技术文档', '重要'],
    views: 128,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    collaborators: [
      {
        id: 'user_2',
        name: '张三',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
      },
    ],
  },
  {
    id: 'doc_2',
    name: '2024年度产品规划',
    title: '2024年度产品规划',
    type: 'document',
    size: 1536,
    folder: '/projects',
    content:
      '# 2024年度产品规划\n\n## Q1 目标\n\n- 完成基础架构搭建\n- 实现用户认证模块',
    author: {
      id: 'user_4',
      name: '张经理',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
    },
    shared: false,
    tags: ['重要', '项目计划'],
    views: 256,
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-14T15:20:00Z',
    collaborators: [],
  },
  {
    id: 'doc_3',
    name: 'UI设计规范 v2.0',
    title: 'UI设计规范 v2.0',
    type: 'document',
    size: 1024,
    folder: '/design',
    content: '# UI设计规范\n\n## 色彩系统\n\n主色调: #6366f1',
    author: {
      id: 'user_3',
      name: '李四',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
    },
    shared: true,
    tags: ['设计规范'],
    views: 89,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-13T09:45:00Z',
    collaborators: [],
  },
];

@ApiTags('Documents')
@ApiBearerAuth('JWT-auth')
@Controller('documents')
export class DocumentsController {
  @Get()
  @ApiOperation({ summary: 'List documents' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'folder', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Documents retrieved' })
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('type') type?: string,
    @Query('folder') folder?: string,
    @Query('search') search?: string,
  ) {
    let docs = [...mockDocuments];

    if (type) {
      docs = docs.filter((d) => d.type === type);
    }
    if (folder) {
      docs = docs.filter((d) => d.folder === folder);
    }
    if (search) {
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          d.content?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    const p = page || 1;
    const ps = pageSize || 20;
    const start = (p - 1) * ps;
    const paged = docs.slice(start, start + ps);

    return { list: paged, total: docs.length };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document detail' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document found' })
  async findOne(@Param('id') id: string) {
    const doc = mockDocuments.find((d) => d.id === id);
    return (
      doc || {
        id,
        title: 'Unknown Document',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create document' })
  @ApiResponse({ status: 201, description: 'Document created' })
  async create(@Body() dto: CreateDocumentDto) {
    const newDoc = {
      id: `doc_${Date.now()}`,
      ...dto,
      name: dto.title,
      type: 'document',
      size: dto.content?.length || 0,
      author: {
        id: 'user_1',
        name: '系统管理员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      },
      shared: false,
      tags: [],
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collaborators: [],
    };
    return newDoc;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    const doc = mockDocuments.find((d) => d.id === id);
    if (doc) {
      Object.assign(doc, dto);
      doc.updatedAt = new Date().toISOString();
    }
    return doc || { id, ...dto, updatedAt: new Date().toISOString() };
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document shared' })
  async share(@Param('id') id: string, @Body() body: { userIds: string[] }) {
    const doc = mockDocuments.find((d) => d.id === id);
    if (doc) {
      doc.shared = true;
      doc.collaborators = body.userIds.map((uid) => ({
        id: uid,
        name: `User ${uid}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
      }));
    }
    return doc || { id, shared: true, collaborators: body.userIds };
  }

  @Post(':id/unshare')
  @ApiOperation({ summary: 'Unshare document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document unshared' })
  async unshare(@Param('id') id: string, @Body() body: { userIds?: string[] }) {
    const doc = mockDocuments.find((d) => d.id === id);
    if (doc) {
      if (body.userIds) {
        doc.collaborators = doc.collaborators.filter(
          (c) => !body.userIds!.includes(c.id),
        );
      } else {
        doc.shared = false;
        doc.collaborators = [];
      }
    }
    return doc || { id, shared: false, collaborators: [] };
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move document to folder' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document moved' })
  async move(@Param('id') id: string, @Body() body: { folder: string }) {
    const doc = mockDocuments.find((d) => d.id === id);
    if (doc) {
      doc.folder = body.folder;
      doc.updatedAt = new Date().toISOString();
    }
    return doc || { id, folder: body.folder };
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Update document tags' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Tags updated' })
  async updateTags(@Param('id') id: string, @Body() body: { tags: string[] }) {
    const doc = mockDocuments.find((d) => d.id === id);
    if (doc) {
      doc.tags = body.tags;
      doc.updatedAt = new Date().toISOString();
    }
    return doc || { id, tags: body.tags };
  }

  @Patch(':id/rename')
  @ApiOperation({ summary: 'Rename document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document renamed' })
  async rename(@Param('id') id: string, @Body() body: { name: string }) {
    const doc = mockDocuments.find((d) => d.id === id);
    if (doc) {
      doc.name = body.name;
      doc.title = body.name;
      doc.updatedAt = new Date().toISOString();
    }
    return doc || { id, name: body.name, title: body.name };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  async remove(@Param('id') id: string) {
    return { id, deleted: true };
  }

  @Post('batch-delete')
  @ApiOperation({ summary: 'Batch delete documents' })
  @ApiResponse({ status: 200, description: 'Documents deleted' })
  async batchDelete(@Body() body: { ids: string[] }) {
    return { success: true, deleted: body.ids.length };
  }
}
