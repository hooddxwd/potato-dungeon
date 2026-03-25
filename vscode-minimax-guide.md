# VS Code Server + Minimax API 完整配置指南

## 🌐 访问地址

**本地访问（服务器内）：**
```
http://10.3.0.12:8443/
```

**公网访问：**
```
http://129.226.204.202:8443/
```

**密码：** `Minimax2024!Secure`

---

## 🚀 快速开始

### 方案 1：使用本地 VS Code 连接（推荐）

#### Windows
1. 打开 VS Code
2. 按 `Ctrl + Shift + P`（或 `Cmd + Shift + P`）
3. 输入：`vscode-remote://ssh-remote+129.226.204.202:8443/root`
4. 输入密码：`Minimax2024!Secure`

#### Mac/Linux
1. 打开 VS Code
2. 按 `Cmd + Shift + P`（或 `Ctrl + Shift + P`）
3. 输入：`vscode-remote://ssh-remote+10.3.0.12:8443/root`
4. 输入密码：`Minimax2024!Secure`

---

### 方案 2：通过浏览器访问 Web 版

1. 访问：`http://129.226.204.202:8443/`
2. 输入密码：`Minimax2024!Secure`
3. 点击 "Login"

---

## 🔧 配置 Minimax API

### 步骤 1：安装 AI 扩展

在 VS Code 中，安装以下任意一个扩展：

**推荐扩展：**
1. **CodeGPT** - 最流行
   - 扩展 ID：`CodeGPT.dt`
   - 支持自定义 OpenAI 兼容 API

2. **Continue** - AI 自动补全
   - 扩展 ID：`continue.continue`

3. **Bito** - AI 编程助手
   - 扩展 ID：`Bito.bito`

### 步骤 2：配置 API 密钥

#### 在 CodeGPT 中配置：

1. 打开 VS Code 设置（`Ctrl + ,`）
2. 搜索 "CodeGPT"
3. 配置以下设置：

```json
{
  "ApiKey": "YOUR_MINIMAX_API_KEY",
  "ApiBase": "https://api.minimax.chat/v1",
  "Model": "minimax-chat-ablation5",
  "MaxTokens": 4096,
  "Temperature": 0.7
}
```

#### 在 Continue 中配置：

1. 打开 VS Code 设置
2. 搜索 "Continue"
3. 配置以下设置：

```json
{
  "models": [
    {
      "title": "Minimax Chat",
      "provider": "openai",
      "model": "minimax-chat-ablation5",
      "apiKey": "YOUR_MINIMAX_API_KEY",
      "apiBase": "https://api.minimax.chat/v1"
    }
  ]
}
```

---

## 📋 Minimax API 信息

### API 端点

```bash
# 聊天 API
https://api.minimax.chat/v1/chat/completions

# 嵌入 API
https://api.minimax.chat/v1/embeddings
```

### 支持的模型

| 模型名称 | 用途 | 最大 Token |
|----------|------|------------|
| `minimax-chat-ablation5` | 对话 | 4096 |
| `minimax-chat-ablation6` | 对话 | 8192 |
| `minimax-text-01` | 文本生成 | 4096 |
| `minimax-playground-pro` | 高级对话 | 16384 |

### API 调用示例

```bash
curl -X POST https://api.minimax.chat/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "minimax-chat-ablation5",
    "messages": [
      {
        "role": "user",
        "content": "你好，请帮我写一个 Node.js 服务器"
      }
    ],
    "temperature": 0.7,
    "top_p": 1
  }'
```

---

## 🗂️ 推荐项目结构

连接服务器后，项目位于：`/root/potato-dungeon/`

### 快速打开项目

1. 连接到 VS Code Server（见上方）
2. 打开文件夹：`/root/potato-dungeon/`
3. 在 VS Code 中打开：
   - `土豆地城/frontend/` - 前端项目
   - `土豆地城/backend/` - 后端项目
   - `土豆地城/kanban-board/` - 看板项目

---

## 🎨 推荐配置

### VS Code 设置

```json
{
  "editor.fontSize": 16,
  "editor.tabSize": 4,
  "editor.wordWrap": "on",
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "terminal.integrated.fontSize": 14
}
```

### VS Code 推荐插件

除了 AI 插件，这些也很有用：

1. **ES7+ JavaScript/React**
   - JavaScript 语法高亮和代码补全
   
2. **Prettier - Code formatter**
   - 代码格式化

3. **GitLens**
   - Git 增强功能

4. **Auto Rename Tag**
   - 自动重命名 HTML/XML 标签

---

## 🔐 安全建议

1. **修改默认密码**
   ```bash
   vim /opt/vscode-server/.env
   # 修改 PASSWORD=Minimax2024!Secure
   systemctl restart vscode-server
   ```

2. **启用 SSH 密钥认证**
   ```bash
   # 在本地生成 SSH 密钥
   ssh-keygen -t rsa
   
   # 将公钥复制到服务器
   ssh-copy-id root@129.226.204.202
   ```

3. **限制 VS Code Server 访问**
   - 只允许必要 IP 访问
   - 使用防火墙规则

---

## 📊 服务状态

查看服务状态：
```bash
systemctl status vscode-server
```

查看日志：
```bash
journalctl -u vscode-server -f
```

重启服务：
```bash
systemctl restart vscode-server
```

停止服务：
```bash
systemctl stop vscode-server
```

---

## 💡 使用技巧

1. **多标签页开发**
   - 在 VS Code Server 中打开多个项目
   - 每个项目一个标签页

2. **VS Code 终端**
   - 使用集成的终端运行命令
   - 避免 SSH 登录/登出

3. **Git 集成**
   - 使用 VS Code 的 Git 界面提交代码
   - 查看 diff、提交、推送

4. **代码导航**
   - 使用 `Ctrl + P` 快速搜索文件
   - 使用 `Ctrl + Shift + F` 全局搜索
   - 使用 `F12` 跳转到定义

---

## 🐛 故障排除

### 无法连接 VS Code Server

1. **检查服务状态**
   ```bash
   systemctl status vscode-server
   ```

2. **检查端口**
   ```bash
   netstat -tlnp | grep 8443
   ```

3. **检查防火墙**
   ```bash
   firewall-cmd --list-ports
   ```

4. **查看日志**
   ```bash
   journalctl -u vscode-server -n 50
   ```

### Minimax API 配置无效

1. **验证 API Key**
   ```bash
   curl -X POST https://api.minimax.chat/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{"model":"minimax-chat-ablation5","messages":[{"role":"user","content":"test"}]}'
   ```

2. **检查扩展配置**
   - 确认 API Base URL 正确
   - 确认模型名称拼写正确
   - 重启 VS Code

---

## 📞 获取帮助

如果遇到问题：

1. 查看 Minimax API 文档：`https://www.minimax.chat/document`
2. 查看 VS Code 文档：`https://code.visualstudio.com/docs`
3. 查看 AI 扩展文档：各扩展的 GitHub 仓库

---

**配置完成后，你就可以在服务器上愉快地编程了！** 🚀

**记住：** 
- VS Code Server 地址：`http://129.226.204.202:8443/`
- 密码：`Minimax2024!Secure`
- Minimax API：需要你提供 API Key
