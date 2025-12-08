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
  ApiProperty,
} from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsBoolean } from 'class-validator';

class CreateEventDto {
  @ApiProperty({ description: 'Event title', example: 'Sprint Planning' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Start time', example: '2024-08-01T10:00:00Z' })
  @IsDateString()
  start: string;

  @ApiProperty({ description: 'End time' })
  @IsDateString()
  end: string;

  @ApiProperty({ description: 'Event type', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Color', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ description: 'All day event', required: false })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiProperty({ description: 'Location', required: false })
  @IsOptional()
  @IsString()
  location?: string;
}

// Mock calendar events
interface Attendee {
  id: string;
  name: string;
  avatar: string;
  status: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  type: string;
  color: string;
  location?: string;
  allDay: boolean;
  attendees: Attendee[];
  reminders: string[];
  createdAt: string;
}

// Generate mock calendar events
function generateMockEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const now = new Date();

  const users: Attendee[] = [
    {
      id: 'user_1',
      name: '系统管理员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      status: 'accepted',
    },
    {
      id: 'user_2',
      name: '张三',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
      status: 'accepted',
    },
    {
      id: 'user_3',
      name: '李四',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
      status: 'pending',
    },
    {
      id: 'user_4',
      name: '王五',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
      status: 'accepted',
    },
    {
      id: 'user_5',
      name: '赵六',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu',
      status: 'declined',
    },
  ];

  const eventTemplates = [
    {
      title: '项目周会',
      description: '每周一上午的项目进度同步会议',
      type: 'meeting',
      color: '#6366f1',
      location: '会议室A',
      allDay: false,
    },
    {
      title: '代码评审',
      description: '评审用户认证模块代码',
      type: 'meeting',
      color: '#8b5cf6',
      location: '线上会议',
      allDay: false,
    },
    {
      title: '产品发布',
      description: 'HaloLight v1.0 正式发布',
      type: 'task',
      color: '#ec4899',
      allDay: true,
    },
    {
      title: '团队建设',
      description: '团队聚餐活动',
      type: 'event',
      color: '#f59e0b',
      location: '公司附近餐厅',
      allDay: false,
    },
    {
      title: 'Sprint 规划',
      description: '下一个 Sprint 任务规划会议',
      type: 'meeting',
      color: '#10b981',
      location: '会议室B',
      allDay: false,
    },
    {
      title: '技术分享',
      description: 'React 18 新特性分享',
      type: 'meeting',
      color: '#3b82f6',
      location: '线上会议',
      allDay: false,
    },
    {
      title: '需求评审',
      description: '新功能需求评审',
      type: 'meeting',
      color: '#6366f1',
      location: '会议室C',
      allDay: false,
    },
    {
      title: '上线部署',
      description: '生产环境部署',
      type: 'task',
      color: '#ef4444',
      allDay: false,
    },
    {
      title: '客户演示',
      description: '向客户展示产品功能',
      type: 'meeting',
      color: '#8b5cf6',
      location: '会议室A',
      allDay: false,
    },
    {
      title: '文档整理',
      description: '整理技术文档',
      type: 'task',
      color: '#64748b',
      allDay: false,
    },
    {
      title: '系统维护',
      description: '例行系统维护',
      type: 'task',
      color: '#f97316',
      allDay: false,
    },
    {
      title: '培训课程',
      description: '新员工入职培训',
      type: 'event',
      color: '#22c55e',
      location: '培训室',
      allDay: false,
    },
    {
      title: '年度总结',
      description: '年度工作总结会议',
      type: 'meeting',
      color: '#a855f7',
      location: '大会议室',
      allDay: false,
    },
    {
      title: '假期提醒',
      description: '国庆节假期',
      type: 'holiday',
      color: '#ef4444',
      allDay: true,
    },
    {
      title: '生日庆祝',
      description: '同事生日',
      type: 'event',
      color: '#f472b6',
      allDay: true,
    },
  ];

  // Generate events for the past week and next two weeks
  for (let dayOffset = -7; dayOffset <= 14; dayOffset++) {
    // Skip some days randomly, but NEVER skip today (dayOffset === 0)
    if (dayOffset !== 0 && Math.random() < 0.2) continue;

    // Generate 1-3 events per day, but ensure today has at least 3 events
    const eventsPerDay =
      dayOffset === 0
        ? 3 + Math.floor(Math.random() * 3) // 3-5 events for today
        : Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < eventsPerDay; i++) {
      const template =
        eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      const eventDate = new Date(now);
      eventDate.setDate(eventDate.getDate() + dayOffset);

      let start: Date;
      let end: Date;

      if (template.allDay) {
        start = new Date(eventDate.setHours(0, 0, 0, 0));
        end = new Date(eventDate.setHours(23, 59, 59, 999));
      } else {
        // Random start hour between 9 and 17
        const startHour = 9 + Math.floor(Math.random() * 8);
        start = new Date(eventDate);
        start.setHours(startHour, 0, 0, 0);

        // Duration 1-2 hours
        const duration = 1 + Math.floor(Math.random() * 2);
        end = new Date(start);
        end.setHours(start.getHours() + duration);
      }

      // Random attendees (1-4 people)
      const numAttendees = Math.floor(Math.random() * 4) + 1;
      const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
      const attendees = shuffledUsers.slice(0, numAttendees);

      events.push({
        id: `event_${events.length + 1}`,
        title: template.title,
        description: template.description,
        start: start.toISOString(),
        end: end.toISOString(),
        type: template.type,
        color: template.color,
        location: template.location,
        allDay: template.allDay,
        attendees,
        reminders: template.allDay ? [] : ['30m', '1h'],
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Sort by start time
  events.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  return events;
}

const mockEvents = generateMockEvents();

@ApiTags('Calendar')
@ApiBearerAuth('JWT-auth')
@Controller('calendar/events')
export class CalendarController {
  @Get()
  @ApiOperation({ summary: 'List events' })
  @ApiQuery({ name: 'start', required: false, type: String })
  @ApiQuery({ name: 'end', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Events retrieved' })
  async findAll(@Query('start') start?: string, @Query('end') end?: string) {
    let events = [...mockEvents];
    if (start) {
      events = events.filter((e) => new Date(e.start) >= new Date(start));
    }
    if (end) {
      events = events.filter((e) => new Date(e.end) <= new Date(end));
    }
    return events;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event detail' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event found' })
  async findOne(@Param('id') id: string) {
    const event = mockEvents.find((e) => e.id === id);
    return (
      event || {
        id,
        title: 'Unknown Event',
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      }
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create event' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async create(@Body() dto: CreateEventDto) {
    const newEvent = {
      id: `event_${Date.now()}`,
      ...dto,
      attendees: [],
      reminders: [],
      createdAt: new Date().toISOString(),
    };
    return newEvent;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateEventDto>) {
    const event = mockEvents.find((e) => e.id === id);
    if (event) {
      Object.assign(event, dto);
    }
    return { id, ...dto, updatedAt: new Date().toISOString() };
  }

  @Post(':id/attendees')
  @ApiOperation({ summary: 'Add attendees to event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Attendees added' })
  async addAttendees(
    @Param('id') id: string,
    @Body() body: { attendeeIds: string[] },
  ) {
    const event = mockEvents.find((e) => e.id === id);
    const newAttendees = body.attendeeIds.map((aid) => ({
      id: aid,
      name: `User ${aid}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${aid}`,
      status: 'pending',
    }));
    if (event) {
      event.attendees.push(...newAttendees);
    }
    return event || { id, attendees: newAttendees };
  }

  @Delete(':id/attendees/:attendeeId')
  @ApiOperation({ summary: 'Remove attendee from event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiParam({ name: 'attendeeId', description: 'Attendee ID' })
  @ApiResponse({ status: 200, description: 'Attendee removed' })
  async removeAttendee(
    @Param('id') id: string,
    @Param('attendeeId') attendeeId: string,
  ) {
    const event = mockEvents.find((e) => e.id === id);
    if (event) {
      event.attendees = event.attendees.filter((a) => a.id !== attendeeId);
    }
    return event || { id, attendees: [] };
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event rescheduled' })
  async reschedule(
    @Param('id') id: string,
    @Body() body: { start: string; end: string },
  ) {
    const event = mockEvents.find((e) => e.id === id);
    if (event) {
      event.start = body.start;
      event.end = body.end;
    }
    return event || { id, start: body.start, end: body.end };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  async remove(@Param('id') id: string) {
    return { id, deleted: true };
  }

  @Post('batch-delete')
  @ApiOperation({ summary: 'Batch delete events' })
  @ApiResponse({ status: 200, description: 'Events deleted' })
  async batchDelete(@Body() body: { ids: string[] }) {
    return { success: true, deleted: body.ids.length };
  }
}
