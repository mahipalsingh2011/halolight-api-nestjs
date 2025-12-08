// @ts-nocheck -- Vercel Node builder + Prisma conditional exports under NodeNext can trip type resolution; runtime is fine.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 验证 Vercel Cron 请求
function isValidCronRequest(req: VercelRequest): boolean {
  // 方式1: 验证 Vercel Cron 的 Authorization header
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return false;
  }

  // 方式2: 验证请求来源 (Vercel Cron 内部调用会带有这个 header)
  const userAgent = req.headers['user-agent'];
  if (!userAgent?.includes('vercel-cron')) {
    // 如果不是来自 Vercel Cron，需要额外验证
    const forwardedFor = req.headers['x-forwarded-for'];
    const vercelId = req.headers['x-vercel-id'];

    // 确保请求来自 Vercel 内部
    if (!vercelId) {
      console.warn('Request not from Vercel internal');
      // 在生产环境中，可以选择拒绝非 Vercel 内部请求
      // return false;
    }
  }

  return true;
}

async function resetDatabase(): Promise<void> {
  // 清除所有数据（按依赖顺序）
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

  // 创建权限 (与 prisma/seed.ts 保持一致)
  // Permission naming follows frontend convention: resource:action (view/create/edit/delete)
  const permissions = await Promise.all([
    // [0] Wildcard
    prisma.permission.create({ data: { action: '*', resource: '*', description: 'Full system access' } }),
    // [1] Dashboard
    prisma.permission.create({ data: { action: 'dashboard:view', resource: 'dashboard', description: 'View dashboard' } }),
    // [2-5] Users
    prisma.permission.create({ data: { action: 'users:view', resource: 'users', description: 'View users' } }),
    prisma.permission.create({ data: { action: 'users:create', resource: 'users', description: 'Create users' } }),
    prisma.permission.create({ data: { action: 'users:edit', resource: 'users', description: 'Edit users' } }),
    prisma.permission.create({ data: { action: 'users:delete', resource: 'users', description: 'Delete users' } }),
    // [6-7] Analytics
    prisma.permission.create({ data: { action: 'analytics:view', resource: 'analytics', description: 'View analytics' } }),
    prisma.permission.create({ data: { action: 'analytics:export', resource: 'analytics', description: 'Export analytics data' } }),
    // [8-9] Settings
    prisma.permission.create({ data: { action: 'settings:view', resource: 'settings', description: 'View settings' } }),
    prisma.permission.create({ data: { action: 'settings:edit', resource: 'settings', description: 'Edit settings' } }),
    // [10-13] Documents
    prisma.permission.create({ data: { action: 'documents:view', resource: 'documents', description: 'View documents' } }),
    prisma.permission.create({ data: { action: 'documents:create', resource: 'documents', description: 'Create documents' } }),
    prisma.permission.create({ data: { action: 'documents:edit', resource: 'documents', description: 'Edit documents' } }),
    prisma.permission.create({ data: { action: 'documents:delete', resource: 'documents', description: 'Delete documents' } }),
    // [14-16] Files
    prisma.permission.create({ data: { action: 'files:view', resource: 'files', description: 'View files' } }),
    prisma.permission.create({ data: { action: 'files:upload', resource: 'files', description: 'Upload files' } }),
    prisma.permission.create({ data: { action: 'files:delete', resource: 'files', description: 'Delete files' } }),
    // [17-18] Messages
    prisma.permission.create({ data: { action: 'messages:view', resource: 'messages', description: 'View messages' } }),
    prisma.permission.create({ data: { action: 'messages:send', resource: 'messages', description: 'Send messages' } }),
    // [19-20] Calendar
    prisma.permission.create({ data: { action: 'calendar:view', resource: 'calendar', description: 'View calendar' } }),
    prisma.permission.create({ data: { action: 'calendar:edit', resource: 'calendar', description: 'Edit calendar events' } }),
    // [21-22] Notifications
    prisma.permission.create({ data: { action: 'notifications:view', resource: 'notifications', description: 'View notifications' } }),
    prisma.permission.create({ data: { action: 'notifications:manage', resource: 'notifications', description: 'Manage notifications' } }),
  ]);

  // 创建角色
  const adminRole = await prisma.role.create({
    data: { name: 'admin', label: '系统管理员', description: '拥有系统全部权限' },
  });
  const userRole = await prisma.role.create({
    data: { name: 'user', label: '普通用户', description: '基本操作权限' },
  });

  // 分配权限
  // Permission indices: [0] * [1] dashboard:view [2] users:view ... [17] messages:view [18] messages:send ...
  await prisma.rolePermission.create({ data: { roleId: adminRole.id, permissionId: permissions[0].id } }); // *
  await prisma.rolePermission.createMany({
    data: [
      { roleId: userRole.id, permissionId: permissions[1].id },  // dashboard:view
      { roleId: userRole.id, permissionId: permissions[2].id },  // users:view
      { roleId: userRole.id, permissionId: permissions[6].id },  // analytics:view
      { roleId: userRole.id, permissionId: permissions[10].id }, // documents:view
      { roleId: userRole.id, permissionId: permissions[11].id }, // documents:create
      { roleId: userRole.id, permissionId: permissions[12].id }, // documents:edit
      { roleId: userRole.id, permissionId: permissions[14].id }, // files:view
      { roleId: userRole.id, permissionId: permissions[15].id }, // files:upload
      { roleId: userRole.id, permissionId: permissions[17].id }, // messages:view
      { roleId: userRole.id, permissionId: permissions[18].id }, // messages:send
      { roleId: userRole.id, permissionId: permissions[19].id }, // calendar:view
      { roleId: userRole.id, permissionId: permissions[20].id }, // calendar:edit
      { roleId: userRole.id, permissionId: permissions[21].id }, // notifications:view
    ],
  });

  // 创建用户
  const adminPassword = await bcrypt.hash('123456', 12);
  const regularPassword = await bcrypt.hash('123456', 12);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@halolight.h7ml.cn',
      username: 'admin',
      password: adminPassword,
      name: '系统管理员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      status: 'ACTIVE',
      department: '技术部',
      position: 'CTO',
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@halolight.h7ml.cn',
      username: 'demo',
      password: regularPassword,
      name: '演示用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      status: 'ACTIVE',
      department: '研发部',
      position: '前端工程师',
    },
  });

  // 分配角色
  await prisma.userRole.createMany({
    data: [
      { userId: adminUser.id, roleId: adminRole.id },
      { userId: demoUser.id, roleId: userRole.id },
    ],
  });

  // 创建团队
  const devTeam = await prisma.team.create({
    data: {
      name: '研发团队',
      description: '负责产品研发和技术创新',
      ownerId: adminUser.id,
    },
  });

  await prisma.teamMember.createMany({
    data: [
      { teamId: devTeam.id, userId: adminUser.id, roleId: adminRole.id },
      { teamId: devTeam.id, userId: demoUser.id, roleId: userRole.id },
    ],
  });

  // 创建文档
  await prisma.document.create({
    data: {
      title: 'HaloLight API 使用指南',
      content: '# HaloLight API 使用指南\n\n欢迎使用 HaloLight API...',
      type: 'markdown',
      size: BigInt(2048),
      views: 128,
      ownerId: adminUser.id,
      teamId: devTeam.id,
    },
  });

  // 创建通知
  await prisma.notification.createMany({
    data: [
      {
        userId: demoUser.id,
        type: 'system',
        title: '欢迎使用 HaloLight',
        content: '感谢您使用 HaloLight 管理后台，这是演示环境，每天自动重置数据。',
        read: false,
      },
      {
        userId: adminUser.id,
        type: 'system',
        title: '系统初始化完成',
        content: '数据库已重置为初始状态。',
        read: false,
      },
    ],
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 POST 或 GET 请求（Vercel Cron 使用 GET）
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 验证请求合法性
  if (!isValidCronRequest(req)) {
    console.error('Unauthorized cron request attempt');
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing CRON_SECRET',
    });
  }

  try {
    console.log('🔄 Starting database reset...');
    const startTime = Date.now();

    await resetDatabase();

    const duration = Date.now() - startTime;
    console.log(`✅ Database reset completed in ${duration}ms`);

    return res.status(200).json({
      success: true,
      message: 'Database reset completed successfully',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      accounts: [
        { email: 'admin@halolight.h7ml.cn', password: '123456', role: 'admin' },
        { email: 'demo@halolight.h7ml.cn', password: '123456', role: 'user' },
      ],
    });
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Database reset failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await prisma.$disconnect();
  }
}
