import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getStats() {
    return {
      totalUsers: Math.floor(Math.random() * 5000) + 1000,
      activeUsers: Math.floor(Math.random() * 3000) + 500,
      totalRevenue: Math.floor(Math.random() * 200000) + 50000,
      totalOrders: Math.floor(Math.random() * 1000) + 100,
      conversionRate: Number((Math.random() * 10 + 1).toFixed(2)),
      recentOrders: Math.floor(Math.random() * 100) + 10,
      pendingTasks: Math.floor(Math.random() * 50) + 5,
      userGrowth: Number((Math.random() * 40 - 20).toFixed(2)),
      revenueGrowth: Number((Math.random() * 40 - 10).toFixed(2)),
      orderGrowth: Number((Math.random() * 40 - 15).toFixed(2)),
      rateGrowth: Number((Math.random() * 20 - 5).toFixed(2)),
    };
  }

  @Get('visits')
  @ApiOperation({ summary: 'Get visit trends (7 days)' })
  @ApiResponse({ status: 200, description: 'Visit data retrieved' })
  async getVisits() {
    const data: {
      date: string;
      visits: number;
      uniqueVisitors: number;
      pageViews: number;
    }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        visits: Math.floor(Math.random() * 1000) + 100,
        uniqueVisitors: Math.floor(Math.random() * 800) + 50,
        pageViews: Math.floor(Math.random() * 2000) + 200,
      });
    }
    return data;
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get sales trends (6 months)' })
  @ApiResponse({ status: 200, description: 'Sales data retrieved' })
  async getSales() {
    const data: { month: string; sales: number; profit: number }[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      data.push({
        month: date.toISOString().slice(0, 7),
        sales: Math.floor(Math.random() * 50000) + 10000,
        profit: Math.floor(Math.random() * 20000) + 5000,
      });
    }
    return data;
  }

  @Get('products')
  @ApiOperation({ summary: 'Get top products' })
  @ApiResponse({ status: 200, description: 'Products retrieved' })
  async getProducts() {
    const productNames = [
      '智能手机',
      '笔记本电脑',
      '平板电脑',
      '智能手表',
      '无线耳机',
      '智能音箱',
      '游戏手柄',
      '键盘鼠标套装',
    ];
    return productNames.map((name, index) => ({
      id: `prod_${index + 1}`,
      name,
      category: ['电子产品', '数码配件', '智能设备'][index % 3],
      price: Math.floor(Math.random() * 5000) + 100,
      sales: Math.floor(Math.random() * 1000) + 100,
      stock: Math.floor(Math.random() * 500) + 10,
      image: `https://picsum.photos/seed/${name}/200/200`,
    }));
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get recent orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  async getOrders() {
    const customers = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];
    const statuses = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];
    return Array.from({ length: 10 }, (_, i) => ({
      id: `order_${i + 1}`,
      orderNo: `ORD${Date.now()}${i}`,
      customer: customers[Math.floor(Math.random() * customers.length)],
      amount: Math.floor(Math.random() * 5000) + 100,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    }));
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get recent activities' })
  @ApiResponse({ status: 200, description: 'Activities retrieved' })
  async getActivities() {
    const users = [
      '张三',
      '李四',
      '王五',
      '赵六',
      '钱七',
      '孙八',
      '周九',
      '吴十',
      '系统管理员',
      '产品经理',
    ];
    const actions = [
      '创建了文档',
      '更新了资料',
      '上传了文件',
      '发送了消息',
      '创建了订单',
      '修改了密码',
      '分享了文档',
      '删除了文件',
      '添加了成员',
      '创建了任务',
      '完成了审批',
      '发布了公告',
      '更新了权限',
      '导出了报表',
      '归档了项目',
    ];
    const targets = [
      '项目计划书',
      '用户资料',
      '设计稿.psd',
      '研发团队群',
      '订单#1234',
      '账户安全',
      'API文档',
      '产品原型图',
      '测试报告',
      '周报.docx',
      '财务报表',
      '会议记录',
      '需求文档',
      '代码仓库',
      '服务器配置',
    ];
    // 增加到 20 个活动记录
    return Array.from({ length: 20 }, (_, i) => ({
      id: `act_${i + 1}`,
      user: users[Math.floor(Math.random() * users.length)],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
      action: actions[Math.floor(Math.random() * actions.length)],
      target: targets[Math.floor(Math.random() * targets.length)],
      time: new Date(
        Date.now() - Math.random() * 24 * 60 * 60 * 1000,
      ).toISOString(),
    }));
  }

  @Get('pie')
  @ApiOperation({ summary: 'Get pie chart data' })
  @ApiResponse({ status: 200, description: 'Pie chart data retrieved' })
  async getPie() {
    const categories = [
      { name: '电子产品', baseValue: 4000 },
      { name: '服装服饰', baseValue: 3000 },
      { name: '食品饮料', baseValue: 2500 },
      { name: '家居用品', baseValue: 2000 },
      { name: '运动户外', baseValue: 1500 },
      { name: '其他', baseValue: 1000 },
    ];
    return categories.map((category) => ({
      name: category.name,
      value: category.baseValue + Math.floor(Math.random() * 1000),
    }));
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get task list' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved' })
  async getTasks() {
    const taskTitles = [
      '完成项目报告',
      '审核用户反馈',
      '更新产品文档',
      '修复登录问题',
      '优化数据库查询',
      '部署新版本',
      '团队周会',
      '代码审查',
      '设计UI界面',
      '编写测试用例',
      '数据库备份',
      '安全漏洞修复',
      '性能优化',
      '需求分析',
      '产品演示准备',
      '客户反馈处理',
      '文档翻译',
      '接口对接',
      '系统监控设置',
      '用户培训',
      'Bug修复',
      '代码重构',
      '技术调研',
      'API文档更新',
      '发布测试版本',
    ];
    const statuses: ('pending' | 'in_progress' | 'done')[] = [
      'pending',
      'in_progress',
      'done',
    ];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const assignees = [
      { id: 'user1', name: '张三' },
      { id: 'user2', name: '李四' },
      { id: 'user3', name: '王五' },
      { id: 'user4', name: '赵六' },
      { id: 'user5', name: '系统管理员' },
    ];

    // 增加到 15-20 个任务
    const taskCount = Math.floor(Math.random() * 6) + 15;
    return taskTitles.slice(0, taskCount).map((title, index) => {
      const daysFromNow = Math.floor(Math.random() * 14) - 7;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysFromNow);

      return {
        id: `task_${index + 1}`,
        title,
        description: `${title}的详细描述和要求`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        dueDate: dueDate.toISOString(),
        assignee: assignees[Math.floor(Math.random() * assignees.length)],
        progress: Math.floor(Math.random() * 100),
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    });
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get system overview' })
  @ApiResponse({ status: 200, description: 'Overview retrieved' })
  async getOverview() {
    return {
      cpu: Number((Math.random() * 60 + 20).toFixed(1)),
      memory: Number((Math.random() * 40 + 40).toFixed(1)),
      disk: Number((Math.random() * 30 + 50).toFixed(1)),
      network: Number((Math.random() * 80 + 10).toFixed(1)),
      uptime: Math.floor(Math.random() * 30 * 24 * 60 * 60) + 86400,
      requests: Math.floor(Math.random() * 100000) + 10000,
      errors: Math.floor(Math.random() * 100),
      responseTime: Math.floor(Math.random() * 200) + 50,
    };
  }
}
