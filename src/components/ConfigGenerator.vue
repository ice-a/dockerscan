<template>
  <div class="config-generator">
    <div class="header">
      <h1>Docker 镜像加速配置生成器</h1>
      <p class="subtitle">选择可用的镜像加速服务，生成对应平台的配置</p>
    </div>

    <div class="config-section">
      <h2>1. 选择镜像加速服务</h2>
      <div class="service-selector">
        <div class="select-all">
          <label>
            <input
              type="checkbox"
              v-model="selectAll"
              @change="toggleSelectAll"
            />
            全选/取消全选
          </label>
        </div>

        <div class="services-list">
          <div
            v-for="service in availableServices"
            :key="service.id"
            class="service-item"
          >
            <label>
              <input
                type="checkbox"
                v-model="selectedServices"
                :value="service"
              />
              <div class="service-info">
                <span class="service-name">{{ service.name }}</span>
                <span class="service-url">{{ service.url }}</span>
                <span class="response-time">{{ service.responseTime }}ms</span>
              </div>
            </label>
          </div>
        </div>

        <div class="selected-count">
          已选择 {{ selectedServices.length }} 个服务
        </div>
      </div>
    </div>

    <div class="config-section">
      <h2>2. 选择平台</h2>
      <div class="platform-selector">
        <label
          v-for="platform in platforms"
          :key="platform"
          class="platform-option"
        >
          <input
            type="radio"
            v-model="selectedPlatform"
            :value="platform"
          />
          <span>{{ platformConfigs[platform].name }}</span>
        </label>
      </div>
    </div>

    <div class="config-section" v-if="selectedServices.length > 0">
      <h2>3. 配置信息</h2>

      <div class="config-display">
        <h3>daemon.json 配置内容</h3>
        <pre class="config-content">{{ daemonConfig }}</pre>

        <div class="config-actions">
          <button @click="copyConfig" class="btn btn-primary">
            复制配置
          </button>
          <button @click="downloadConfig" class="btn btn-secondary">
            下载配置文件
          </button>
        </div>
      </div>

      <div class="instructions">
        <h3>配置步骤</h3>
        <ol>
          <li v-for="instruction in platformConfigs[selectedPlatform].instructions" :key="instruction">
            {{ instruction }}
          </li>
        </ol>

        <div class="command-section">
          <h4>一键配置命令</h4>
          <div class="command-box">
            <code>{{ configCommand }}</code>
            <button @click="copyCommand" class="btn-copy">复制</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="availableServices.length === 0" class="empty-state">
      <p>请先检测可用的镜像加速服务</p>
      <router-link to="/" class="btn btn-primary">去检测</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDockerStore } from '@/stores/docker'
import { platformConfigs, generateDaemonConfig, getDockerConfigCommand } from '@/config/platforms'
import type { Platform } from '@/config/platforms'
import type { DockerService } from '@/config/dockerServices'

const store = useDockerStore()
const availableServices = computed(() => store.availableServices)

const selectedServices = ref<DockerService[]>([])
const selectedPlatform = ref<Platform>('linux')
const platforms: Platform[] = ['windows', 'mac', 'linux']

const selectAll = computed({
  get: () => selectedServices.value.length === availableServices.value.length && availableServices.value.length > 0,
  set: (value: boolean) => {
    if (value) {
      selectedServices.value = [...availableServices.value]
    } else {
      selectedServices.value = []
    }
  }
})

const daemonConfig = computed(() => {
  const mirrors = selectedServices.value.map(service => service.url)
  return generateDaemonConfig(mirrors)
})

const configCommand = computed(() => {
  const mirrors = selectedServices.value.map(service => service.url)
  return getDockerConfigCommand(selectedPlatform.value, mirrors)
})

function toggleSelectAll() {
  // Handled by computed setter
}

async function copyConfig() {
  try {
    await navigator.clipboard.writeText(daemonConfig.value)
    alert('配置已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
  }
}

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(configCommand.value)
    alert('命令已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
  }
}

function downloadConfig() {
  const blob = new Blob([daemonConfig.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'daemon.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.config-generator {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.config-section {
  background: white;
  padding: 2rem;
  margin-bottom: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.config-section h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.service-selector {
  max-height: 400px;
  overflow-y: auto;
}

.select-all {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
}

.services-list {
  display: grid;
  gap: 0.5rem;
}

.service-item {
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.service-item:hover {
  background: #f8f9fa;
}

.service-item label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.service-item input[type="checkbox"] {
  margin-right: 1rem;
}

.service-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.service-name {
  font-weight: bold;
  color: #2c3e50;
}

.service-url {
  color: #6c757d;
  font-size: 0.9rem;
}

.response-time {
  color: #28a745;
  font-size: 0.8rem;
  font-weight: bold;
}

.selected-count {
  margin-top: 1rem;
  padding: 1rem;
  background: #e7f3ff;
  border-radius: 0.5rem;
  text-align: center;
  color: #0066cc;
}

.platform-selector {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.platform-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.platform-option:hover {
  border-color: #3498db;
}

.platform-option input[type="radio"] {
  margin: 0;
}

.platform-option input[type="radio"]:checked + span {
  color: #3498db;
  font-weight: bold;
}

.config-display {
  margin-bottom: 2rem;
}

.config-content {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}

.config-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.instructions {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.instructions h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.instructions ol {
  margin: 0;
  padding-left: 1.5rem;
}

.instructions li {
  margin-bottom: 0.5rem;
  color: #495057;
}

.command-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #e9ecef;
  border-radius: 0.5rem;
}

.command-section h4 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.command-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #212529;
  color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.command-box code {
  flex: 1;
  overflow-x: auto;
}

.btn-copy {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-copy:hover {
  background: #5a6268;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

@media (max-width: 768px) {
  .platform-selector {
    flex-direction: column;
  }

  .config-actions {
    flex-direction: column;
  }

  .command-box {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
