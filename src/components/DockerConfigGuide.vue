<script setup>
import { ref, computed } from 'vue';
import { message } from 'ant-design-vue';

const props = defineProps({
  mirrors: {
    type: Array,
    required: true
  }
});

const selectedOS = ref('windows');
const selectedMirrors = ref([]);

const availableMirrors = computed(() => {
  return props.mirrors
    .filter(mirror => mirror.success === true)
    .sort((a, b) => {
      const performanceOrder = { 'excellent': 0, 'good': 1, 'poor': 2 };
      const aOrder = performanceOrder[a.performance] || 3;
      const bOrder = performanceOrder[b.performance] || 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.responseTime || Infinity) - (b.responseTime || Infinity);
    });
});

const initSelectedMirrors = () => {
  if (availableMirrors.value.length > 0 && selectedMirrors.value.length === 0) {
    selectedMirrors.value = [availableMirrors.value[0]];
  }
};

computed(() => {
  initSelectedMirrors();
  return availableMirrors.value;
});

const toggleMirror = (mirror) => {
  const index = selectedMirrors.value.findIndex(m => m.url === mirror.url);
  if (index >= 0) {
    selectedMirrors.value.splice(index, 1);
  } else {
    selectedMirrors.value.push(mirror);
  }
};

const copyConfig = () => {
  if (selectedMirrors.value.length === 0) {
    message.warning('请至少选择一个镜像');
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

const getConfigText = () => {
  if (selectedMirrors.value.length === 0) return '';
  
  const mirrorUrls = selectedMirrors.value.map(mirror => mirror.url);
  
  switch (selectedOS.value) {
    case 'windows':
      return getWindowsConfig(mirrorUrls);
    case 'mac':
      return getMacConfig(mirrorUrls);
    case 'linux':
      return getLinuxConfig(mirrorUrls);
    default:
      return '';
  }
};

const getWindowsConfig = (mirrorUrls) => {
  const urlsJson = JSON.stringify(mirrorUrls, null, 2);
  return `# Windows 下配置 Docker 镜像加速

1. 右键点击桌面右下角 Docker 图标，选择 "Settings"。
2. 在左侧导航栏选择 "Docker Engine"。
3. 在右侧 JSON 配置中找到 "registry-mirrors" 数组，如果没有则添加。
4. 添加镜像地址：

{
  "registry-mirrors": ${urlsJson}
}

5. 点击 "Apply & Restart" 按钮重启 Docker。
6. 重启后可以通过命令验证配置是否生效：
   docker info | findstr "Registry Mirrors"
`;
};

const getMacConfig = (mirrorUrls) => {
  const urlsJson = JSON.stringify(mirrorUrls, null, 2);
  return `# macOS 下配置 Docker 镜像加速

1. 点击桌面顶部状态栏的 Docker 图标，选择 "Preferences"。
2. 在左侧导航栏选择 "Docker Engine"。
3. 在右侧 JSON 配置中找到 "registry-mirrors" 数组，如果没有则添加。
4. 添加镜像地址：

{
  "registry-mirrors": ${urlsJson}
}

5. 点击 "Apply & Restart" 按钮重启动 Docker。
6. 重启后可以通过命令验证配置是否生效：
   docker info | grep "Registry Mirrors"
`;
};

const getLinuxConfig = (mirrorUrls) => {
  const urlsJson = JSON.stringify(mirrorUrls, null, 2);
  return `# Linux 下配置 Docker 镜像加速

1. 创建或修改 Docker 守护进程配置文件：
   sudo mkdir -p /etc/docker
   sudo tee /etc/docker/daemon.json <<-'EOF'
   {
     "registry-mirrors": ${urlsJson}
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
          <div class="cyber-section-title">选择镜像源 (按性能排序，可多选)</div>
          
          <div v-if="availableMirrors.length === 0" class="cyber-no-mirrors">
            <span class="cyber-warning-icon">�સ</span> 没有可用的镜像，请先检测镜像可用性
          </div>
          
          <div v-else class="cyber-mirror-list">
            <div 
              v-for="mirror in availableMirrors" 
              :key="mirror.url"
              class="cyber-mirror-item"
              :class="{ 
                'active': selectedMirrors.some(m => m.url === mirror.url),
                'excellent': mirror.performance === 'excellent',
                'good': mirror.performance === 'good',
                'poor': mirror.performance === 'poor'
              }"
              @click="toggleMirror(mirror)"
            >
              <div class="cyber-mirror-info">
                <div class="cyber-mirror-name">{{ mirror.name || '未知' }}</div>
                <div class="cyber-mirror-provider">{{ mirror.provider || '未知' }}</div>
              </div>
              <div class="cyber-mirror-stats">
                <div class="cyber-mirror-response">
                  {{ mirror.responseTime ? `${mirror.responseTime}ms` : '-' }}
                </div>
                <div :class="`cyber-status-${mirror.performance}`">
                  {{ mirror.performance ? mirror.performance.toUpperCase() : '未知' }}
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="selectedMirrors.length > 0" class="cyber-config-instructions">
            <div class="cyber-selected-mirror">
              <span class="cyber-label">已选镜像:</span>
              <span class="cyber-value">
                {{ selectedMirrors.map(m => `${m.name} (${m.provider})`).join(', ') }}
              </span>
            </div>
            
            <div class="cyber-mirror-url">
              <span class="cyber-label">镜像地址:</span>
              <span class="cyber-value">
                {{ selectedMirrors.map(m => m.url).join(', ') }}
              </span>
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
          
          <div v-else class="cyber-no-selection">
            <span class="cyber-warning-icon">⚠️</span> 请至少选择一个镜像
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 样式保持不变，复用之前的样式 */
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

.cyber-mirror-item.excellent {
  border-left: 3px solid #0cff70;
}

.cyber-mirror-item.good {
  border-left: 3px solid #00b8d4;
}

.cyber-mirror-item.poor {
  border-left: 3px solid #ffcc00;
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

.cyber-status-excellent {
  color: #0cff70;
  font-size: 0.85rem;
  font-weight: 600;
}

.cyber-status-good {
  color: #00b8d4;
  font-size: 0.85rem;
  font-weight: 600;
}

.cyber-status-poor {
  color: #ffcc00;
  font-size: 0.85rem;
  font-weight: 600;
}

.cyber-config-instructions {
  margin-bottom: 1rem;
}

.cyber-no-selection {
  background: rgba(127, 140, 141, 0.1);
  border: 1px solid rgba(127, 140, 141, 0.3);
  border-radius: 6px;
  padding: 1rem;
  color鬀: #7f8c8d;
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
  color: #002FA7;
  line-height: 1.5;
  text-shadow: 0 0 2px rgba(0, 47, 167, 0.3);
}

.cyber-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .cyber-os-options {
    flex-direction: column;
  }
  
  .cyber-mirror-list {
    grid-template-columns: 1fr;
  }
}
</style>