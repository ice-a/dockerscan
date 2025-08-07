<script setup>
import { ref, computed } from 'vue';
import { message } from 'ant-design-vue';

const props = defineProps({
  mirrors: {
    type: Array,
    required: true
  }
});

// 选择的操作系统
const selectedOS = ref('windows');

// 获取可用的镜像（状态为正常的镜像）
const availableMirrors = computed(() => {
  return props.mirrors.filter(mirror => 
    mirror.success === true && 
    (mirror.responseTime < 1000 || mirror.responseTime >= 1000) // 包括正常和缓慢的镜像
  ).sort((a, b) => a.responseTime - b.responseTime); // 按响应时间排序
});

// 选择的镜像
const selectedMirror = ref(null);

// 当有可用镜像时，默认选择第一个（响应最快的）
const initSelectedMirror = () => {
  if (availableMirrors.value.length > 0 && !selectedMirror.value) {
    selectedMirror.value = availableMirrors.value[0];
  }
};

// 监听可用镜像变化
computed(() => {
  initSelectedMirror();
  return availableMirrors.value;
});

// 选择镜像
const selectMirror = (mirror) => {
  selectedMirror.value = mirror;
};

// 复制配置到剪贴板
const copyConfig = () => {
  if (!selectedMirror.value) {
    message.warning('请先选择一个镜像');
    return;
  }
  
  const configText = getConfigText();
  navigator.clipboard.writeText(configText)
    .then(() => {
      message.success('配置已复制到剪贴板');
    })
    .catch(err => {
      message.error('复制失败: ' + err.message);
    });
};

// 根据选择的操作系统和镜像生成配置文本
const getConfigText = () => {
  if (!selectedMirror.value) return '';
  
  const mirrorUrl = selectedMirror.value.url;
  
  switch (selectedOS.value) {
    case 'windows':
      return getWindowsConfig(mirrorUrl);
    case 'mac':
      return getMacConfig(mirrorUrl);
    case 'linux':
      return getLinuxConfig(mirrorUrl);
    default:
      return '';
  }
};

// Windows 配置指南
const getWindowsConfig = (mirrorUrl) => {
  return `# Windows 下配置 Docker 镜像加速

1. 右键点击桌面右下角 Docker 图标，选择 "Settings"。
2. 在左侧导航栏选择 "Docker Engine"。
3. 在右侧 JSON 配置中找到 "registry-mirrors" 数组，如果没有则添加。
4. 添加镜像地址：

{
  "registry-mirrors": [
    "${mirrorUrl}"
  ]
}

5. 点击 "Apply & Restart" 按钮重启 Docker。
6. 重启后可以通过命令验证配置是否生效：
   docker info | findstr "Registry Mirrors"
`;
};

// Mac 配置指南
const getMacConfig = (mirrorUrl) => {
  return `# macOS 下配置 Docker 镜像加速

1. 点击桌面顶部状态栏的 Docker 图标，选择 "Preferences"。
2. 在左侧导航栏选择 "Docker Engine"。
3. 在右侧 JSON 配置中找到 "registry-mirrors" 数组，如果没有则添加。
4. 添加镜像地址：

{
  "registry-mirrors": [
    "${mirrorUrl}"
  ]
}

5. 点击 "Apply & Restart" 按钮重启 Docker。
6. 重启后可以通过命令验证配置是否生效：
   docker info | grep "Registry Mirrors"
`;
};

// Linux 配置指南
const getLinuxConfig = (mirrorUrl) => {
  return `# Linux 下配置 Docker 镜像加速

1. 创建或修改 Docker 守护进程配置文件：
   sudo mkdir -p /etc/docker
   sudo tee /etc/docker/daemon.json <<-'EOF'
   {
     "registry-mirrors": ["${mirrorUrl}"]
   }
   EOF

2. 重启 Docker 服务：
   sudo systemctl daemon-reload
   sudo systemctl restart docker

3. 验证配置是否生效：
   docker info | grep "Registry Mirrors"
`;
};
</script>

