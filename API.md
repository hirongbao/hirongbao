# API Documentation (接口文档)

本应用的数据全部来自 ServiceHub 后端（hirongbaohub 模块）。本地开发由 `server.ts` 把 `/api/profile`、`/api/posts` 及点赞、评论接口代理到后端 `http://localhost:8080`（可用 `BACKEND_URL` 环境变量覆盖），响应为 ServiceHub 统一包装 `{ code, data, message }`，前端取 `code === 0` 时的 `data`。

动态内容在 ServiceHub 管理后台的「动态管理」中发布，公开接口只返回已发布（未下架）的动态。

---

## 1. Get Profile Information

**Endpoint:** `GET /api/profile`（代理到 ServiceHub `/api/hirongbaohub/profile`，公开无需凭证）

**Response:** (200 OK)
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "name": "hirongbao",
    "handle": "hirongbao",
    "bio": "数字人类学研究者 & 视觉设计师。...",
    "avatarUrl": "https://...",
    "socials": [
      { "platform": "微信", "iconName": "MessageCircle", "url": null, "qrCodeUrl": "https://..." },
      { "platform": "GitHub", "iconName": "Github", "url": "https://github.com/hirongbao", "qrCodeUrl": null }
    ],
    "stats": { "posts": 142, "followers": 12400, "following": 248 }
  }
}
```

约定（以后端为准）：

- `handle` 不带 `@`，展示时由前端拼接。
- `stats.followers` 为原始数字，前端用 `formatCount` 格式化（如 `12.4k`）。
- `socials` 中 `url` 非空渲染为外链（新 tab 打开），`qrCodeUrl` 非空渲染为二维码弹窗，二者至少一个非空。
- `iconName` 为图标组件名（Lucide / react-icons 映射，见 `Profile.tsx` 的 `IconMap`）。

---

## 2. Get Posts

**Endpoint:** `GET /api/posts/page?page=1&size=12&category=food`（代理到 ServiceHub `/api/hirongbaohub/posts/page`，公开无需凭证）

**Response:** (200 OK)
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
    {
      "id": 1,
      "content": "周末就是不吃对的，只吃爽的",
      "likeCount": 2548,
      "createdAt": "2026-08-31T10:00:00",
      "media": [
        { "mediaType": "image", "mediaUrl": "https://...", "sortOrder": 0 }
      ],
      "comments": [
        { "id": 1, "author": "访客", "content": "太真实了！", "createdAt": "2026-08-31T10:05:00" }
      ]
    }
    ],
    "page": 1,
    "size": 12,
    "total": 142,
    "hasMore": true
  }
}
```

约定：

- `content` 可为 `null`（纯图/纯视频动态），前端不渲染文字。
- `media` 为数组：图片 1~9 张（按 `sortOrder` 排序，首张为封面）或视频 1 条；纯文字动态为空数组。
- `createdAt` 为原始时间，前端用 `formatRelativeTime` 转相对时间。
- 评论按时间正序返回。
- `page` 从 1 开始，`size` 最大 30；首页通过触底自动请求下一页。

兼容接口 `GET /api/posts` 仍保留，返回全部动态，供旧客户端过渡使用。

---

## 3. Like or Unlike a Post

**Endpoint:** `POST /api/posts/:id/like`（代理到 `/api/hirongbaohub/posts/:id/like`）

**Request Body:** `{ "action": "like" }`（或 `"unlike"`）

**Response:** `{ "code": 0, "message": "success", "data": { "likes": 2549 } }`

---

## 4. Add a Comment to a Post

**Endpoint:** `POST /api/posts/:id/comments`（代理到 `/api/hirongbaohub/posts/:id/comments`）

**Request Body:** `{ "author": "昵称 (Optional，默认访客)", "content": "这是一条新评论" }`

**Response:** `{ "code": 0, "message": "success", "data": { "id": 9, "postId": 1, "author": "访客", "content": "...", "createdAt": "..." } }`

---

## 5. Visitor Heartbeat and Statistics

**Endpoint:** `POST /api/heartbeat`

前端每 15 秒发送一次心跳。后端会按 IP 的不可逆摘要持久化独立访客和访问次数，并返回实际在线人数与用于展示的在线人数：

```json
{ "code": 0, "data": { "onlineCount": 3, "actualOnlineCount": 1, "totalVisitors": 128 }, "message": "success" }
```

`onlineCount` 在低流量时采用温和基线（不会超过实际在线人数 + 5），访问量上升后自动回归实际在线人数；`totalVisitors` 为持久化累计独立访客数。

## 6. Proxy Image (CORS Bypass)

**Endpoint:** `GET /api/proxy-image?url=<encoded-image-url>`

Returns the binary image data with `Access-Control-Allow-Origin: *` headers attached.
