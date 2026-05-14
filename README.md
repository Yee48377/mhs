# 约稿失联记录站

用于整理约稿合作中的失联记录、沟通时间线与处理进度。

本站仅用于信息整理与联系，不作其他用途。公开内容会进行基础隐私处理，并提供申诉与补充渠道。

## 当前功能

- 搜索公开记录
- 投稿与补充证据
- 自动审核，但是管理员有权限删帖
- 申诉入口
- 已解决状态标记

## 技术栈

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Vercel

## 本地启动

```bash
npm install
npm run dev
```

## 环境变量

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
```

## 内容说明

- 当前仅接收失联满 10 天的记录
- 投稿需提供基础证据
- 所有内容均由用户提交
- 如有错误、隐私问题或已解决情况，可通过申诉渠道联系处理
