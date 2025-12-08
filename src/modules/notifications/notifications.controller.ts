import { Controller, Get, Put, Param, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  link?: string;
  sender?: { id: string; name: string; avatar: string };
}

// Generate mock notifications with time distribution
function generateMockNotifications(): NotificationItem[] {
  const notifications: NotificationItem[] = [];

  const templates = [
    {
      type: 'system',
      title: '系统维护通知',
      content: '系统将于今晚 22:00 进行例行维护，预计持续 2 小时。',
    },
    {
      type: 'system',
      title: '新功能上线',
      content: '仪表盘新增数据导出功能，欢迎体验。',
    },
    {
      type: 'system',
      title: '安全更新',
      content: '系统安全补丁已更新，请���心使用。',
    },
    {
      type: 'task',
      title: '新任务分配',
      content: '您有一个新任务：完成用户模块前端开发',
    },
    {
      type: 'task',
      title: '任务即将到期',
      content: '任务"API 文档更新"将于明天到期，请及时处理。',
    },
    {
      type: 'task',
      title: '任务完成确认',
      content: '您负责的任务"数据库优化"已被确认完成。',
    },
    {
      type: 'task',
      title: '任务状态变更',
      content: '任务"性能测试"状态已更新为进行中。',
    },
    { type: 'message', title: '新消息', content: '张三 在研发团队群中@了您' },
    { type: 'message', title: '私信提醒', content: '李四 给您发送了一条私信' },
    { type: 'message', title: '评论回复', content: '王五 回复了您的评论' },
    {
      type: 'message',
      title: '文档评论',
      content: '赵六 在"技术方案"文档中提到了您',
    },
    {
      type: 'alert',
      title: '安全提醒',
      content: '检测到新设备登录，如非本人操作请及时修改密码。',
    },
    {
      type: 'alert',
      title: '异常登录',
      content: '您的账号在异地登录，请确认是否本人操作。',
    },
    {
      type: 'alert',
      title: '密码过期',
      content: '您的密码已使用超过 90 天，建议修改。',
    },
    {
      type: 'alert',
      title: '存储空间不足',
      content: '您的存储空间使用率已达 85%，请及时清理。',
    },
    { type: 'user', title: '成员加入', content: '李四 已加入设计团队' },
    { type: 'user', title: '成员离开', content: '王五 已离开研发团队' },
    { type: 'user', title: '角色变更', content: '您的角色已更新为项目经理' },
    { type: 'user', title: '权限变更', content: '您已获得管理员权限' },
    { type: 'user', title: '团队邀请', content: '张三 邀请您加入"前端开发组"' },
  ];

  const users = [
    {
      id: 'user_2',
      name: '张三',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
    },
    {
      id: 'user_3',
      name: '李四',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
    },
    {
      id: 'user_4',
      name: '王五',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
    },
    {
      id: 'user_5',
      name: '赵六',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu',
    },
    {
      id: 'user_6',
      name: '钱七',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qianqi',
    },
  ];

  // Time distribution: more recent notifications
  const timeOffsets = [
    5 * 60 * 1000, // 5 minutes ago
    15 * 60 * 1000, // 15 minutes ago
    30 * 60 * 1000, // 30 minutes ago
    60 * 60 * 1000, // 1 hour ago
    2 * 60 * 60 * 1000, // 2 hours ago
    4 * 60 * 60 * 1000, // 4 hours ago
    8 * 60 * 60 * 1000, // 8 hours ago
    12 * 60 * 60 * 1000, // 12 hours ago
    24 * 60 * 60 * 1000, // 1 day ago
    2 * 24 * 60 * 60 * 1000, // 2 days ago
    3 * 24 * 60 * 60 * 1000, // 3 days ago
    5 * 24 * 60 * 60 * 1000, // 5 days ago
    7 * 24 * 60 * 60 * 1000, // 1 week ago
  ];

  for (let i = 0; i < 30; i++) {
    const template = templates[i % templates.length];
    const timeOffset =
      timeOffsets[Math.min(i, timeOffsets.length - 1)] +
      Math.random() * 60 * 60 * 1000;
    const isRead = i >= 8; // First 8 notifications are unread

    const notification: NotificationItem = {
      id: `notif_${i + 1}`,
      type: template.type,
      title: template.title,
      content: template.content,
      read: isRead,
      createdAt: new Date(Date.now() - timeOffset).toISOString(),
    };

    // Add link for some notifications
    if (template.type === 'task') {
      notification.link = `/tasks/${i + 1}`;
    } else if (template.type === 'message') {
      notification.link = '/messages';
      notification.sender = users[i % users.length];
    } else if (template.type === 'user') {
      notification.sender = users[i % users.length];
    }

    notifications.push(notification);
  }

  return notifications;
}

const mockNotifications = generateMockNotifications();

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  async findAll() {
    return mockNotifications;
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  async getUnreadCount() {
    const count = mockNotifications.filter((n) => !n.read).length;
    return { count };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string) {
    const notification = mockNotifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
    }
    return { success: true, id };
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead() {
    mockNotifications.forEach((n) => (n.read = true));
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async remove(@Param('id') id: string) {
    return { id, deleted: true };
  }
}