<template>
  <div class="cyber-config-guide">
    <div class="cyber-card">
      <div class="cyber-card-header">
        <div class="cyber-card-title">
          <span class="cyber-icon">⚙️</span> Docker 镜像配置向导
        </div>
      </div>
      
      <div class="cyber-guide-content">
        <!-- 操作系统选择 -->
        <div class="cyber-os-selector">
          <div class="cyber-section-title">选择您的操作系统</div>
          <div class="cyber-os-options">
            <div 
              class="cyber-os-option" 
              :class="{ 'active': selectedOS === 'windows' }"
              @click="selectedOS = 'windows'"
            >
              <span class="cyber-os-icon">🪟</span>
              <span class="cyber-os-name">Windows</span>
            </div>
            <div 
              class="cyber-os-option" 
              :class="{ 'active': selectedOS === 'mac' }"
              @click="selectedOS = 'mac'"
            >
              <span class="cyber-os-icon">🍎</span>
              <span class="cyber-os-name">macOS</span>
            </div>
            <div 
              class="cyber-os-option" 
              :class="{ 'active': selectedOS === 'linux' }"
              @click="selectedOS = 'linux'"
            >
              <span class="cyber-os-icon">🐧</span>
              <span class="cyber-os-name">Linux</span>
            </div>
          </div>
        </div>
        
        <!-- 镜像选择 -->
        <div class="cyber-mirror-selector">
          <div class="cyber-section-title">选择镜像源 (按响应时间排序)</div>
          
          <div v-if="availableMirrors.length === 0" class="cyber-no-mirrors">
            <span class="cyber-warning-icon">⚠️</span> 没有可用的镜像，请先检测镜像可用性
          </div>
          
          <div v-else class="cyber-mirror-list">
            <div 
              v-for="mirror in availableMirrors" 
              :key="mirror.url"
              class="cyber-mirror-item"
              :class="{ 
                'active': selectedMirror && selectedMirror.url === mirror.url,
                'fast': mirror.responseTime < 500,
                'normal': mirror.responseTime >= 500 && mirror.responseTime < 1000,
                'slow': mirror.responseTime >= 1000
              }"
              @click="selectMirror(mirror)"
            >
              <div class="cyber-mirror-info">
                <div class="cyber-mirror-name">{{ mirror.name }}</div>
                <div class="cyber-mirror-provider">{{ mirror.provider }}</div>
              </div>
              <div class="cyber-mirror-stats">
                <div class="cyber-mirror-response">
                  {{ mirror.responseTime }}ms
                </div>
                <div class="cyber-mirror-status">
                  <span v-if="mirror.responseTime < 500" class="cyber-status-fast">极速</span>
                  <span v-else-if="mirror.responseTime < 1000" class="cyber-status-normal">正常</span>
                  <span v-else class="cyber-status-slow">缓慢</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 配置指南 -->
        <div class="cyber-config-instructions">
          <div class="cyber-section-title">配置指南</div>
          
          <div v-if="!selectedMirror" class="cyber-no-selection">
            <span class="cyber-warning-icon">ℹ️</span> 请先选择一个镜像源
          </div>
          
          <div v-else class="cyber-instructions">
            <div class="cyber-selected-mirror">
              <span class="cyber-label">已选镜像:</span>
              <span class="cyber-value">{{ selectedMirror.name }} ({{ selectedMirror.provider }})</span>
            </div>
            
            <div class="cyber-mirror-url">
              <span class="cyber-label">镜像地址:</span>
              <span class="cyber-value">{{ selectedMirror.url }}</span>
            </div>
            
            <div class="cyber-config-code">
              <pre><code>{{ getConfigText() }}</code></pre>
            </div>
            
            <div class="cyber-actions">
              <a-button type="primary" @click="copyConfig" class="cyber-button">
                <span class="cyber-button-icon">📋</span> 复制配置
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cyber-config-guide {
  margin-top: 2rem;
}

