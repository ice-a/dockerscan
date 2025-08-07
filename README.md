# DockerScan - Docker镜像检测工具

[![Vercel](https://img.shields.io/badge/Vercel-Ready-black?logo=vercel)](https://vercel.com)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Ready-orange?logo=cloudflare)](https://pages.cloudflare.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com)

## 项目介绍

DockerScan是一个用于检测和分析Docker镜像的Web工具，帮助用户选择最适合的Docker镜像源，提高下载速度和稳定性。该工具提供了直观的界面，显示各个镜像源的响应时间、状态和配置指南。

## 功能特点

- 实时检测多个Docker镜像源的可用性和响应时间
- 提供详细的镜像源信息，包括提供商、地理位置等
- 自动生成不同操作系统(Windows, Mac, Linux)的Docker配置指南
- 支持一键复制配置内容
- 响应式设计，适配各种设备屏幕

## 技术栈

- 前端框架: Vue 3
- 构建工具: Vite
- UI组件库: Ant Design Vue
- HTTP客户端: Axios
- 部署平台: Vercel, Cloudflare Pages
- 容器化: Docker, Nginx

## 本地开发

### 前提条件

- Node.js 16.x 或更高版本
- npm 或 yarn

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/yourusername/dev_docker.git
cd dev_docker
```

2. 安装依赖

```bash
npm install
# 或
yarn
```

3. 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

4. 在浏览器中访问 `http://localhost:5173`

## 构建生产版本

```bash
npm run build
# 或
yarn build
```

构建后的文件将生成在 `dist` 目录中。

## Docker部署

### 使用Docker Compose

```bash
docker-compose up -d
```

应用将在 `http://localhost:8080` 上运行。

### 手动构建和运行Docker镜像

```bash
# 构建镜像
docker build -t dockerscan .

# 运行容器
docker run -d -p 8080:80 --name dockerscan-app dockerscan
```

## 部署到云平台

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fdev_docker)

1. 将代码推送到GitHub仓库
2. 在Vercel上导入项目
3. 选择默认设置并部署

### Cloudflare Pages

1. 将代码推送到GitHub或GitLab仓库
2. 在Cloudflare Pages中创建新项目
3. 连接到你的仓库
4. 设置构建命令为 `npm run build`
5. 设置构建输出目录为 `dist`
6. 部署

## 贡献指南

1. Fork 这个仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建一个Pull Request

## 许可证

[MIT](LICENSE)

## 联系方式

如有任何问题或建议，请通过以下方式联系我们：

- 电子邮件: 1943158197@qq.com
- GitHub Issues: [提交问题](https://github.com/ice-a/dockerscan/issues)
