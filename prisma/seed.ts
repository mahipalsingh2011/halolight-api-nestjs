import { PrismaClient, UserStatus, SharePermission, AttendeeStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import Mock from 'mockjs';

const prisma = new PrismaClient();
const Random = Mock.Random;

// 配置中文
Random.extend({
  chineseName: function () {
    const surnames = ['张', '李', '王', '赵', '钱', '孙', '周', '吴', '郑', '冯', '陈', '韩', '杨', '沈', '魏', '蒋'];
    const names = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '洋', '艳', '勇', '军', '杰', '涛', '明', '超', '秀英', '华', '慧', '建国'];
    return surnames[Math.floor(Math.random() * surnames.length)] +
           names[Math.floor(Math.random() * names.length)] +
           (Math.random() > 0.5 ? names[Math.floor(Math.random() * names.length)] : '');
  },
  department: function () {
    return Random.pick(['技术部', '产品部', '设计部', '市场部', '运营部', '财务部', '人事部', '客服部', '研发部', '测试部']);
  },
  position: function () {
    return Random.pick(['工程师', '高级工程师', '资深工程师', '技术专家', '产品经理', '设计师', 'UI设计师', '交互设计师', '市场专员', '运营专员', 'HR专员', '财务主管', '测试工程师', 'DevOps工程师']);
  },
  docFolder: function () {
    return Random.pick(['项目文档', '设计资源', '技术文档', '报表', '会议记录']);
  },
  docType: function () {
    return Random.pick(['pdf', 'doc', 'image', 'spreadsheet', 'code', 'other']);
  },
  fileType: function () {
    return Random.pick(['image', 'video', 'audio', 'archive', 'document']);
  },
  eventType: function () {
    return Random.pick(['meeting', 'task', 'reminder', 'holiday']);
  },
  eventColor: function () {
    return Random.pick(['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#3b82f6']);
  },
  notificationType: function () {
    return Random.pick(['system', 'message', 'task', 'alert', 'user']);
  },
  activityAction: function () {
    return Random.pick([
      'user.create', 'user.update', 'user.delete', 'role.assign',
      'document.create', 'document.update', 'document.delete', 'document.share',
      'file.upload', 'file.download', 'file.delete',
      'team.create', 'team.addMember', 'team.removeMember',
      'event.create', 'event.update', 'event.delete',
      'auth.login', 'auth.logout',
      'message.send'
    ]);
  },
});

