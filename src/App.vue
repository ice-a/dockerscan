<template>
  <div class="app-container">
    <div class="header">
      <h1>🐳 Docker 镜像检测器</h1>
      <p class="subtitle">检测镜像加速服务可用性并生成配置</p>
    </div>

    <div class="main-content">
      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="controls">
          <el-button type="primary" @click="startDetection" :loading="isChecking" v-if="!isChecking">
            🔍 开始检测所有服务
          </el-button>
          <el-button type="danger" @click="stopDetection" v-else>
            ⏹ 停止检测
          </el-button>
          
          <el-button @click="copyConfig" :disabled="availableServices.length === 0">
            📋 复制可用配置
          </el-button>
          
          <el-button @click="downloadConfig" :disabled="availableServices.length === 0">
            💾 下载配置
          </el-button>
        </div>

        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">{{ services.length }}</div>
            <div class="stat-label">总服务</div>
          </div>
          <div class="stat-item">
            <div class="stat-number available">{{ availableServices.length }}</div>
            <div class="stat-label">可用</div>
          </div>
          <div class="stat-item">
            <div class="stat-number checking">{{ checkingCount }}</div>
            <div class="stat-label">检测中</div>
          </div>
          <div class="stat-item">
            <div class="stat-number unavailable">{{ services.length - availableServices.length - checkingCount }}</div>
            <div class="stat-label">不可用</div>
          </div>
        </div>
      </div>

      <!-- 服务列表 -->
      <div class="services-section">
        <div class="section-header">
          <h2>服务列表</h2>
          <el-input
            v-model="searchQuery"
            placeholder="搜索服务名称或提供商..."
            style="width: 300px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="services-grid">
          <el-card 
            v-for="service in filteredServices" 
            :key="service.id"
            class="service-card"
            :class="{
              'status-available': service.status === 'available',
              'status-unavailable': service.status === 'unavailable',
              'status-checking': service.status === 'checking'
            }"
          >
            <div class="card-header">
              <div class="service-name">{{ service.name }}</div>
              <el-tag 
                :type="getStatusType(service.status)"
                size="small"
                effect="dark"
              >
                {{ getStatusText(service.status) }}
              </el-tag>
            </div>

            <div class="service-info">
              <div class="info-item">
                <span class="label">提供商：</span>
                <span class="value">{{ service.provider }}</span>
              </div>
              <div class="info-item">
                <span class="label">URL：</span>
                <span class="value url">{{ service.url }}</span>
              </div>
              <div class="info-item" v-if="service.description">
                <span class="label">描述：</span>
                <span class="value">{{ service.description }}</span>
              </div>
              <div class="info-item" v-if="service.responseTime">
                <span class="label">响应时间：</span>
                <span class="value">{{ service.responseTime }}ms</span>
              </div>
              <div class="info-item" v-if="service.lastChecked">
                <span class="label">最后检测：</span>
                <span class="value">{{ formatTime(service.lastChecked) }}</span>
              </div>
            </div>

            <div class="card-actions">
              <el-button 
                size="small" 
                :type="service.status === 'available' ? 'success' : 'primary'"
                @click="checkService(service)"
                :loading="service.status === 'checking'"
                :disabled="service.status === 'checking'"
              >
                {{ service.status === 'checking' ? '检测中' : '重新检测' }}
              </el-button>
              
              <el-button 
                size="small" 
                @click="copyServiceConfig(service)"
                :disabled="service.status !== 'available'"
              >
                复制配置
              </el-button>
              
              <el-button 
                size="small" 
                type="warning"
                @click="testService(service)"
                :disabled="service.status !== 'available'"
              >
                测试连接
              </el-button>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 配置预览 -->
      <div class="config-section" v-if="availableServices.length > 0">
        <div class="section-header">
          <h2>生成的配置</h2>
          <div class="config-actions">
            <el-button size="small" @click="copyConfig">
              复制全部
            </el-button>
            <el-button size="small" @click="downloadConfig">
              下载
            </el-button>
          </div>
        </div>
        <el-input
          v-model="configPreview"
          type="textarea"
          :rows="10"
          readonly
          class="config-textarea"
        ></el-input>
      </div>
    </div>

    <!-- 结果弹窗 -->
    <el-dialog
      v-model="resultDialog.visible"
      :title="resultDialog.title"
      width="500px"
      destroy-on-close
    >
      <div class="result-content">
        <div class="result-message">{{ resultDialog.message }}</div>
        <div v-if="resultDialog.details" class="result-details">
          <pre>{{ resultDialog.details }}</pre>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resultDialog.visible = false">关闭</el-button>
          <el-button 
            v-if="resultDialog.copyContent" 
            type="primary" 
            @click="copyResultContent"
          >
            复制
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { dockerServices } from '../dockerServices.ts'

