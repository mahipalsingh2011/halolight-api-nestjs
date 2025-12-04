import { Controller, Get, Header } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/html')
  @ApiExcludeEndpoint()
  getHomePage(): string {
    return this.appService.getHomePage();
  }

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns API status and version information',
  })
  @ApiResponse({
    status: 200,
    description: 'API is running',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'HaloLight API' },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'development' },
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-12-04T12:00:00.000Z' },
      },
    },
  })
  getHello(): object {
    return this.appService.getHello();
  }

  @Public()
  @Get('health/database')
  @ApiOperation({
    summary: 'Database health check',
    description: 'Returns database connection status',
  })
  @ApiResponse({
    status: 200,
    description: 'Database is connected',
    schema: {
      type: 'object',
      properties: {
        database: { type: 'string', example: 'connected' },
        timestamp: { type: 'string', example: '2025-12-04T12:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Database connection failed',
  })
  async checkDatabase(): Promise<object> {
    try {
      // Execute a simple query to test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
