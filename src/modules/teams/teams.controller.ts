import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTeamDto } from './dto/create-team.dto';

export class UpdateTeamDto {
  name?: string;
  description?: string;
  avatar?: string;
}

@ApiTags('Teams')
@ApiBearerAuth('JWT-auth')
@Controller('teams')
export class TeamsController {
  @Get()
  @ApiOperation({
    summary: 'List teams',
    description: 'Retrieve paginated teams with optional search.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Teams retrieved successfully',
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') _search?: string,
  ) {
    return {
      data: [
        {
          id: 'team_1',
          name: 'Engineering Team',
          description: 'Core platform team',
          members: 12,
        },
        {
          id: 'team_2',
          name: 'Product Team',
          description: 'Product strategy and design',
          members: 8,
        },
      ],
      meta: {
        page: page || 1,
        limit: limit || 10,
        total: 2,
      },
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get team detail',
    description: 'Retrieve details of a team by ID.',
  })
  @ApiParam({ name: 'id', description: 'Team ID', example: 'team_1' })
  @ApiResponse({ status: 200, description: 'Team found' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async findOne(@Param('id') id: string) {
    return {
      id,
      name: 'Engineering Team',
      description: 'Core platform team',
      members: [
        { id: 'user_1', name: 'Alice' },
        { id: 'user_2', name: 'Bob' },
      ],
      createdAt: new Date().toISOString(),
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Create team',
    description: 'Create a new team with optional members.',
  })
  @ApiResponse({ status: 201, description: 'Team created' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  async create(@Body() createTeamDto: CreateTeamDto) {
    return {
      id: 'team_new',
      name: createTeamDto.name,
      description: createTeamDto.description || null,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update team',
    description: 'Update team details.',
  })
  @ApiParam({ name: 'id', description: 'Team ID', example: 'team_1' })
  @ApiResponse({ status: 200, description: 'Team updated' })
  async update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return {
      id,
      ...updateTeamDto,
      updatedAt: new Date().toISOString(),
    };
  }

  @Post(':id/members')
  @ApiOperation({
    summary: 'Add team member',
    description: 'Add a user to a team with an optional role.',
  })
  @ApiParam({ name: 'id', description: 'Team ID', example: 'team_1' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user_123' },
        role: { type: 'string', enum: ['admin', 'member'], example: 'member' },
      },
      required: ['userId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Member added to team' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async addMember(
    @Param('id') id: string,
    @Body() body: { userId: string; role?: 'admin' | 'member' },
  ) {
    return {
      teamId: id,
      member: { id: body.userId, role: body.role || 'member' },
      message: 'Member added successfully',
    };
  }

  @Delete(':id/members/:userId')
  @ApiOperation({
    summary: 'Remove team member',
    description: 'Remove a user from a team.',
  })
  @ApiParam({ name: 'id', description: 'Team ID', example: 'team_1' })
  @ApiParam({ name: 'userId', description: 'User ID', example: 'user_123' })
  @ApiResponse({ status: 200, description: 'Member removed from team' })
  @ApiResponse({ status: 404, description: 'Team or member not found' })
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return {
      teamId: id,
      userId,
      message: 'Member removed successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete team',
    description: 'Remove a team by ID.',
  })
  @ApiParam({ name: 'id', description: 'Team ID', example: 'team_1' })
  @ApiResponse({ status: 200, description: 'Team deleted' })
  async remove(@Param('id') id: string) {
    return { id, deleted: true };
  }
}
