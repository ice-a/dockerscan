<template>
  <div class="about">
    <div class="about-container">
      <h1>关于 Docker 镜像加速检测工具</h1>

      <div class="about-content">
        <section class="about-section">
          <h2>项目介绍</h2>
          <p>
            Docker 镜像加速检测工具是一个基于 Vue 3 + Vite 开发的离线检测工具，
            专门用于检测 Docker 镜像加速服务的可用性和响应时间。
            该工具可以帮助用户快速找到可用的镜像加速服务，并生成对应平台的配置。
          </p>
        </section>

        <section class="about-section">
          <h2>功能特点</h2>
          <ul>
            <li><strong>批量检测：</strong>支持同时检测多个镜像加速服务</li>
            <li><strong>定时检测：</strong>可设置自动检测间隔，定时更新服务状态</li>
            <li><strong>响应时间排序：</strong>按照服务响应时间进行排序，优先推荐快速服务</li>
            <li><strong>多平台支持：</strong>支持 Windows、macOS、Linux 三大平台的配置生成</li>
            <li><strong>一键配置：</strong>提供一键配置命令和配置文件下载</li>
            <li><strong>离线使用：</strong>无需网络连接即可检测本地配置</li>
          </ul>
        </section>

        <section class="about-section">
          <h2>使用说明</h2>
          <ol>
            <li>访问"镜像检测"页面，点击"开始检测"按钮检测所有镜像加速服务</li>
            <li>查看检测结果，选择响应时间较快的可用服务</li>
            <li>切换到"配置生成"页面，选择需要使用的镜像加速服务</li>
            <li>选择对应的操作系统平台</li>
            <li>复制生成的配置内容或下载配置文件</li>
            <li>按照提供的步骤完成 Docker 配置</li>
          </ol>
        </section>

        <section class="about-section">
          <h2>技术栈</h2>
          <div class="tech-stack">
            <span class="tech-item">Vue 3</span>
            <span class="tech-item">TypeScript</span>
            <span class="tech-item">Vite</span>
            <span class="tech-item">Pinia</span>
            <span class="tech-item">Vue Router</span>
          </div>
        </section>

        <section class="about-section">
          <h2>注意事项</h2>
          <ul>
            <li>检测结果仅供参考，实际使用效果可能因网络环境而异</li>
            <li>建议定期检测以获取最新的服务状态</li>
            <li>配置前请备份原有的 Docker 配置文件</li>
            <li>部分服务可能需要特定的网络环境才能正常使用</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.about-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.about-container h1 {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  padding: 2rem;
  margin: 0;
  text-align: center;
}

.about-content {
  padding: 2rem;
}

.about-section {
  margin-bottom: 2rem;
}

.about-section:last-child {
  margin-bottom: 0;
}

.about-section h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #3498db;
}

.about-section p {
  color: #7f8c8d;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.about-section ul,
.about-section ol {
  color: #7f8c8d;
  line-height: 1.8;
  padding-left: 1.5rem;
}

.about-section li {
  margin-bottom: 0.5rem;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.tech-item {
  background: #3498db;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.9rem;
  font-weight: bold;
}

@media (max-width: 768px) {
  .about {
    padding: 1rem;
  }

  .about-container {
    border-radius: 0.5rem;
  }

  .about-container h1 {
    padding: 1.5rem;
    font-size: 1.5rem;
  }

  .about-content {
    padding: 1.5rem;
  }
}
</style>
