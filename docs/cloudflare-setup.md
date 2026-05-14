# Cloudflare 接入建议

目标：在不迁移到中国大陆服务器的前提下，尽量优化中国大陆访问稳定性。

## 推荐拓扑

用户 -> Cloudflare -> Vercel -> Supabase

## 建议设置

1. 把自定义域名托管到 Cloudflare
2. 给网站主域名或 `www` 域名添加 `CNAME`
3. `CNAME` 指向 Vercel 分配的目标域名
4. 打开 Cloudflare 代理模式
5. 在 Cloudflare 打开：
   - Auto Minify
   - Brotli
   - HTTP/3
   - Early Hints
6. Cache Rules:
   - 默认缓存静态资源
   - 不缓存 `/api/uploads`
   - 不缓存 `/api/reports`
   - 不缓存 `/api/appeals`
   - 不缓存 `/api/evidence`
   - 不缓存 `/api/admin/*`
   - `/api/search` 可保留源站缓存头

## 注意

- 不要缓存管理后台和写入接口
- 不要给 Supabase API 域名单独走 Cloudflare 反向代理
- 如果后续启用自定义域名证据访问页，仍建议只代理网站主域名