.cyber-guide-content {
  padding: 1.5rem;
}

.cyber-section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  position: relative;
}

.cyber-section-title::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, var(--primary-color), transparent);
}

/* 操作系统选择器 */
.cyber-os-selector {
  margin-bottom: 2rem;
}

.cyber-os-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.cyber-os-option {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.8rem 1.2rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.cyber-os-option.active {
  background: rgba(33, 150, 243, 0.1);
  border-color: var(--primary-color);
}

.cyber-os-icon {
  font-size: 1.5rem;
  margin-right: 0.8rem;
}

.cyber-os-name {
  font-weight: 500;
}

/* 镜像选择器 */
.cyber-mirror-selector {
  margin-bottom: 2rem;
}

.cyber-no-mirrors {
  background: rgba(255, 204, 0, 0.1);
  border: 1px solid rgba(255, 204, 0, 0.3);
  border-radius: 6px;
  padding: 1rem;
  color: var(--warning-color);
  display: flex;
  align-items: center;
}

.cyber-warning-icon {
  margin-right: 0.5rem;
  font-size: 1.2rem;
}

.cyber-mirror-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.cyber-mirror-list::-webkit-scrollbar {
  width: 6px;
}

.cyber-mirror-list::-webkit-scrollbar-track {
  background: rgba(20, 30, 50, 0.3);
  border-radius: 3px;
}

.cyber-mirror-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.cyber-mirror-list::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

.cyber-mirror-item {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.8rem 1rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.cyber-mirror-item.active {
  background: rgba(33, 150, 243, 0.1);
  border-color: var(--primary-color);
}

.cyber-mirror-item.fast {
  border-left: 3px solid var(--success-color);
}

.cyber-mirror-item.normal {
  border-left: 3px solid var(--primary-color);
}

.cyber-mirror-item.slow {
  border-left: 3px solid var(--warning-color);
}

.cyber-mirror-name {
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.cyber-mirror-provider {
  font-size: 0.85rem;
  opacity: 0.7;
}

.cyber-mirror-stats {
  text-align: right;
}

.cyber-mirror-response {
  font-family: 'Orbitron', monospace;
  font-weight: 500;
  margin-bottom: 0.3rem;
}

.cyber-status-fast {
  color: var(--success-color);
  font-size: 0.85rem;
  font-weight: 600;
}

.cyber-status-normal {
  color: var(--primary-color);
  font-size: 0.85rem;
  font-weight: 600;
}

.cyber-status-slow {
  color: var(--warning-color);
  font-size: 0.85rem;
  font-weight: 600;
}

/* 配置指南 */
.cyber-config-instructions {
  margin-bottom: 1rem;
}

.cyber-no-selection {
  background: rgba(127, 140, 141, 0.1);
  border: 1px solid rgba(127, 140, 141, 0.3);
  border-radius: 6px;
  padding: 1rem;
  color: #7f8c8d;
  display: flex;
  align-items: center;
}

.cyber-selected-mirror,
.cyber-mirror-url {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cyber-label {
  font-weight: 600;
  color: var(--primary-color);
  min-width: 80px;
}

.cyber-value {
  font-family: 'Courier New', monospace;
  background: #f9f9f9;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  word-break: break-all;
}
.cyber-config-code {
  background: #f5f5f5;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
}

.cyber-config-code pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Courier New', monospace;
  color: #002FA7; /* 克兰因蓝标准色值 */
  line-height: 1.5;
  /* 可选：增加文字阴影增强视觉效果 */
  text-shadow: 0 0 2px rgba(0, 47, 167, 0.3);
}

/* .cyber-config-code {
  background: #f5f5f5;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
}

.cyber-config-code pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Courier New', monospace;
  color: #e0e0ff;
  line-height: 1.5;
} */

.cyber-actions {
  display: flex;
  justify-content: flex-end;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .cyber-os-options {
    flex-direction: column;
  }
  
  .cyber-mirror-list {
    grid-template-columns: 1fr;
  }
}
</style>