# Halolight API | NestJS

[![CI](https://github.com/halolight/halolight-api-nestjs/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/halolight/halolight-api-nestjs/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/halolight/halolight-api-nestjs/blob/main/LICENSE)
[![pnpm](https://img.shields.io/badge/pnpm-10.23.0-ffa41c.svg)](https://pnpm.io)
[![NestJS](https://img.shields.io/badge/NestJS-11-%23E0234E.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-%233178C6.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-%232D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-%23336791.svg)](https://www.postgresql.org/)

基于 NestJS 11 的企业级后端 API 实现，支持 JWT 认证、RBAC 权限、Prisma ORM、Swagger 文档，为 HaloLight 多框架管理后台提供强大、可扩展的服务端支持。

- 在线预览：<http://halolight-api-nestjs.h7ml.cn>
- API 文档：<http://halolight-api-nestjs.h7ml.cn/docs>
- GitHub：<https://github.com/halolight/halolight-api-nestjs>

## 功能亮点

- **NestJS 11 + TypeScript**：模块化架构、依赖注入、装饰器驱动，完整类型安全
- **Prisma ORM 5 + PostgreSQL 16**：类型安全的数据库访问、自动迁移、关系管理
- **JWT 认证 + RBAC 权限**：AccessToken/RefreshToken 双令牌机制，支持通配符权限控制
- **Swagger/OpenAPI 文档**：自动生成交互式 API 文档，支持在线测试与调试
- **12 个业务模块**：60+ RESTful API 端点，覆盖用户、角色、权限、文档、文件、日历、通知等
- **企业级架构**：模块化设计、依赖注入、全局异常处理、请求验证、日志记录
- **Docker 部署**：多阶段构建优化、Docker Compose 一键部署、健康检查机制
- **完整 CI/CD**：GitHub Actions 自动化 lint、test、build、security 审计

## 目录结构

```
src/
├── common/                  # 共享模块
│   ├── decorators/          # 自定义装饰器（权限、用户等）
│   ├── filters/             # 全局异常过滤器
│   ├── guards/              # 守卫（JWT、权限校验）
│   └── interceptors/        # 拦截器（日志、转换）
├── configs/                 # 配置模块
│   ├── config.module.ts     # 环境变量配置
│   ├── env.validation.ts    # 环境变量验证
│   └── swagger.config.ts    # Swagger 文档配置
├── infrastructure/          # 基础设施
│   └── prisma/              # Prisma ORM 配置与服务
├── modules/                 # 业务模块
│   ├── auth/                # 认证模块（登录、注册、刷新令牌）
│   ├── users/               # 用户管理（CRUD、分页、搜索）
│   ├── roles/               # 角色管理（CRUD + 权限分配）
│   ├── permissions/         # 权限管理（通配符支持）
│   ├── teams/               # 团队管理
│   ├── documents/           # 文档管理（标签、文件夹）
│   ├── files/               # 文件管理（上传、下载）
│   ├── folders/             # 文件夹管理（树形结构）
│   ├── calendar/            # 日历事件管理
│   ├── notifications/       # 通知管理
│   ├── messages/            # 消息会话管理
│   └── dashboard/           # 仪表盘统计
├── app.controller.ts        # 根控制器（首页、健康检查）
├── app.service.ts           # 根服务
├── app.module.ts            # 根模块
└── main.ts                  # 应用入口（Bootstrap）
prisma/
├── schema.prisma            # 数据库模型定义（17 个实体）
└── migrations/              # 数据库迁移历史
test/
├── app.e2e-spec.ts          # E2E 测试
└── jest-e2e.json            # E2E Jest 配置
```

## 快速开始

环境要求：Node.js >= 18、PostgreSQL >= 13、pnpm >= 8（项目锁定 pnpm@10.23.0）。

```bash
pnpm install
pnpm prisma:generate  # 生成 Prisma Client
pnpm dev              # 本地开发，默认 http://localhost:3000
```

生产构建与启动

```bash
pnpm build
pnpm start:prod       # 使用构建产物启动
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | 服务端口 | `3000` |
| `DATABASE_URL` | PostgreSQL 数据库连接 | - |
| `JWT_SECRET` | JWT 密钥（≥32字符） | - |
| `JWT_EXPIRES_IN` | AccessToken 过期时间 | `7d` |
| `JWT_REFRESH_SECRET` | RefreshToken 密钥 | - |
| `JWT_REFRESH_EXPIRES_IN` | RefreshToken 过期时间 | `30d` |
| `CORS_ORIGIN` | CORS 允许源 | `*` |

在项目根目录创建 `.env` 文件来配置环境变量：

```bash
# .env 示例
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/halolight_db"
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
CORS_ORIGIN=http://localhost:3000,https://halolight.h7ml.cn
```

## 常用脚本

```bash
pnpm dev              # 启动开发服务器（热重载）
pnpm build            # 生产构建，输出到 dist 目录
pnpm start:prod       # 运行生产构建
pnpm lint             # ESLint 检查代码规范
pnpm lint:fix         # 自动修复 ESLint 问题
pnpm type-check       # TypeScript 类型检查（不输出文件）
pnpm format           # Prettier 格式化代码
pnpm test             # 运行单元测试
pnpm test:e2e         # 运行 E2E 测试
pnpm test:cov         # 运行测试并生成覆盖率报告
pnpm prisma:generate  # 生成 Prisma Client
pnpm prisma:migrate   # 运行数据库迁移（开发环境）
pnpm prisma:studio    # 打开 Prisma Studio（数据库 GUI）
```

## API 模块

项目包含 **12 个核心业务模块**，提供 **60+ RESTful API 端点**：

| 模块 | 端点数 | 描述 |
|------|--------|------|
| **Auth** | 5 | 用户认证（登录、注册、刷新 Token、登出） |
| **Users** | 5 | 用户管理（CRUD、分页、搜索、过滤） |
| **Roles** | 6 | 角色管理（CRUD + 权限分配） |
| **Permissions** | 4 | 权限管理（支持通配符权限） |
| **Teams** | 5 | 团队管理 |
| **Documents** | 5 | 文档管理（支持标签、文件夹） |
| **Files** | 5 | 文件管理 |
| **Folders** | 5 | 文件夹管理（树形结构） |
| **Calendar** | 5 | 日历事件管理 |
| **Notifications** | 5 | 通知管理 |
| **Messages** | 5 | 消息会话 |
| **Dashboard** | 5 | 仪表盘统计 |

### 📖 在线文档

- **Swagger API 文档**：<http://halolight-api-nestjs.h7ml.cn/docs> - 交互式 API 测试与调试
- **完整使用指南（中文）**：<https://halolight.docs.h7ml.cn/guide/api-nestjs> - 详细的 API 参考和使用示例
- **完整使用指南（英文）**：<https://halolight.docs.h7ml.cn/en/guide/api-nestjs> - Full API reference in English

## 代码规范

- **路径别名**：使用 `@/*` 别名指向 `./src/*`
- **ESLint 规则**：NestJS 官方规则集 + TypeScript 严格模式 + Prettier 集成
- **类型安全**：严格的 TypeScript 配置，确保类型完整性
- **测试规范**：单元测试覆盖核心业务逻辑，E2E 测试覆盖关键路径
- **提交规范**：遵循 Conventional Commits 规范（`feat:`, `fix:`, `docs:` 等）

## CI/CD

项目配置了 GitHub Actions 自动化工作流 (`.github/workflows/ci.yml`)：

| Job | 说明 |
|-----|------|
| `lint` | ESLint 检查 + TypeScript 类型检查 |
| `test` | 单元测试 + 覆盖率报告 |
| `build` | NestJS 生产构建 + 构建产物缓存 |
| `security` | 依赖安全审计（pnpm audit） |

## 部署

### Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/halolight/halolight-api-nestjs.git
cd halolight-api-nestjs

# 配置环境变量
cp .env.production .env
# 编辑 .env 文件，设置数据库密码、JWT密钥等

# 启动所有服务（API + PostgreSQL + Redis）
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

### Docker 镜像构建

```bash
docker build -t halolight-api-nestjs .
docker run -p 3000:3000 --env-file .env halolight-api-nestjs
```

### 自托管部署

1. **环境准备**：确保 Node.js >= 18 和 pnpm >= 8 已安装
2. **配置环境变量**：复制 `.env.production` 为 `.env` 并设置必要变量
3. **构建项目**：
   ```bash
   pnpm install
   pnpm prisma:generate
   pnpm build
   ```
4. **启动服务**：
   ```bash
   pnpm start:prod  # 生产模式启动
   ```
5. **进程守护**（可选）：使用 PM2、systemd 或 Docker 运行

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进项目！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 相关链接

- [在线预览](http://halolight-api-nestjs.h7ml.cn)
- [API 文档](http://halolight-api-nestjs.h7ml.cn/docs)
- [HaloLight 文档](https://github.com/halolight/docs)
- [HaloLight Next.js](https://github.com/halolight/halolight)
- [HaloLight Vue](https://github.com/halolight/halolight-vue)
- [HaloLight Angular](https://github.com/halolight/halolight-angular)
- [问题反馈](https://github.com/halolight/halolight-api-nestjs/issues)

## 许可证

[MIT](LICENSE)
