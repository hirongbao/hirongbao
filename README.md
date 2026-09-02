# hirongbao

个人动态与生活记录网站，使用 React、TypeScript、Vite 和 Express 构建。

## 功能

- 个人资料和社交链接
- 动态信息流、图片/视频、点赞和评论
- 全部、美食、风景、随笔分类筛选
- 访客在线人数心跳
- 友好的错误、空数据和重试状态
- 按当前分类更新浏览器标题

## 本地开发

要求：Node.js 20+、npm 10+，并确保后端运行在 `8080`。

```bash
npm ci
npm run dev
```

默认地址为 `http://localhost:3001`。环境变量示例：

```dotenv
NODE_ENV=development
BACKEND_URL=http://127.0.0.1:8080
PORT=3001
```

接口约定见 [API.md](./API.md)，后端升级说明见 [BACKEND_INTEGRATION_PROMPT.md](./BACKEND_INTEGRATION_PROMPT.md)。

## 构建与部署

```bash
npm ci
npm run lint
npm run build
NODE_ENV=production npm start
```

推送 `main` 后，GitHub Actions 执行检查并触发服务器部署；服务器会拉取代码、构建并重启 `hirongbao-web.service`。

生产环境变量位于服务器 `/opt/apps/hirongbao-web/shared/.env`，不要提交到仓库。

## 目录

```text
src/       页面、组件、类型和工具
public/    favicon、插画等静态资源
server.ts  Express 服务器与后端代理
```
