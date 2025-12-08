# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Halolight API NestJS 是基于 NestJS 11 + Prisma ORM 5 + PostgreSQL 16 构建的企业级后端 API，为 Halolight 多框架管理后台生态系统提供 60+ RESTful 端点，覆盖 12 个核心业务模块。

## 技术栈速览

- **框架**: NestJS 11 + TypeScript 5.7
- **ORM**: Prisma 5 + PostgreSQL 16
- **认证**: JWT 双令牌机制 (AccessToken + RefreshToken)
- **权限**: RBAC 角色权限控制（支持通配符）
- **文档**: Swagger/OpenAPI 自动生成
- **构建工具**: pnpm 10、ESLint 9 + Prettier
- **测试**: Jest 30 + Supertest

## 常用命令

```bash
# 开发
pnpm dev                    # 启动开发服务器（热重载，http://localhost:3000）
pnpm build                  # 生产构建，输出到 dist/
pnpm start:prod             # 运行生产构建

# 代码质量
pnpm lint                   # ESLint 检查
pnpm lint:fix               # ESLint 自动修复
pnpm type-check             # TypeScript 类型检查（不输出文件）
pnpm format                 # Prettier 格式化

# 测试
pnpm test                   # 运行单元测试（src/*.spec.ts）
pnpm test:watch             # 监视模式
pnpm test:cov               # 生成覆盖率报告
pnpm test:e2e               # 运行 E2E 测试（test/*.e2e-spec.ts）

# 数据库 (Prisma)
pnpm prisma:generate        # 生成 Prisma Client（postinstall 自动执行）
pnpm prisma:migrate         # 运行数据库迁移（开发环境）
pnpm prisma:studio          # 打开 Prisma Studio 数据库 GUI
pnpm prisma:seed            # 填充测试数据
pnpm db:reset               # 重置数据库（破坏性操作）
```

## 架构

### 模块结构

项目遵循 NestJS 模块化架构：

```
src/
├── common/                  # 共享模块
│   ├── decorators/          # 自定义装饰器（@CurrentUser, @Public, @RequirePermissions）
│   ├── filters/             # 全局异常过滤器（HttpExceptionFilter, PrismaExceptionFilter）
│   ├── guards/              # 守卫（JwtAuthGuard 全局应用）
│   └── dto/                 # 分页 DTO、共享接口
├── configs/                 # 应用配置（环境变量、Swagger）
├── infrastructure/prisma/   # PrismaService（全局单例）
└── modules/                 # 业务模块
    ├── auth/                # 认证模块（登录、注册、刷新令牌、登出）
    ├── users/               # 用户管理（CRUD、分页、搜索）
    ├── roles/               # 角色管理（CRUD + 权限分配）
    ├── permissions/         # 权限管理（通配符支持）
    ├── teams/               # 团队管理
    ├── documents/           # 文档管理（标签、文件夹）
    ├── files/               # 文件管理
    ├── folders/             # 文件夹管理（树形结构）
    ├── calendar/            # 日历事件管理
    ├── notifications/       # 通知管理
    ├── messages/            # 消息会话管理
    └── dashboard/           # 仪表盘统计
```

### 核心设计模式

**认证流程:**
- JWT 认证通过 `APP_GUARD` 在 `app.module.ts` 中全局应用
- 使用 `@Public()` 装饰器跳过特定路由的认证
- 使用 `@CurrentUser()` 装饰器在控制器中注入当前用户
- 双令牌策略：AccessToken（短期）+ RefreshToken（存储于数据库）

**权限控制:**
- RBAC 角色权限，支持通配符匹配（如 `users:view`、`documents:*`、`*`）
- 使用 `@RequirePermissions('resource:action')` 装饰器控制路由访问
- 权限存储在 `permissions` 表，通过 `role_permissions` 关联

**数据库访问:**
- 所有模块通过 `PrismaService` 进行数据库操作
- Schema 定义在 `prisma/schema.prisma`，包含 17 个数据模型
- 主键使用 cuid()，配置了适当的级联删除

**API 结构:**
- 全局前缀：`/api`（排除 `/` 和 `/health`）
- Swagger 文档：`/docs`
- 全局启用 ValidationPipe（whitelist/transform）

### 数据流模式

1. **请求处理**: Controller → Service → PrismaService → Database
2. **认证拦截**: JwtAuthGuard (全局) → JwtStrategy → 用户验证
3. **异常处理**: HttpExceptionFilter + PrismaExceptionFilter 统一错误响应
4. **数据验证**: class-validator + class-transformer 自动验证和转换 DTO

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | - |
| `JWT_SECRET` | JWT 签名密钥（≥32字符） | - |
| `PORT` | 服务端口 | `3000` |
| `NODE_ENV` | 运行环境 | `development` |
| `CORS_ORIGIN` | CORS 允许源（逗号分隔） | `*` |
| `JWT_EXPIRES_IN` | AccessToken 过期时间 | `7d` |
| `REFRESH_TOKEN_SECRET` | RefreshToken 密钥 | 默认使用 JWT_SECRET |
| `REFRESH_TOKEN_EXPIRES_IN` | RefreshToken 过期时间 | `30d` |

## 代码规范

- ESLint 配置：TypeScript 严格规则 + Prettier 集成
- 未使用变量：前缀 `_` 可抑制错误（`@typescript-eslint/no-unused-vars`）
- 提交规范：遵循 Conventional Commits（`feat:`、`fix:`、`docs:` 等）
- 使用相对路径导入模块（未配置路径别名）

## CI/CD

GitHub Actions 工作流 (`.github/workflows/ci.yml`) 包含：

- **lint**: ESLint + TypeScript 类型检查
- **test**: 单元测试 + 覆盖率报告
- **build**: NestJS 生产构建
- **security**: 依赖安全审计（pnpm audit）

## 新增功能开发指南

### 添加新模块

1. 使用 NestJS CLI：`nest g module modules/新模块名`
2. 创建 Controller、Service、DTO
3. 在 `app.module.ts` 中导入模块
4. 如需数据库表，在 `prisma/schema.prisma` 中添加模型并运行迁移

### 添加新 API 端点

1. 在对应模块的 Controller 中添加路由方法
2. 使用 Swagger 装饰器（`@ApiTags`、`@ApiOperation`、`@ApiResponse`）
3. 创建请求/响应 DTO 并添加 class-validator 装饰器
4. 如需权限控制，添加 `@RequirePermissions()` 装饰器
