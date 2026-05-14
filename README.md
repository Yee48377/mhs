# 约稿纠纷记录平台

一个可上线的 Next.js + Tailwind CSS + Supabase 网站，用于记录、检索和审核“约稿交易争议 / 待回应记录”。

项目定位是“交易纠纷记录平台”，不是“黑名单”或“定罪工具”。界面风格偏 Notion + 社区工具站，支持手机端，所有业务数据写入 Supabase，不使用 `localStorage`。

## 技术栈

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase Database
- Supabase Storage

## 已实现功能

- 首页大搜索框，实时搜索已审核公开记录
- 首页概览卡片：已解决数量、公开记录数量、平台规则、隐私说明
- 最近新增记录展示
- 投稿页面：强制上传证据截图
- 服务端上传到私有 Storage bucket
- 证据访问走 signed URL，不暴露公开直链
- 全站 `noindex,nofollow`
- 重复投稿自动累加 `report_count`
- 补充证据页面
- 申诉页面
- `/admin` 管理员后台
- 简单密码登录，服务端 Cookie 会话
- 审核公开 / 驳回隐藏 / 标记已解决 / 删除恶意投稿
- 管理员查看补充证据、异常提交监控、管理员操作日志
- 提交成功后自动跳转到对应记录详情页

## 项目结构

```text
app/
  api/
    admin/
    appeals/
    evidence/
    reports/
    search/
  admin/
  appeal/
  submit/
  supplement/
  globals.css
  layout.tsx
  page.tsx
components/
  admin-dashboard.tsx
  admin-login-form.tsx
  appeal-form.tsx
  evidence-form.tsx
  file-upload-field.tsx
  report-card.tsx
  report-form.tsx
  search-panel.tsx
  site-shell.tsx
  status-badge.tsx
lib/
  auth.ts
  constants.ts
  env.ts
  queries.ts
  supabase.ts
  utils.ts
  validators.ts
supabase/
  schema.sql
types/
  index.ts
  supabase.ts
```

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 复制环境变量文件

```bash
cp .env.example .env.local
```

3. 填写 `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=evidence
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=evidence
ADMIN_PASSWORD=your-admin-password
```

4. 在 Supabase SQL Editor 执行 [`supabase/schema.sql`](/Users/gallery/Documents/mhs/supabase/schema.sql)

5. 启动开发环境

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## Supabase 配置说明

### 1. 创建项目

在 [Supabase](https://supabase.com/) 新建一个项目。

### 2. 执行 SQL

打开 SQL Editor，把 [`supabase/schema.sql`](/Users/gallery/Documents/mhs/supabase/schema.sql) 全部执行。

这会自动完成：

- `commission_reports` 主表
- `report_appeals` 申诉表
- `report_evidence_submissions` 补充证据表
- `submission_events` 异常提交监控表
- `admin_action_logs` 管理员操作日志表
- `evidence` 存储桶
- 基础 RLS 策略

### 3. 获取环境变量

打开 Supabase 项目设置：

- `Project Settings -> API`
- 复制 `Project URL`
- 复制 `anon public key`
- 复制 `service_role key`

然后填入 `.env.local` 或 Vercel 环境变量。

### 4. Storage 注意事项

本项目的截图上传走 Supabase Storage 的私有桶：

- bucket 名称默认是 `evidence`
- 用户文件先上传到 Next.js API
- 由服务端使用 `service role` 转存到私有 bucket
- 公开页面和后台查看证据时走限时 signed URL
- 不暴露永久公共链接

## 管理员后台说明

访问 `/admin`：

- 输入 `ADMIN_PASSWORD`
- 登录成功后会写入服务端 `httpOnly cookie`
- 不依赖 `localStorage`

当前后台适合第一版上线。如果后续你想升级为真正多管理员体系，可以继续替换成：

- Supabase Auth
- 管理员账号表
- RBAC 权限模型

## 部署到 Vercel

### 方式一：GitHub + Vercel

1. 把项目推到 GitHub
2. 登录 [Vercel](https://vercel.com/)
3. 点击 `New Project`
4. 导入这个仓库
5. Framework 选择 `Next.js`
6. 在 Environment Variables 中填写：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `ADMIN_PASSWORD`

7. 点击 Deploy

### 方式二：Vercel CLI

```bash
npm i -g vercel
vercel
```

按提示绑定项目后，在 Vercel 控制台补齐环境变量并重新部署。

## 上线前建议

- 在管理员后台手动审核后再公开记录
- 对 `ADMIN_PASSWORD` 使用强随机值
- 为接口增加限流，例如 Upstash Redis 或 Supabase Edge Functions
- 接入图形验证码，降低恶意投稿
- 后续补充操作日志表，记录管理员动作
- 执行最新的 `schema.sql` 以启用异常提交监控与管理员操作日志
- 周期性清理过期测试数据并轮换 `secret key`

## 当前实现说明

- 所有业务数据都写入 Supabase
- 前台只展示 `is_public = true` 且状态为 `已公开` 的记录
- 投稿强制需要证据
- 当前只接收失联满 10 天的交易争议记录
- 证据文件默认私有，公开访问通过短时签名链接完成
- 重复投稿会合并到现有目标记录，并把新增截图写入 `report_evidence_submissions`

## 可继续扩展

- 多字段高级筛选
- 管理员备注
- 自动通知申诉处理结果
- 图像压缩上传
- 私有证据签名链接
- 举报频次统计面板
