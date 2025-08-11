# Docker 镜像加速检测工具

一个基于 Vue 3 + Vite 开发的离线 Docker 镜像加速服务检测工具，支持批量检测、定时检测、响应时间排序和多平台配置生成。

## 功能特性

- ✅ **批量检测**：同时检测 50+ 个 Docker 镜像加速服务
- ✅ **定时检测**：支持设置自动检测间隔（1分钟、5分钟、10分钟、30分钟）
- ✅ **响应时间排序**：按响应时间排序，优先推荐快速服务
- ✅ **多平台支持**：支持 Windows、macOS、Linux 三大平台配置
- ✅ **一键配置**：提供一键配置命令和配置文件下载
- ✅ **离线使用**：无需网络连接即可检测本地配置
- ✅ **实时状态**：实时显示服务可用性和响应时间
- ✅ **响应式设计**：支持桌面端和移动端

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 下一代前端构建工具
- **Pinia** - Vue 状态管理库
- **Vue Router** - Vue.js 官方路由管理器

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发环境

```bash
npm run dev
```

访问 http://localhost:5173 查看应用

### 生产构建

```bash
npm run build
```

构建产物将输出到 `dist/` 目录

### 预览构建结果

```bash
npm run preview
```

## 使用说明

### 1. 镜像检测

1. 访问首页（镜像检测）
2. 点击"开始检测"按钮
3. 等待检测完成，查看可用服务列表
4. 可按响应时间排序，选择最快的服务

### 2. 配置生成

1. 切换到"配置生成"页面
2. 选择需要使用的镜像加速服务（可多选）
3. 选择对应的操作系统平台
4. 复制生成的配置或下载配置文件
5. 按照提供的步骤完成 Docker 配置

### 3. 定时检测

1. 在镜像检测页面选择自动检测间隔
2. 点击"开启自动检测"
3. 系统将按设定间隔自动检测服务状态

## 配置文件说明

生成的 `daemon.json` 文件示例：

```json
{
  "registry-mirrors": [
    "https://docker.020417.xyz",
    "https://registry.cyou",
    "https://docker.m.daocloud.io"
  ],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "max-download-attempts": 3
}
```

## 平台配置指南

### Windows

1. 打开 PowerShell（管理员权限）
2. 编辑配置文件：`notepad %USERPROFILE%\.docker\daemon.json`
3. 粘贴配置内容并保存
4. 重启 Docker 服务：`Restart-Service docker`

### macOS

1. 打开终端
2. 编辑配置文件：`nano ~/.docker/daemon.json`
3. 粘贴配置内容并保存（Ctrl+X, Y, Enter）
4. 重启 Docker：`killall Docker && open /Applications/Docker.app`

### Linux

1. 打开终端
2. 编辑配置文件：`sudo nano /etc/docker/daemon.json`
3. 粘贴配置内容并保存（Ctrl+X, Y, Enter）
4. 重启 Docker：`sudo systemctl restart docker`

## 项目结构

```
docker-mirror-checker/
├── src/
│   ├── components/          # 组件
│   │   ├── DockerMirrorChecker.vue  # 镜像检测组件
│   │   └── ConfigGenerator.vue      # 配置生成组件
│   ├── config/              # 配置
│   │   ├── dockerServices.ts        # 镜像服务配置
│   │   └── platforms.ts             # 平台配置
│   ├── stores/              # 状态管理
│   │   └── docker.ts                # Docker 状态管理
│   ├── views/               # 页面
│   │   ├── HomeView.vue             # 首页
│   │   ├── ConfigView.vue           # 配置页面
│   │   └── AboutView.vue            # 关于页面
│   ├── App.vue              # 根组件
│   └── main.ts              # 入口文件
├── public/                  # 静态资源
├── dist/                    # 构建产物
└── package.json             # 项目配置
```

## 镜像加速服务列表

当前支持检测的镜像加速服务包括：

- 官方服务：Docker 官方中国镜像、Azure 中国镜像
- 云服务：阿里云、腾讯云、华为云、百度云、京东云、七牛云
- 高校镜像：清华大学、中科大、上海交大、南京大学
- 第三方服务：DaoCloud、网易云、又拍云、1Panel 等
- 社区服务：木子、registry、dockerproxy 等 50+ 个服务

## 注意事项

- 检测结果仅供参考，实际使用效果可能因网络环境而异
- 建议定期检测以获取最新的服务状态
- 配置前请备份原有的 Docker 配置文件
- 部分服务可能需要特定的网络环境才能正常使用

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目！
