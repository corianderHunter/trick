# Frontend

基于 React 19 + Next.js 16 的前端系统。

## 技术栈

- **React 19.2** - UI 框架
- **Next.js 16.1** - 全栈 React 框架（App Router）
- **TypeScript** - 类型安全
- **Tailwind CSS v4** - 样式方案
- **ESLint** - 代码规范

## 快速开始

```bash
# 安装依赖（如未安装）
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务
npm start

# 代码检查
npm run lint
```

开发服务器默认运行在 [http://localhost:3000](http://localhost:3000)。

## 项目结构

```
src/
├── app/           # App Router 路由
│   ├── layout.tsx # 根布局
│   ├── page.tsx   # 首页
│   └── globals.css
└── ...
```
