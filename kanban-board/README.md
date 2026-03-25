# Kanban Board - 任务看板

一个简单但功能强大的实时任务看板，基于 HTML5 + Express.js 构建。

## 功能特性

- ✅ **三列看板**：To Do、In Progress、Done
- ✅ **实时更新**：每2秒自动同步任务状态
- ✅ **任务管理**：添加、移动状态、删除任务
- ✅ **任务详情**：标题、描述、负责人、创建时间
- ✅ **用户标识**：自动生成随机用户名（可手动修改）
- ✅ **美观界面**：渐变背景、玻璃态效果、响应式设计

## 快速开始

### 方法 1：直接打开（单机使用）

```bash
cd /root/potato-dungeon/kanban-board
# 在浏览器中打开 index.html
```

### 方法 2：启动后端（多用户实时同步）

```bash
cd /root/potato-dungeon/kanban-board

# 安装依赖（首次使用）
npm install express cors

# 启动服务器
node server.js

# 或使用 PM2（推荐）
pm2 start server.js --name kanban-server
```

## 访问地址

- **前端**：`http://10.3.0.12:10002/kanban-board/index.html`
- **API**：`http://10.3.0.12:10002/api`

## API 接口

### 获取所有任务
```bash
GET /api/tasks
```

### 添加任务
```bash
POST /api/tasks
Content-Type: application/json

{
  "title": "任务标题",
  "description": "任务描述",
  "assignee": "负责人",
  "status": "todo",  // todo | progress | done
  "createdBy": "用户名"
}
```

### 更新任务
```bash
PUT /api/tasks/:id
Content-Type: application/json

{
  "status": "progress"
}
```

### 删除任务
```bash
DELETE /api/tasks/:id
```

### 批量更新
```bash
POST /api/tasks/bulk
Content-Type: application/json

{
  "updates": [
    { "id": 123, "status": "done" },
    { "id": 456, "status": "progress" }
  ]
}
```

### 获取统计
```bash
GET /api/stats

响应：
{
  "success": true,
  "stats": {
    "total": 10,
    "todo": 3,
    "progress": 4,
    "done": 3
  }
}
```

## 数据存储

任务数据保存在 `tasks.json` 文件中，格式如下：

```json
[
  {
    "id": 1234567890,
    "title": "任务标题",
    "description": "任务详细描述",
    "assignee": "负责人",
    "status": "todo",
    "createdBy": "用户名",
    "createdAt": "2026-02-27T00:00:00.000Z",
    "updatedAt": "2026-02-27T00:00:00.000Z"
  }
]
```

## 使用说明

1. **添加任务**
   - 点击任意列下方的 `＋` 按钮
   - 填写任务标题（必填）
   - 填写描述、负责人（可选）
   - 点击"保存"

2. **移动任务**
   - 点击任务左右箭头按钮
   - 任务会在不同列之间移动
   - 支持的移动：
     - In Progress → To Do（左移）
     - Done → In Progress（左移）
     - To Do → In Progress（右移）
     - In Progress → Done（右移）

3. **完成任务**
   - 从 In Progress 移到 Done
   - 或直接添加到 Done 列

4. **重新打开任务**
   - Done 列的任务可以点击"← 重新打开"
   - 将任务移回 In Progress

5. **删除任务**
   - 点击任务右侧的 🗑️ 按钮
   - 确认删除

## 实时同步

看板每 2 秒自动从服务器获取最新任务列表，确保：

- 多个用户可以同时使用看板
- 一个人添加/修改任务，其他人立即看到更新
- 状态指示器显示当前同步状态

## PM2 管理

```bash
# 查看状态
pm2 list

# 查看日志
pm2 logs kanban-server

# 重启服务
pm2 restart kanban-server

# 停止服务
pm2 stop kanban-server

# 删除服务
pm2 delete kanban-server
```

## 部署到生产环境

```bash
# 1. 确保端口 10002 已开放
firewall-cmd --add-port=10002/tcp --permanent
firewall-cmd --reload

# 2. 使用 PM2 启动（推荐）
pm2 start server.js --name kanban-server
pm2 save

# 3. 配置开机自启动
pm2 startup
```

## 技术栈

- **前端**：HTML5 + Vanilla JavaScript + CSS3
- **后端**：Node.js + Express.js
- **数据存储**：JSON 文件（可升级为数据库）
- **进程管理**：PM2

## 许可证

MIT

## 作者

小龙虾 (AI Assistant) 🦞