// ==================== 配置参数 ====================
const CONFIG = {
  users: { count: 30, password: '123456' },        // 增加用户数：20 → 30
  documents: { count: 30 },                        // 增加文档数：20 → 30
  files: { count: 40 },                            // 增加文件数：25 → 40
  calendarEvents: { past: 8, today: 8, future: 15 }, // 增加日程：past 5→8, today 3→8, future 10→15
  conversations: { group: 6, private: 8 },         // 增加会话：group 5→6, private 5→8
  messagesPerConversation: { min: 8, max: 20 },    // 增加消息：min 5→8, max 15→20
  notifications: { count: 60 },                    // 增加通知：30 → 60
  activityLogs: { count: 50 },                     // 增加活动日志：25 → 50
  tasks: { count: 20 },                            // 新增：待办任务数据
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// ==================== 生成器函数 ====================

function generateUsers(count: number) {
  const statuses = [UserStatus.ACTIVE, UserStatus.ACTIVE, UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED];
  return Array.from({ length: count }, (_, i) => ({
    email: `user${i + 1}@halolight.h7ml.cn`,
    username: `user${i + 1}`,
    name: (Random as any).chineseName(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + 1}`,
    status: Random.pick(statuses),
    department: (Random as any).department(),
    position: (Random as any).position(),
    bio: Random.cparagraph(1, 2),
  }));
}

function generateDocuments(count: number, userIds: string[], teamIds: string[]) {
  const titles = [
    'API 使用指南', '产品规划文档', 'UI设计规范', '周会纪要', '数据库设计',
    '前端架构说明', '用户调研报告', '产品原型设计', '季度销售报表', '技术分享记录',
    'API接口文档', '品牌视觉规范', '部署运维手册', '市场推广方案', '用户数据分析',
    '竞品分析报告', '组件库文档', '测试用例文档', '安全规范指南', '代码审查指南'
  ];

  return Array.from({ length: count }, (_, i) => ({
    title: titles[i % titles.length] + (i >= titles.length ? ` v${Math.floor(i / titles.length) + 1}` : ''),
    content: `# ${titles[i % titles.length]}\n\n${Random.cparagraph(3, 6)}\n\n## 概述\n\n${Random.cparagraph(2, 4)}\n\n## 详细内容\n\n${Random.cparagraph(4, 8)}`,
    type: (Random as any).docType(),
    folder: (Random as any).docFolder(),
    size: BigInt(Random.integer(1024, 10485760)),
    views: Random.integer(10, 500),
    ownerId: Random.pick(userIds),
    teamId: Math.random() > 0.3 ? Random.pick(teamIds) : null,
  }));
}

function generateFiles(count: number, userIds: string[], teamIds: string[], folderIds: string[]) {
  const fileConfigs: Record<string, { extensions: string[]; mimeTypes: string[] }> = {
    image: { extensions: ['.jpg', '.png', '.gif', '.webp'], mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] },
    video: { extensions: ['.mp4', '.mov', '.avi'], mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'] },
    audio: { extensions: ['.mp3', '.wav', '.flac'], mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/flac'] },
    archive: { extensions: ['.zip', '.rar', '.7z'], mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'] },
    document: { extensions: ['.pdf', '.docx', '.xlsx'], mimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] },
  };

  return Array.from({ length: count }, (_, i) => {
    const fileType = (Random as any).fileType() as string;
    const config = fileConfigs[fileType];
    const extIndex = Random.integer(0, config.extensions.length - 1);
    const name = Random.word(3, 10) + config.extensions[extIndex];

    return {
      name,
      path: `/${Random.pick(['documents', 'design', 'projects', 'reports'])}/${name}`,
      mimeType: config.mimeTypes[extIndex],
      size: BigInt(Random.integer(1024, 104857600)),
      folderId: Random.pick(folderIds),
      ownerId: Random.pick(userIds),
      teamId: Math.random() > 0.4 ? Random.pick(teamIds) : null,
      isFavorite: Math.random() > 0.8,
    };
  });
}

function generateCalendarEvents(pastCount: number, todayCount: number, futureCount: number, userIds: string[]) {
  const now = new Date();
  const events: any[] = [];

  const titles = [
    '项目周会', '代码评审', '产品发布', '技术分享会', '客户演示',
    '需求讨论会', '设计评审', '测试用例评审', '一对一沟通', '季度总结会',
    '团队建设活动', '培训会议', '部门例会', '冲刺计划会', '复盘会议'
  ];
  const locations = ['会议室A', '会议室B', '线上会议', '培训室', '大会议室', '客户公司', null];

  // 过去的事件
  for (let i = 0; i < pastCount; i++) {
    const daysAgo = Random.integer(1, 14);
    const startHour = Random.integer(9, 17);
    const start = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(start.getTime() + Random.integer(1, 3) * 60 * 60 * 1000);

    events.push({
      title: Random.pick(titles),
      description: Random.cparagraph(1, 3),
      startAt: start,
      endAt: end,
      type: (Random as any).eventType(),
      color: (Random as any).eventColor(),
      allDay: Math.random() > 0.9,
      location: Random.pick(locations),
      ownerId: Random.pick(userIds),
    });
  }

  // 今天的事件
  for (let i = 0; i < todayCount; i++) {
    const startHour = Random.integer(9, 17);
    const start = new Date(now);
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(start.getTime() + Random.integer(1, 2) * 60 * 60 * 1000);

    events.push({
      title: Random.pick(titles),
      description: Random.cparagraph(1, 3),
      startAt: start,
      endAt: end,
      type: (Random as any).eventType(),
      color: (Random as any).eventColor(),
      allDay: false,
      location: Random.pick(locations),
      ownerId: Random.pick(userIds),
    });
  }

  // 未来的事件
  for (let i = 0; i < futureCount; i++) {
    const daysLater = Random.integer(1, 21);
    const startHour = Random.integer(9, 17);
    const start = new Date(now.getTime() + daysLater * 24 * 60 * 60 * 1000);
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(start.getTime() + Random.integer(1, 4) * 60 * 60 * 1000);

    events.push({
      title: Random.pick(titles),
      description: Random.cparagraph(1, 3),
      startAt: start,
      endAt: end,
      type: (Random as any).eventType(),
      color: (Random as any).eventColor(),
      allDay: Math.random() > 0.85,
      location: Random.pick(locations),
      ownerId: Random.pick(userIds),
    });
  }

  return events;
}

function generateMessages(count: number, conversationId: string, participantIds: string[]) {
  const contents = [
    '大家好！', '收到，马上处理', '好的，没问题', '这个方案可行', '需要再讨论一下',
    '今天的任务完成了', '进度正常', '有什么问题吗？', '辛苦了！', '明天继续',
    '设计稿已更新', '代码已提交', '测试通过了', '部署完成', '请审核一下',
    Random.cparagraph(1, 2), Random.cparagraph(1, 2), Random.cparagraph(1, 2),
  ];

  return Array.from({ length: count }, () => ({
    conversationId,
    senderId: Random.pick(participantIds),
    type: Random.pick(['text', 'text', 'text', 'text', 'image', 'file']),
    content: Random.pick(contents),
  }));
}

function generateNotifications(count: number, userIds: string[]) {
  const templates: Record<string, { titles: string[]; contents: string[] }> = {
    system: {
      titles: ['系统通知', '功能更新', '维护通知', '安全提示', '数据备份完成', '版本升级', '系统优化'],
      contents: ['系统将进行维护更新', '新功能已上线，请体验', '请定期修改密码', '数据备份已完成', '系统运行正常', '已升级到新版本', '系统性能已优化'],
    },
    message: {
      titles: ['新消息', '群消息', '被@提醒', '新私信', '消息回复', '提及您'],
      contents: ['您有新的未读消息', '群里有新消息', '有人在群里@了您', '您收到一条私信', '有人回复了您的消息', '您在对话中被提及'],
    },
    task: {
      titles: ['新任务分配', '任务即将截止', '任务已完成', '任务审批请求', '任务更新', '任务提醒'],
      contents: ['您有新任务需要处理', '您的任务即将到期', '任务已完成，请确认', '有任务等待您的审批', '任务状态已更新', '别忘了今天的任务'],
    },
    alert: {
      titles: ['安全提醒', '登录异常', '存储空间不足', '密码即将过期', '权限变更', '异常访问'],
      contents: ['检测到异常登录', '请确认是否为本人操作', '存储空间不足，请清理', '密码将在7天后过期', '您的权限已发生变更', '检测到异常访问行为'],
    },
    user: {
      titles: ['成员加入', '新用户注册', '权限变更', '关注提醒', '账号激活', '信息更新'],
      contents: ['新成员已加入团队', '有新用户完成注册', '您的权限已变更', '有人开始关注您', '账号已成功激活', '个人信息已更新'],
    },
  };

  const now = new Date();
  const notifications: any[] = [];

  // 时间分布策略（与前端 Mock 保持一致）
  const timeRanges = [
    { count: Math.floor(count * 0.08), maxHoursAgo: 1 },      // 最近1小时：8%
    { count: Math.floor(count * 0.13), maxHoursAgo: 24 },     // 最近24小时：13%
    { count: Math.floor(count * 0.20), maxHoursAgo: 72 },     // 最近3天：20%
    { count: Math.floor(count * 0.33), maxHoursAgo: 168 },    // 最近7天：33%
    { count: Math.floor(count * 0.26), maxHoursAgo: 720 },    // 最近30天：26%
  ];

  timeRanges.forEach(({ count: rangeCount, maxHoursAgo }) => {
    for (let i = 0; i < rangeCount; i++) {
      const type = (Random as any).notificationType() as string;
      const template = templates[type] || templates.system;
      const hoursAgo = Random.integer(0, maxHoursAgo);
      const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      notifications.push({
        userId: Random.pick(userIds),
        type,
        title: Random.pick(template.titles),
        content: Random.pick(template.contents),
        link: Math.random() > 0.5 ? `/${type}s` : null,
        read: hoursAgo > 24 ? Math.random() > 0.3 : Math.random() > 0.7, // 24小时前的多数已读
        createdAt,
      });
    }
  });

  return notifications;
}

function generateActivityLogs(count: number, userIds: string[], targetIds: Record<string, string[]>) {
  return Array.from({ length: count }, () => {
    const action = (Random as any).activityAction() as string;
    const [targetType] = action.split('.');
    const targetIdList = targetIds[targetType] || userIds;

    return {
      actorId: Random.pick(userIds),
      action,
      targetType,
      targetId: Random.pick(targetIdList),
      metadata: { timestamp: new Date().toISOString() },
    };
  });
}

// ==================== 主函数 ====================

async function main() {
  console.log('🌱 Starting database seed with Mock.js...\n');

  // 清理数据
  console.log('🗑️  Clearing existing data...');
  await prisma.refreshToken.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.eventReminder.deleteMany();
  await prisma.eventAttendee.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.file.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.documentTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.documentShare.deleteMany();
  await prisma.document.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  // ==================== PERMISSIONS ====================
  console.log('🔒 Creating permissions...');
  const permissionData = [
    { action: '*', resource: '*', description: 'Full system access' },
    { action: 'dashboard:view', resource: 'dashboard', description: 'View dashboard' },
    { action: 'users:view', resource: 'users', description: 'View users' },
    { action: 'users:create', resource: 'users', description: 'Create users' },
    { action: 'users:edit', resource: 'users', description: 'Edit users' },
    { action: 'users:delete', resource: 'users', description: 'Delete users' },
    { action: 'analytics:view', resource: 'analytics', description: 'View analytics' },
    { action: 'analytics:export', resource: 'analytics', description: 'Export analytics' },
    { action: 'settings:view', resource: 'settings', description: 'View settings' },
    { action: 'settings:edit', resource: 'settings', description: 'Edit settings' },
    { action: 'documents:view', resource: 'documents', description: 'View documents' },
    { action: 'documents:create', resource: 'documents', description: 'Create documents' },
    { action: 'documents:edit', resource: 'documents', description: 'Edit documents' },
    { action: 'documents:delete', resource: 'documents', description: 'Delete documents' },
    { action: 'files:view', resource: 'files', description: 'View files' },
    { action: 'files:upload', resource: 'files', description: 'Upload files' },
    { action: 'files:delete', resource: 'files', description: 'Delete files' },
    { action: 'messages:view', resource: 'messages', description: 'View messages' },
    { action: 'messages:send', resource: 'messages', description: 'Send messages' },
    { action: 'calendar:view', resource: 'calendar', description: 'View calendar' },
    { action: 'calendar:edit', resource: 'calendar', description: 'Edit calendar' },
    { action: 'notifications:view', resource: 'notifications', description: 'View notifications' },
    { action: 'notifications:manage', resource: 'notifications', description: 'Manage notifications' },
  ];

  const permissions = await Promise.all(
    permissionData.map(data => prisma.permission.create({ data }))
  );

  // ==================== ROLES ====================
  console.log('🎭 Creating roles...');
  const adminRole = await prisma.role.create({
    data: { name: 'admin', label: '超级管理员', description: '拥有系统所有权限' },
  });
  const managerRole = await prisma.role.create({
    data: { name: 'manager', label: '管理员', description: '可管理用户和内容' },
  });
  const editorRole = await prisma.role.create({
    data: { name: 'editor', label: '编辑员', description: '可编辑文档和内容' },
  });
  const viewerRole = await prisma.role.create({
    data: { name: 'viewer', label: '访客', description: '仅可查看内容' },
  });

  // 分配权限
  await prisma.rolePermission.create({ data: { roleId: adminRole.id, permissionId: permissions[0].id } });

  const managerPermissionIndices = [1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  await prisma.rolePermission.createMany({
    data: managerPermissionIndices.map(i => ({ roleId: managerRole.id, permissionId: permissions[i].id })),
  });

  const editorPermissionIndices = [1, 2, 6, 10, 11, 12, 14, 15, 17, 18, 19, 20, 21];
  await prisma.rolePermission.createMany({
    data: editorPermissionIndices.map(i => ({ roleId: editorRole.id, permissionId: permissions[i].id })),
  });

  const viewerPermissionIndices = [1, 2, 6, 10, 14, 17, 19, 21];
  await prisma.rolePermission.createMany({
    data: viewerPermissionIndices.map(i => ({ roleId: viewerRole.id, permissionId: permissions[i].id })),
  });

  // ==================== USERS ====================
  console.log('👥 Creating users...');
  const hashedPassword = await hashPassword(CONFIG.users.password);

  // 固定的核心用户
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@halolight.h7ml.cn',
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      status: UserStatus.ACTIVE,
      department: '技术部',
      position: 'CTO',
      bio: 'HaloLight 系统管理员',
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@halolight.h7ml.cn',
      username: 'manager',
      password: hashedPassword,
      name: '张经理',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
      status: UserStatus.ACTIVE,
      department: '产品部',
      position: '产品经理',
      bio: '负责产品规划和团队管理',
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@halolight.h7ml.cn',
      username: 'demo',
      password: hashedPassword,
      name: '演示用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      status: UserStatus.ACTIVE,
      department: '研发部',
      position: '前端工程师',
      bio: '这是一个演示账号',
    },
  });

  // Mock 生成的用户
  const mockUserData = generateUsers(CONFIG.users.count - 3);
  const mockUsers = await Promise.all(
    mockUserData.map((data, i) => prisma.user.create({
      data: { ...data, password: hashedPassword },
    }))
  );

  const allUsers = [adminUser, managerUser, demoUser, ...mockUsers];
  const allUserIds = allUsers.map(u => u.id);

  // 分配角色
  const roles = [adminRole, managerRole, editorRole, viewerRole];
  await prisma.userRole.createMany({
    data: [
      { userId: adminUser.id, roleId: adminRole.id },
      { userId: managerUser.id, roleId: managerRole.id },
      { userId: demoUser.id, roleId: editorRole.id },
      ...mockUsers.map((u, i) => ({
        userId: u.id,
        roleId: Random.pick([editorRole.id, editorRole.id, viewerRole.id, managerRole.id]),
      })),
    ],
  });

  // ==================== TEAMS ====================
  console.log('👨‍👩‍👧‍👦 Creating teams...');
  const teams = await Promise.all([
    prisma.team.create({ data: { name: '研发团队', description: '负责产品研发和技术创新', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dev', ownerId: adminUser.id } }),
    prisma.team.create({ data: { name: '设计团队', description: '负责产品UI/UX设计', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=design', ownerId: managerUser.id } }),
    prisma.team.create({ data: { name: '市场团队', description: '负责市场推广和运营', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=market', ownerId: managerUser.id } }),
    prisma.team.create({ data: { name: '运营团队', description: '负责产品运营和用户增长', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ops', ownerId: adminUser.id } }),
  ]);
  const teamIds = teams.map(t => t.id);

  // 添加团队成员
  const teamMemberData = allUsers.slice(0, 15).flatMap((user, i) => {
    const teamIndex = i % teams.length;
    return { teamId: teams[teamIndex].id, userId: user.id, roleId: Random.pick([editorRole.id, viewerRole.id]) };
  });
  await prisma.teamMember.createMany({ data: teamMemberData });

  // ==================== TAGS ====================
  console.log('🏷️  Creating tags...');
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: '重要' } }),
    prisma.tag.create({ data: { name: '技术文档' } }),
    prisma.tag.create({ data: { name: '设计规范' } }),
    prisma.tag.create({ data: { name: '会议纪要' } }),
    prisma.tag.create({ data: { name: '项目计划' } }),
    prisma.tag.create({ data: { name: '用户手册' } }),
    prisma.tag.create({ data: { name: '参考资料' } }),
    prisma.tag.create({ data: { name: '待审核' } }),
  ]);
  const tagIds = tags.map(t => t.id);

  // ==================== FOLDERS ====================
  console.log('📁 Creating folders...');
  const rootFolder = await prisma.folder.create({ data: { name: '根目录', path: '/', ownerId: adminUser.id } });
  const folders = await Promise.all([
    prisma.folder.create({ data: { name: '项目文档', path: '/projects', parentId: rootFolder.id, ownerId: adminUser.id, teamId: teams[0].id } }),
    prisma.folder.create({ data: { name: '设计资源', path: '/design', parentId: rootFolder.id, ownerId: managerUser.id, teamId: teams[1].id } }),
    prisma.folder.create({ data: { name: '技术文档', path: '/tech-docs', parentId: rootFolder.id, ownerId: adminUser.id, teamId: teams[0].id } }),
    prisma.folder.create({ data: { name: '报表', path: '/reports', parentId: rootFolder.id, ownerId: managerUser.id } }),
    prisma.folder.create({ data: { name: '会议记录', path: '/meetings', parentId: rootFolder.id, ownerId: managerUser.id } }),
    prisma.folder.create({ data: { name: '文档中心', path: '/documents', parentId: rootFolder.id, ownerId: adminUser.id } }),
  ]);
  const folderIds = folders.map(f => f.id);

  // ==================== DOCUMENTS ====================
  console.log('📄 Creating documents...');
  const documentData = generateDocuments(CONFIG.documents.count, allUserIds, teamIds);
  const documents = await Promise.all(
    documentData.map(data => prisma.document.create({ data }))
  );
  const documentIds = documents.map(d => d.id);

  // 添加文档标签
  const docTagData = documents.flatMap(doc => {
    const numTags = Random.integer(1, 3);
    const selectedTags = Random.shuffle(tagIds).slice(0, numTags);
    return selectedTags.map(tagId => ({ documentId: doc.id, tagId }));
  });
  await prisma.documentTag.createMany({ data: docTagData, skipDuplicates: true });

  // 文档分享
  const docShareData = documents.slice(0, 10).map(doc => ({
    documentId: doc.id,
    teamId: Random.pick(teamIds),
    permission: Random.pick([SharePermission.READ, SharePermission.EDIT]) as SharePermission,
  }));
  await prisma.documentShare.createMany({ data: docShareData });

  // ==================== FILES ====================
  console.log('📎 Creating files...');
  const fileData = generateFiles(CONFIG.files.count, allUserIds, teamIds, folderIds);
  await prisma.file.createMany({ data: fileData });

  // ==================== CALENDAR EVENTS ====================
  console.log('📅 Creating calendar events...');
  const eventData = generateCalendarEvents(
    CONFIG.calendarEvents.past,
    CONFIG.calendarEvents.today,
    CONFIG.calendarEvents.future,
    allUserIds
  );
  const events = await Promise.all(
    eventData.map(data => prisma.calendarEvent.create({ data }))
  );
  const eventIds = events.map(e => e.id);

  // 添加事件参与者
  const attendeeData = events.flatMap(event => {
    const numAttendees = Random.integer(1, 5);
    const selectedUsers = Random.shuffle([...allUserIds]).slice(0, numAttendees);
    return selectedUsers.map(userId => ({
      eventId: event.id,
      userId,
      status: Random.pick([AttendeeStatus.ACCEPTED, AttendeeStatus.PENDING, AttendeeStatus.DECLINED]) as AttendeeStatus,
    }));
  });
  await prisma.eventAttendee.createMany({ data: attendeeData, skipDuplicates: true });

  // ==================== CONVERSATIONS & MESSAGES ====================
  console.log('💬 Creating conversations and messages...');

  // 群聊
  const groupConvNames = ['研发团队群', '设计团队群', '项目讨论组', '全员通知群', '运营团队群'];
  const groupConversations = await Promise.all(
    groupConvNames.slice(0, CONFIG.conversations.group).map(name =>
      prisma.conversation.create({
        data: { name, isGroup: true, avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${name}` },
      })
    )
  );

  // 私聊
  const privateConversations = await Promise.all(
    Array.from({ length: CONFIG.conversations.private }, () =>
      prisma.conversation.create({ data: { isGroup: false } })
    )
  );

  const allConversations = [...groupConversations, ...privateConversations];
  const conversationIds = allConversations.map(c => c.id);

  // 添加会话参与者和消息
  for (const conv of allConversations) {
    const numParticipants = conv.isGroup ? Random.integer(3, 8) : 2;
    const participants = Random.shuffle([...allUserIds]).slice(0, numParticipants);

    await prisma.conversationParticipant.createMany({
      data: participants.map((userId, i) => ({
        conversationId: conv.id,
        userId,
        role: i === 0 ? 'owner' : 'member',
        unreadCount: Random.integer(0, 10),
      })),
    });

    const messageCount = Random.integer(CONFIG.messagesPerConversation.min, CONFIG.messagesPerConversation.max);
    const messages = generateMessages(messageCount, conv.id, participants);
    await prisma.message.createMany({ data: messages });
  }

  // ==================== NOTIFICATIONS ====================
  console.log('🔔 Creating notifications...');
  const notificationData = generateNotifications(CONFIG.notifications.count, allUserIds);
  await prisma.notification.createMany({ data: notificationData });

  // ==================== ACTIVITY LOGS ====================
  console.log('📝 Creating activity logs...');
  const targetIds = {
    user: allUserIds,
    document: documentIds,
    team: teamIds,
    event: eventIds,
    file: folderIds,
    conversation: conversationIds,
    auth: allUserIds,
    message: conversationIds,
    role: [adminRole.id, managerRole.id, editorRole.id, viewerRole.id],
  };
  const activityData = generateActivityLogs(CONFIG.activityLogs.count, allUserIds, targetIds);
  await prisma.activityLog.createMany({ data: activityData });

  // ==================== 统计信息 ====================
  console.log('\n✅ Database seeded successfully with Mock.js!\n');
  console.log('📊 Summary:');
  console.log(`   - ${permissions.length} permissions`);
  console.log(`   - 4 roles (admin, manager, editor, viewer)`);
  console.log(`   - ${allUsers.length} users`);
  console.log(`   - ${teams.length} teams`);
  console.log(`   - ${documents.length} documents`);
  console.log(`   - ${folders.length + 1} folders`);
  console.log(`   - ${CONFIG.files.count} files`);
  console.log(`   - ${events.length} calendar events`);
  console.log(`   - ${allConversations.length} conversations`);
  console.log(`   - ${CONFIG.notifications.count} notifications`);
  console.log(`   - ${CONFIG.activityLogs.count} activity logs`);
  console.log('\n🔑 Demo Accounts:');
  console.log('   - admin@halolight.h7ml.cn / 123456 (Admin)');
  console.log('   - manager@halolight.h7ml.cn / 123456 (Manager)');
  console.log('   - demo@halolight.h7ml.cn / 123456 (Editor)');
  console.log(`   ... and ${mockUsers.length} more generated users`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
