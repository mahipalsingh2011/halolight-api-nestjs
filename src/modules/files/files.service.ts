import { Injectable } from '@nestjs/common';
import { File, Folder, Prisma } from '@prisma/client';
import {
  createPaginatedResponse,
  PaginatedResult,
} from '../../common/interfaces/pagination.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { QueryFilesDto } from './dto/query-files.dto';

/** File type classification */
export type FileType =
  | 'folder'
  | 'image'
  | 'document'
  | 'video'
  | 'audio'
  | 'archive'
  | 'other';

/**
 * File item response interface for API
 * Unified structure for both files and folders
 */
export interface FileItemResponse {
  id: string;
  name: string;
  type: FileType;
  size: number | null;
  items: number | null;
  path: string;
  mimeType: string;
  thumbnail: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Folder with count */
type FolderWithCount = Folder & {
  _count: { files: number; children: number };
};

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get paginated list of files and folders with DB-level pagination
   * Folders are shown first, then files, both sorted by updatedAt desc
   */
  async findAll(
    query: QueryFilesDto,
    userId: string,
  ): Promise<PaginatedResult<FileItemResponse>> {
    const { path, page = 1, pageSize = 20, type, search } = query;

    // Determine what to fetch based on type filter
    const shouldFetchFolders = !type || type === 'folder';
    const shouldFetchFiles = !type || type !== 'folder';

    // Build folder conditions with proper path boundary
    const folderWhere: Prisma.FolderWhereInput = { ownerId: userId };
    if (path) {
      // Use path boundary to avoid matching /doc when querying /documents
      const normalizedPath = path.endsWith('/') ? path : `${path}/`;
      folderWhere.path = { startsWith: normalizedPath };
    }
    if (search) {
      folderWhere.name = { contains: search, mode: 'insensitive' };
    }

    // Build file conditions with proper path boundary
    const fileWhere: Prisma.FileWhereInput = { ownerId: userId };
    if (path) {
      const normalizedPath = path.endsWith('/') ? path : `${path}/`;
      fileWhere.path = { startsWith: normalizedPath };
    }
    if (search) {
      fileWhere.name = { contains: search, mode: 'insensitive' };
    }
    const mimePattern = this.getMimeTypePattern(type);
    if (mimePattern) {
      fileWhere.mimeType = mimePattern;
    }

    // Get counts first for pagination calculation
    const [folderCount, fileCount] = await Promise.all([
      shouldFetchFolders
        ? this.prisma.folder.count({ where: folderWhere })
        : Promise.resolve(0),
      shouldFetchFiles
        ? this.prisma.file.count({ where: fileWhere })
        : Promise.resolve(0),
    ]);

    const total = folderCount + fileCount;

    // Calculate offset for DB-level pagination
    // Strategy: folders first, then files
    const skip = (page - 1) * pageSize;
    let remainingSkip = skip;
    let remainingTake = pageSize;

    const folderItems: FileItemResponse[] = [];
    const fileItems: FileItemResponse[] = [];

    // Fetch folders if needed and within range
    if (shouldFetchFolders && remainingSkip < folderCount) {
      const folderSkip = remainingSkip;
      const folderTake = Math.min(remainingTake, folderCount - folderSkip);

      const folders: FolderWithCount[] = await this.prisma.folder.findMany({
        where: folderWhere,
        include: { _count: { select: { files: true, children: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: folderSkip,
        take: folderTake,
      });

      folderItems.push(
        ...folders.map((folder) => this.transformFolder(folder)),
      );
      remainingTake -= folders.length;
      remainingSkip = 0;
    } else if (shouldFetchFolders) {
      remainingSkip -= folderCount;
    }

    // Fetch files if needed and still have capacity
    if (shouldFetchFiles && remainingTake > 0) {
      const fileSkip = Math.max(0, remainingSkip);
      const fileTake = remainingTake;

      const files: File[] = await this.prisma.file.findMany({
        where: fileWhere,
        orderBy: { updatedAt: 'desc' },
        skip: fileSkip,
        take: fileTake,
      });

      fileItems.push(...files.map((file) => this.transformFile(file)));
    }

    // Combine: folders first, then files
    const combined = [...folderItems, ...fileItems];

    return createPaginatedResponse(combined, total, page, pageSize);
  }

  /**
   * Get storage statistics for a user
   */
  async getStorageStats(userId: string) {
    const files = await this.prisma.file.findMany({
      where: { ownerId: userId },
      select: { size: true, mimeType: true },
    });

    const breakdown = {
      images: BigInt(0),
      videos: BigInt(0),
      audio: BigInt(0),
      documents: BigInt(0),
      archives: BigInt(0),
      others: BigInt(0),
    };

    let totalUsed = BigInt(0);

    for (const file of files) {
      const size = file.size;
      totalUsed += size;

      const fileType = this.getFileType(file.mimeType);
      switch (fileType) {
        case 'image':
          breakdown.images += size;
          break;
        case 'video':
          breakdown.videos += size;
          break;
        case 'audio':
          breakdown.audio += size;
          break;
        case 'document':
          breakdown.documents += size;
          break;
        case 'archive':
          breakdown.archives += size;
          break;
        default:
          breakdown.others += size;
      }
    }

    // Default total storage: 20GB
    const totalStorage = BigInt(20 * 1024 * 1024 * 1024);

    return {
      used: Number(totalUsed),
      total: Number(totalStorage),
      breakdown: {
        images: Number(breakdown.images),
        videos: Number(breakdown.videos),
        audio: Number(breakdown.audio),
        documents: Number(breakdown.documents),
        archives: Number(breakdown.archives),
        others: Number(breakdown.others),
      },
    };
  }

  /**
   * Transform folder to unified response format
   */
  private transformFolder(folder: FolderWithCount): FileItemResponse {
    return {
      id: folder.id,
      name: folder.name,
      type: 'folder',
      size: null,
      items: folder._count.files + folder._count.children,
      path: folder.path,
      mimeType: 'folder',
      thumbnail: null,
      isFavorite: false,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    };
  }

  /**
   * Transform file to unified response format
   */
  private transformFile(file: File): FileItemResponse {
    return {
      id: file.id,
      name: file.name,
      type: this.getFileType(file.mimeType),
      size: Number(file.size),
      items: null,
      path: file.path,
      mimeType: file.mimeType,
      thumbnail: file.thumbnail,
      isFavorite: file.isFavorite,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
    };
  }

  /**
   * Get file type from MIME type
   */
  private getFileType(mimeType: string): FileType {
    if (mimeType === 'folder') return 'folder';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation') ||
      mimeType.startsWith('text/') ||
      mimeType.includes('json')
    ) {
      return 'document';
    }
    if (
      mimeType.includes('zip') ||
      mimeType.includes('tar') ||
      mimeType.includes('rar')
    ) {
      return 'archive';
    }
    return 'other';
  }

  /**
   * Get MIME type pattern for type filter
   * Includes text/ for document filter to match text-based docs
   */
  private getMimeTypePattern(
    type: string | undefined,
  ): Prisma.StringFilter | undefined {
    if (!type) return undefined;

    // For document type, we need OR condition which isn't directly supported
    // So we use a broader match and filter in getFileType
    const patterns: Record<string, string> = {
      image: 'image/',
      video: 'video/',
      audio: 'audio/',
      archive: 'zip',
    };
    const pattern = patterns[type];
    return pattern ? { contains: pattern } : undefined;
  }
}
