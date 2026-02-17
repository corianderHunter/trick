# Backend

基于 TypeScript + NestJS 的 Web 后端系统。

## 技术栈

- **NestJS 11** - Node.js 企业级框架
- **TypeScript** - 类型安全
- **TypeORM** - ORM
- **PostgreSQL** - 数据库
- **Express** - HTTP 服务器（NestJS 默认）

## 数据库配置

复制 `.env.example` 为 `.env` 并配置：

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin
DB_NAME=trick
```

需先创建 PostgreSQL 数据库 `trick` 及用户 `admin/admin`。

## 快速开始

```bash
# 安装依赖（如未安装）
npm install

# 开发模式（热重载）
npm run start:dev

# 普通启动
npm run start

# 生产构建
npm run build

# 生产运行
npm run start:prod

# 代码检查
npm run lint

# 单元测试
npm run test

# E2E 测试
npm run test:e2e
```

服务默认运行在 [http://localhost:3001](http://localhost:3001)（可通过 `PORT` 环境变量修改）。

**OpenAPI 文档：** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

## API 接口

### 1. 模型配置上传

- `POST /api/model-configs` - 创建模型配置
- `GET /api/model-configs` - 获取模型配置列表
- `GET /api/model-configs/:id` - 获取单个配置

**请求体示例：**

```json
{
  "name": "DeepSeek",
  "apiUrl": "https://api.deepseek.com",
  "apiKey": "sk-xxx",
  "provider": "deepseek"
}
```

### 2. 文本生成请求

- `POST /api/generation` - 提交生成任务
- `GET /api/generation` - 获取任务列表
- `GET /api/generation/:id` - 获取单个任务

**请求体示例：**

```json
{
  "content": "文本内容（0-8000 字符）",
  "dialogueStyleId": "uuid-of-dialogue-style",
  "visualStyleId": "uuid-of-visual-style",
  "modelId": "uuid-of-model-config"
}
```

### 3. 台词风格

- `POST /api/dialogue-styles` - 创建
- `GET /api/dialogue-styles` - 列表
- `GET /api/dialogue-styles/:id` - 详情
- `PATCH /api/dialogue-styles/:id` - 更新
- `DELETE /api/dialogue-styles/:id` - 删除

### 4. 画面风格

- `POST /api/visual-styles` - 创建
- `GET /api/visual-styles` - 列表
- `GET /api/visual-styles/:id` - 详情
- `PATCH /api/visual-styles/:id` - 更新
- `DELETE /api/visual-styles/:id` - 删除

## 项目结构

```
src/
├── ai/                   # AI 客户端模块（可扩展）
│   ├── interfaces/       # 抽象接口
│   │   └── ai-client.interface.ts
│   ├── clients/          # 各模型客户端实现
│   │   ├── client-config.interface.ts
│   │   ├── deepseek/     # DeepSeek 客户端
│   │   └── index.ts
│   ├── ai-client.factory.ts  # 客户端工厂
│   └── ai.module.ts
├── entities/
├── model-config/
├── generation/
├── app.module.ts
└── main.ts
```

## AI 客户端扩展

新增模型提供商时：

1. 在 `src/ai/clients/` 下新建目录，如 `claude/`
2. 实现 `IAiClient` 接口（`generate` 方法）
3. 在 `ai-client.factory.ts` 的 switch 中注册
4. 在 `model_config` 创建时指定 `provider` 字段

**DeepSeek 配置示例：**

```json
{
  "name": "DeepSeek",
  "apiUrl": "https://api.deepseek.com",
  "apiKey": "sk-xxx",
  "provider": "deepseek"
}
```
