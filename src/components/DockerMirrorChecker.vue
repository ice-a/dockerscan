<template>
  <div class="docker-mirror-checker">
    <div class="header">
      <h1>Docker 镜像加速检测工具</h1>
      <p class="subtitle">批量检测 Docker 镜像加速服务的可用性和响应时间</p>
    </div>

    <div class="controls">
      <div class="control-group">
        <button
          @click="checkAllServices"
          :disabled="isChecking"
          class="btn btn-primary"
        >
          <span v-if="isChecking" class="loading-spinner"></span>
          {{ isChecking ? '检测中...' : '开始检测' }}
        </button>

        <button
          @click="toggleAutoCheck"
          :class="['btn', autoCheckEnabled ? 'btn-warning' : 'btn-secondary']"
        >
          {{ autoCheckEnabled ? '停止自动检测' : '开启自动检测' }}
        </button>

        <button
          @click="resetResults"
          class="btn btn-outline"
        >
          重置结果
        </button>
      </div>

      <div class="control-group">
        <label>
          自动检测间隔:
          <select v-model="selectedInterval" class="select">
            <option value="60000">1分钟</option>
            <option value="300000">5分钟</option>
            <option value="600000">10分钟</option>
            <option value="1800000">30分钟</option>
          </select>
        </label>
      </div>
    </div>

    <div class="stats" v-if="lastCheckTime">
      <div class="stat-card">
        <h3>{{ availableServices.length }}</h3>
        <p>可用服务</p>
      </div>
      <div class="stat-card">
        <h3>{{ unavailableServices.length }}</h3>
        <p>不可用服务</p>
      </div>
      <div class="stat-card">
        <h3>{{ checkingServices.length }}</h3>
        <p>检测中</p>
      </div>
      <div class="stat-card">
        <h3>{{ lastCheckTime ? lastCheckTime.toLocaleTimeString() : '从未' }}</h3>
        <p>最后检测</p>
      </div>
    </div>

    <div class="services-grid">
      <div
        v-for="service in sortedServices"
        :key="service.id"
        :class="['service-card', service.status]"
      >
        <div class="service-header">
          <h3>{{ service.name }}</h3>
          <span :class="['status-badge', service.status]">
            {{ getStatusText(service.status) }}
          </span>
        </div>

        <p class="service-provider">{{ service.provider }}</p>
        <p class="service-description">{{ service.description }}</p>

        <div class="service-url">
          <a :href="service.url" target="_blank" rel="noopener noreferrer">
            {{ service.url }}
          </a>
        </div>

        <div class="service-metrics" v-if="service.responseTime">
          <span class="response-time">
            响应时间: {{ service.responseTime }}ms
          </span>
          <span class="last-checked" v-if="service.lastChecked">
            检测时间: {{ formatTime(service.lastChecked) }}
          </span>
        </div>

        <button
          @click="checkSingleService(service)"
          :disabled="service.status === 'checking'"
          class="btn-check-single"
        >
          {{ service.status === 'checking' ? '检测中...' : '重新检测' }}
        </button>
      </div>
    </div>

    <div v-if="services.length === 0" class="empty-state">
      <p>暂无镜像加速服务数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDockerStore } from '@/stores/docker'
import type { DockerService } from '@/config/dockerServices'

const store = useDockerStore()

const {
  services,
  isChecking,
  lastCheckTime,
  availableServices,
  unavailableServices,
  checkingServices
} = store

const autoCheckEnabled = computed(() => store.checkInterval !== null)
const selectedInterval = computed({
  get: () => store.autoCheckInterval,
  set: (value: number) => {
    store.autoCheckInterval = value
    if (autoCheckEnabled.value) {
      store.startAutoCheck(value)
    }
  }
})

const sortedServices = computed(() => {
  return [...services].sort((a, b) => {
    // First sort by status: checking -> available -> unavailable -> undefined
    const statusOrder = { checking: 0, available: 1, unavailable: 2, undefined: 3 }
    const aOrder = statusOrder[a.status || 'undefined']
    const bOrder = statusOrder[b.status || 'undefined']

    if (aOrder !== bOrder) return aOrder - bOrder

    // Then sort by response time for available services
    if (a.status === 'available' && b.status === 'available') {
      return (a.responseTime || Infinity) - (b.responseTime || Infinity)
    }

    return 0
  })
})

function getStatusText(status?: string): string {
  switch (status) {
    case 'available':
      return '可用'
    case 'unavailable':
      return '不可用'
    case 'checking':
      return '检测中'
    default:
      return '未检测'
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString()
}

async function checkAllServices() {
  await store.checkAllServices()
}

async function checkSingleService(service: DockerService) {
  await store.checkService(service)
}

function toggleAutoCheck() {
  if (autoCheckEnabled.value) {
    store.stopAutoCheck()
  } else {
    store.startAutoCheck()
  }
}

function resetResults() {
  store.resetServices()
}

// Auto-start checking on mount
checkAllServices()
</script>

<style scoped>
.docker-mirror-checker {
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

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.control-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e67e22;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-outline {
  background: transparent;
  color: #3498db;
  border: 2px solid #3498db;
}

.btn-outline:hover {
  background: #3498db;
  color: white;
}

.select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 1rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  color: #2c3e50;
  margin: 0;
  font-size: 2rem;
}

.stat-card p {
  color: #7f8c8d;
  margin: 0.5rem 0 0 0;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.service-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.service-header h3 {
  margin: 0;
  color: #2c3e50;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: bold;
}

.status-badge.available {
  background: #d5f4e6;
  color: #27ae60;
}

.status-badge.unavailable {
  background: #fadbd8;
  color: #e74c3c;
}

.status-badge.checking {
  background: #fef9e7;
  color: #f39c12;
}

.service-provider {
  color: #3498db;
  font-weight: bold;
  margin: 0.5rem 0;
}

.service-description {
  color: #7f8c8d;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.service-url {
  margin: 0.5rem 0;
}

.service-url a {
  color: #3498db;
  text-decoration: none;
  font-size: 0.875rem;
}

.service-url a:hover {
  text-decoration: underline;
}

.service-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 1rem 0;
  font-size: 0.875rem;
  color: #7f8c8d;
}

.btn-check-single {
  width: 100%;
  padding: 0.5rem;
  background: #ecf0f1;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-check-single:hover:not(:disabled) {
  background: #bdc3c7;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .control-group {
    justify-content: center;
  }

  .services-grid {
    grid-template-columns: 1fr;
  }
}
</style>
