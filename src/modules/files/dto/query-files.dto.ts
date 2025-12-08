import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryFilesDto {
  @ApiPropertyOptional({
    description: 'File path filter',
    example: '/documents',
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size (max 100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: 'File type filter',
    example: 'folder',
    enum: ['folder', 'image', 'document', 'video', 'audio', 'archive', 'other'],
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Search keyword', example: 'report' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;
}
