# 🚀 动态信息流分类功能 - 后端升级文档与 AI Prompt

本文档包含了前端最新更新后，所需的后端接口改动说明，以及可以直接发给后端 AI 的开发 Prompt。

---

## 📑 第一部分：API 接口变动文档

### 1. 动态列表接口 (功能升级)
- **请求方法**: `GET`
- **请求路径**: `/api/hirongbaohub/posts`
- **Query 参数**:
  - `category` (可选，String)：分类标识符（如 `food`, `scenery` 等）。
    - **逻辑要求**：如果不传该参数，或者传空，应返回全量动态；如果传入了该参数，需要执行数据库过滤（如 `WHERE category_id = 'food'`），仅返回该分类下的动态。
- **返回值变动 (JSON)**:
  - 需要在返回的单个 Post 实体中，新增 `category` 对象字段，表明该动态所属的分类。

**期望返回的 JSON 示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "content": "周末就是不吃对的，只吃爽的",
      "likeCount": 2548,
      "createdAt": "2026-08-31T12:00:00Z",
      "category": {
        "id": "food",
        "name": "美食"
      },
      "media": [ ... ],
      "comments": [ ... ]
    }
  ]
}
```

---

## 🤖 第二部分：给后端 AI 助手的 Prompt (直接复制即可)

如果你使用 AI（如 Cursor / GitHub Copilot / ChatGPT）来写后端，请直接复制以下内容发给它：

> 你好，我是这个项目的后端开发者。我们的前端（React + Vite）刚刚完成了一次改版，在“动态/信息流”页面增加了“分类筛选”功能（包含全部、美食、风景、随笔等）。
> 
> 现在需要你帮我修改后端的 API 接口，配合前端的调用逻辑，具体需求如下：
> 
> **1. 升级获取动态列表的接口**
> - **目标接口**: 处理 `GET /api/hirongbaohub/posts` 请求的 Controller / Route。
> - **查询参数支持**: 前端现在会通过 URL Query 传递 `category` 参数（例如 `GET /api/hirongbaohub/posts?category=food`）。
> - **业务逻辑修改**: 
>   - 请在服务层（Service/Repository）增加对 `category` 字段的判断。
>   - 如果 Query 中没有 `category` 参数（或为 'all' / 空值），则按原来的逻辑查询所有动态（需保证默认排序规则不变）。
>   - 如果有 `category` 参数，请在 SQL/ORM 查询中增加过滤条件（例如 `where category_id = :category`），只返回对应分类的数据。
> 
> **2. 补充返回的数据结构**
> - 前端需要在 UI 上展示该动态属于什么分类。
> - 请在组装返回 JSON 时，给每一条动态实体补上一个 `category` 对象字段，结构为 `{ "id": "food", "name": "美食" }`。如果是关系型数据库，你可能需要加上相应的 `JOIN` 查询，或是利用 ORM 的预加载（Eager Loading）把关联的 Category 表数据带出来。
> 
> **3. 数据库结构评估 (如果有必要)**
> - 如果目前我们的 `posts` 表还没有 `category_id` 相关的字段，请帮我生成一段对应的数据库迁移（Migration/DDL）SQL 代码来新增这个字段，并建立索引，同时给出简单的测试数据 seeding。
> 
> 请告诉我你需要我提供哪些现有的后端文件（Controller, Entity, Repository），然后我们开始重构。

---

## 📈 第三部分：当前在线人数 (心跳包机制)

前端目前已经上线了“当前在线人数” UI 组件。为了规避 WebSocket 的复杂性，前端现在采用 **短轮询心跳 (Heartbeat)** 机制来与后端同步在线人数。

### 1. 新增心跳接口 API 定义
- **请求方法**: `POST`
- **请求路径**: `/api/hirongbaohub/heartbeat`
- **请求体 (Body)**:
  - `clientId` (必填，String)：前端生成的用于标识当前用户/页签的唯一 ID。
- **业务逻辑要求**:
  - 每当收到带有 `clientId` 的请求时，刷新该客户端在后端存储中的最后活跃时间（可以使用 Redis 的 `setex` 设置 45-60 秒过期，或者用内存 Map 定时清理）。
  - 统计目前未过期（过去 45-60 秒内活跃过）的独立 `clientId` 的总数，即为“当前在线人数”。
- **期望返回 JSON**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "onlineCount": 128
  }
}
```

### 🤖 复制以下内容发给后端 AI (实现心跳机制)

> 另外，前端刚刚还上线了“当前在线人数”功能。为了避免长连接的维护成本，我们决定采用**短轮询心跳**机制。
> 
> 前端现在每隔 15 秒会发送一次 POST 请求到 `/api/hirongbaohub/heartbeat`，请求体内包含一个唯一标识 `clientId`。
> 
> 请帮我实现这个后端接口：
> 1. 创建处理 `POST /api/hirongbaohub/heartbeat` 的 Controller 方法。
> 2. 接收 Request Body 中的 `clientId`，记录下它的最新活跃时间。
> 3. （可选）如果你推荐使用 Redis，请给我一段使用 Redis 设置带有 TTL 过期时间（建议 45-60 秒）的键值对的代码；如果不使用 Redis，请用本地内存（如 ConcurrentHashMap）配合定时任务清理过期客户端。
> 4. 计算当前未过期的总活跃客户端数量，包装成 `{ "code": 0, "data": { "onlineCount": 125 } }` 返回给前端。
> 
> 请告诉我实现这段逻辑需要你在哪些文件里新增代码？