const services = ref([...dockerServices])
const searchQuery = ref('')
const isChecking = ref(false)
const abortController = ref(null)

const resultDialog = ref({
  visible: false,
  title: '',
  message: '',
  details: '',
  copyContent: ''
})

// 过滤服务
const filteredServices = computed(() => {
  if (!searchQuery.value) return services.value
  
  const query = searchQuery.value.toLowerCase()
  return services.value.filter(service => 
    service.name.toLowerCase().includes(query) ||
    service.provider.toLowerCase().includes(query) ||
    service.url.toLowerCase().includes(query)
  )
})

// 可用服务
const availableServices = computed(() => {
  return services.value.filter(s => s.status === 'available')
})

// 检测中的服务数量
const checkingCount = computed(() => {
  return services.value.filter(s => s.status === 'checking').length
})

// 格式化时间
const formatTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'available': return 'success'
    case 'unavailable': return 'danger'
    case 'checking': return 'info'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'available': return '可用'
    case 'unavailable': return '不可用'
    case 'checking': return '检测中'
    default: return '未知'
  }
}

// 检测单个服务
const checkService = async (service) => {
  service.status = 'checking'
  service.responseTime = undefined
  service.lastChecked = new Date()

  try {
    const startTime = Date.now()
    
    // 使用 fetch 检测服务可用性
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(`${service.url}/v2/`, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    // 检查响应状态
    if (response.ok || response.status === 401 || response.status === 403) {
      // 401/403 也可能是有效的镜像源
      service.status = 'available'
      service.responseTime = responseTime
      ElMessage.success(`${service.name} 可用 (${responseTime}ms)`)
    } else {
      service.status = 'unavailable'
      ElMessage.warning(`${service.name} 不可用 (状态码: ${response.status})`)
    }
  } catch (error) {
    console.error(`检测 ${service.name} 失败:`, error)
    service.status = 'unavailable'
    ElMessage.error(`${service.name} 检测失败`)
  } finally {
    service.lastChecked = new Date()
  }
}

// 开始批量检测
const startDetection = async () => {
  if (isChecking.value) return
  
  isChecking.value = true
  abortController.value = new AbortController()
  
  ElMessage.info('开始检测所有服务，这可能需要几分钟时间...')
  
  // 顺序检测，避免并发过多导致问题
  for (const service of services.value) {
    if (abortController.value.signal.aborted) {
      ElMessage.warning('检测已停止')
      break
    }
    
    await checkService(service)
    
    // 添加小延迟，避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  isChecking.value = false
  abortController.value = null
  
  const availableCount = availableServices.value.length
  if (availableCount > 0) {
    ElMessage.success(`检测完成！发现 ${availableCount} 个可用服务`)
  } else {
    ElMessage.warning('检测完成，未发现可用服务')
  }
}

// 停止检测
const stopDetection = () => {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  isChecking.value = false
  
  // 重置正在检测的服务状态
  services.value.forEach(service => {
    if (service.status === 'checking') {
      service.status = undefined
    }
  })
  
  ElMessage.info('检测已停止')
}

// 生成配置文本
const generateConfig = () => {
  if (availableServices.value.length === 0) {
    return '# 暂无可用的镜像源'
  }
  
  let config = '# Docker 镜像加速服务配置\n'
  config += '# 生成时间: ' + new Date().toLocaleString('zh-CN') + '\n\n'
  
  availableServices.value.forEach(service => {
    config += `# ${service.name} (${service.provider})\n`
    config += `# 响应时间: ${service.responseTime}ms\n`
    config += `# 最后检测: ${formatTime(service.lastChecked)}\n`
    config += `${service.url}\n\n`
  })
  
  config += '# 使用方法:\n'
  config += '# 1. 编辑 /etc/docker/daemon.json (Linux)\n'
  config += '# 2. 添加以下内容:\n'
  config += '# {\n'
  config += '#   "registry-mirrors": [\n'
  availableServices.value.forEach((service, index) => {
    config += `#     "${service.url}"${index < availableServices.value.length - 1 ? ',' : ''}\n`
  })
  config += '#   ]\n'
  config += '# }\n'
  config += '# 3. 重启 Docker: sudo systemctl restart docker\n'
  
  return config
}

// 配置预览
const configPreview = computed(() => {
  return generateConfig()
})

// 复制配置
const copyConfig = async () => {
  const config = generateConfig()
  
  try {
    await navigator.clipboard.writeText(config)
    ElMessage.success('配置已复制到剪贴板')
    
    resultDialog.value = {
      visible: true,
      title: '配置复制成功',
      message: 'Docker 镜像源配置已复制到剪贴板',
      details: config,
      copyContent: config
    }
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 下载配置
const downloadConfig = () => {
  const config = generateConfig()
  const blob = new Blob([config], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `docker-mirrors-${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('配置文件已下载')
}

// 复制单个服务配置
const copyServiceConfig = async (service) => {
  const config = `${service.url}  # ${service.name} (${service.provider})`
  
  try {
    await navigator.clipboard.writeText(config)
    ElMessage.success(`${service.name} 配置已复制`)
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 测试服务连接
const testService = (service) => {
  if (service.status !== 'available') {
    ElMessage.warning('服务不可用，无法测试')
    return
  }
  
  // 在新标签页中打开服务URL，用于手动测试
  window.open(service.url, '_blank')
  ElMessage.info('已在新标签页中打开服务URL')
}

// 复制结果内容
const copyResultContent = async () => {
  if (!resultDialog.value.copyContent) return
  
  try {
    await navigator.clipboard.writeText(resultDialog.value.copyContent)
    ElMessage.success('内容已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 页面加载时自动检测一次
onMounted(() => {
  // 可以选择是否自动开始检测
  // startDetection()
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: transparent;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 8px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}

.main-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

/* 控制面板 */
.control-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  color: white;
}

.controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.controls .el-button {
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

.controls .el-button:hover {
  transform: translateY(-2px);
}

.stats {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  min-width: 80px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1.2;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.stat-number.available { color: #67c23a; }
.stat-number.checking { color: #909399; }
.stat-number.unavailable { color: #f56c6c; }

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 4px;
}

/* 服务部分 */
.services-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-header h2 {
  margin: 0;
  color: #333;
}

/* 服务网格 */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.service-card {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.service-card.status-available {
  border-color: #67c23a;
  background: linear-gradient(to bottom right, #f0f9ff, #e8f5e9);
}

.service-card.status-unavailable {
  border-color: #f56c6c;
  background: linear-gradient(to bottom right, #fff5f5, #ffebee);
  opacity: 0.8;
}

.service-card.status-checking {
  border-color: #909399;
  background: linear-gradient(to bottom right, #f5f5f5, #e0e0e0);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.service-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.service-info {
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  margin-bottom: 6px;
  line-height: 1.4;
}

.label {
  font-weight: 600;
  color: #666;
  min-width: 70px;
  flex-shrink: 0;
}

.value {
  color: #333;
  flex: 1;
  word-break: break-all;
}

.value.url {
  font-family: 'Courier New', monospace;
  color: #409eff;
  font-size: 0.85rem;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-actions .el-button {
  flex: 1;
  min-width: 80px;
}

/* 配置部分 */
.config-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.config-textarea {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  background: #fff;
}

.config-actions {
  display: flex;
  gap: 8px;
}

/* 结果弹窗 */
.result-content {
  line-height: 1.6;
}

.result-message {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.result-details {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  max-height: 300px;
  overflow-y: auto;
}

.result-details pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.85rem;
  line-height: 1.4;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header h1 {
    font-size: 1.8rem;
  }
  
  .services-grid {
    grid-template-columns: 1fr;
  }
  
  .controls {
    flex-direction: column;
  }
  
  .controls .el-button {
    width: 100%;
  }
  
  .stats {
    gap: 10px;
  }
  
  .stat-item {
    min-width: 60px;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .section-header .el-input {
    width: 100% !important;
  }
}
</style>
