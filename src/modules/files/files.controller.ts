import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { QueryFilesDto } from './dto/query-files.dto';
import { FilesService } from './files.service';

class CreateFolderDto {
  @ApiProperty({ description: 'Folder name', example: 'Documents' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Parent path', required: false, example: '/' })
  @IsOptional()
  @IsString()
  parentPath?: string;
}

// Mock files for fallback when database is empty
const mockFiles = [
  {
    id: 'folder_1',
    name: '文档中心',
    type: 'folder',
    size: null,
    items: 3,
    path: '/documents',
    mimeType: 'folder',
    thumbnail: null,
    isFavorite: false,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'folder_2',
    name: '项目文件',
    type: 'folder',
    size: null,
    items: 5,
    path: '/projects',
    mimeType: 'folder',
    thumbnail: null,
    isFavorite: false,
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-14T15:20:00Z',
  },
  {
    id: 'folder_3',
    name: '设计资源',
    type: 'folder',
    size: null,
    items: 8,
    path: '/design',
    mimeType: 'folder',
    thumbnail: null,
    isFavorite: false,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-13T09:45:00Z',
  },
  {
    id: 'file_1',
    name: 'logo.png',
    type: 'image',
    size: 102400,
    items: null,
    path: '/design/logo.png',
    mimeType: 'image/png',
    thumbnail: 'https://picsum.photos/200/200',
    isFavorite: true,
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
  },
  {
    id: 'file_2',
    name: 'api-spec.json',
    type: 'document',
    size: 51200,
    items: null,
    path: '/documents/api-spec.json',
    mimeType: 'application/json',
    thumbnail: null,
    isFavorite: false,
    createdAt: '2024-01-11T00:00:00Z',
    updatedAt: '2024-01-11T00:00:00Z',
  },
  {
    id: 'file_3',
    name: 'user-guide.pdf',
    type: 'document',
    size: 2048000,
    items: null,
    path: '/documents/user-guide.pdf',
    mimeType: 'application/pdf',
    thumbnail: null,
    isFavorite: false,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'file_4',
    name: 'project-plan.xlsx',
    type: 'document',
    size: 153600,
    items: null,
    path: '/projects/project-plan.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    thumbnail: null,
    isFavorite: false,
    createdAt: '2024-01-09T00:00:00Z',
    updatedAt: '2024-01-09T00:00:00Z',
  },
];

@ApiTags('Files')
@ApiBearerAuth('JWT-auth')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ApiOperation({ summary: 'List files and folders' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  async findAll(
    @Query() query: QueryFilesDto,
    @Request() req: { user?: { sub?: string } },
  ) {
    const userId = req.user?.sub;

    // Use database query if user authenticated
    if (userId) {
      const result = await this.filesService.findAll(query, userId);

      // Return database result if has data, otherwise fallback to mock
      if (result.data.length > 0 || result.meta.total > 0) {
        return result;
      }
    }

    // Fallback to mock data
    let files = [...mockFiles];
    const { path, page = 1, pageSize = 20, type, search } = query;

    if (path) {
      files = files.filter((f) => f.path.startsWith(path) && f.path !== path);
    }
    if (type) {
      files = files.filter((f) => f.type === type);
    }
    if (search) {
      files = files.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    const start = (page - 1) * pageSize;
    const paged = files.slice(start, start + pageSize);

    return {
      data: paged,
      meta: {
        total: files.length,
        page,
        limit: pageSize,
        totalPages: Math.ceil(files.length / pageSize),
      },
    };
  }

  @Get('storage')
  @ApiOperation({ summary: 'Get storage usage statistics' })
  @ApiResponse({ status: 200, description: 'Storage info retrieved' })
  async getStorage(@Request() req: { user?: { sub?: string } }) {
    const userId = req.user?.sub;

    if (userId) {
      return this.filesService.getStorageStats(userId);
    }

    // Default mock storage data
    return {
      used: 5 * 1024 * 1024 * 1024,
      total: 20 * 1024 * 1024 * 1024,
      breakdown: {
        images: 1.5 * 1024 * 1024 * 1024,
        videos: 2 * 1024 * 1024 * 1024,
        audio: 0.3 * 1024 * 1024 * 1024,
        documents: 0.8 * 1024 * 1024 * 1024,
        archives: 0.2 * 1024 * 1024 * 1024,
        others: 0.2 * 1024 * 1024 * 1024,
      },
    };
  }

  @Get('storage-info')
  @ApiOperation({ summary: 'Get storage info (alias)' })
  @ApiResponse({ status: 200, description: 'Storage info retrieved' })
  async getStorageInfo(@Request() req: { user?: { sub?: string } }) {
    return this.getStorage(req);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload file' })
  @ApiResponse({ status: 201, description: 'File uploaded' })
  async upload(
    @Body()
    body: {
      name: string;
      path?: string;
      size?: number;
      mimeType?: string;
    },
  ) {
    const newFile = {
      id: `file_${Date.now()}`,
      name: body.name,
      type: 'document',
      size: body.size || 1024,
      items: null,
      path: `${body.path || '/'}${body.name}`,
      mimeType: body.mimeType || 'application/octet-stream',
      thumbnail: null,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newFile;
  }

  @Post('folder')
  @ApiOperation({ summary: 'Create folder' })
  @ApiResponse({ status: 201, description: 'Folder created' })
  async createFolder(@Body() dto: CreateFolderDto) {
    const newFolder = {
      id: `folder_${Date.now()}`,
      name: dto.name,
      type: 'folder',
      size: null,
      items: 0,
      path: `${dto.parentPath || '/'}${dto.name}`,
      mimeType: 'folder',
      thumbnail: null,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newFolder;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file detail' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File found' })
  async findOne(@Param('id') id: string) {
    const file = mockFiles.find((f) => f.id === id);
    return (
      file || {
        id,
        name: 'unknown',
        type: 'document',
        size: 0,
        path: '/',
        mimeType: 'application/octet-stream',
        thumbnail: null,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Get download URL' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'Download URL retrieved' })
  async getDownloadUrl(@Param('id') id: string) {
    return {
      url: `https://storage.example.com/download/${id}?token=${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
  }

  @Patch(':id/rename')
  @ApiOperation({ summary: 'Rename file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File renamed' })
  async rename(@Param('id') id: string, @Body() body: { name: string }) {
    const file = mockFiles.find((f) => f.id === id);
    if (file) {
      file.name = body.name;
      file.updatedAt = new Date().toISOString();
    }
    return file || { id, name: body.name, updatedAt: new Date().toISOString() };
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File moved' })
  async move(@Param('id') id: string, @Body() body: { targetPath: string }) {
    const file = mockFiles.find((f) => f.id === id);
    if (file) {
      file.path = `${body.targetPath}/${file.name}`;
      file.updatedAt = new Date().toISOString();
    }
    return (
      file || { id, path: body.targetPath, updatedAt: new Date().toISOString() }
    );
  }

  @Post(':id/copy')
  @ApiOperation({ summary: 'Copy file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File copied' })
  async copy(@Param('id') id: string, @Body() body: { targetPath: string }) {
    const file = mockFiles.find((f) => f.id === id);
    if (file) {
      const newFile = {
        ...file,
        id: `file_${Date.now()}`,
        path: `${body.targetPath}/${file.name}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newFile;
    }
    return { id: `file_${Date.now()}`, path: body.targetPath };
  }

  @Patch(':id/favorite')
  @ApiOperation({ summary: 'Toggle favorite' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'Favorite toggled' })
  async toggleFavorite(
    @Param('id') id: string,
    @Body() body: { favorite: boolean },
  ) {
    const file = mockFiles.find((f) => f.id === id);
    return {
      ...(file || { id }),
      isFavorite: body.favorite,
      updatedAt: new Date().toISOString(),
    };
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'Share link created' })
  async share(
    @Param('id') id: string,
    @Body() body: { expiresIn?: number; password?: string },
  ) {
    return {
      shareUrl: `https://share.example.com/f/${id}?t=${Date.now()}`,
      password: body.password,
      expiresAt: body.expiresIn
        ? new Date(Date.now() + body.expiresIn * 1000).toISOString()
        : null,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File deleted' })
  async remove(@Param('id') id: string) {
    return { id, deleted: true };
  }

  @Post('batch-delete')
  @ApiOperation({ summary: 'Batch delete files' })
  @ApiResponse({ status: 200, description: 'Files deleted' })
  async batchDelete(@Body() body: { ids: string[] }) {
    return { success: true, deleted: body.ids.length };
  }
}
