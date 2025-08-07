<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { getAllMirrors, searchMirrors } from './utils/mirrorData';
import { batchCheckMirrors } from './utils/dockerService';
import { message } from 'ant-design-vue';
import { CopyOutlined } from '@ant-design/icons-vue';
import DockerConfigGuide from './components/DockerConfigGuide.vue';

// 数据状态
const mirrors = ref([]);
const loading = ref(false);
const searchKeyword = ref('');
const selectedProvider = ref('');
const autoCheckEnabled = ref(false);
const autoCheckInterval = ref(null);
const autoCheckCountdown = ref(60);

// 页面状态
const showConfigGuide = ref(false);

// 镜像状态统计
const mirrorStats = computed(() => {
  const total = filteredMirrors.value.length;
  const normal = filteredMirrors.value.filter(m => m.success === true && m.responseTime < 1000).length;
  const slow = filteredMirrors.value.filter(m => m.success === true && m.responseTime >= 1000).length;
  const error = filteredMirrors.value.filter(m => m.success === false).length;
  const untested = filteredMirrors.value.filter(m => m.success === undefined).length;
  
  return { total, normal, slow, error, untested };
});

// 筛选后的镜像列表
const filteredMirrors = computed(() => {
  let result = mirrors.value;
  
  if (searchKeyword.value) {
    result = result.filter(mirror => 
      mirror.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      mirror.provider.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      mirror.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
  }
  
  if (selectedProvider.value) {
    result = result.filter(mirror => 
      mirror.provider === selectedProvider.value
    );
  }
  
  return result;
});

// 获取所有提供商列表（用于筛选）
const providers = computed(() => {
  const providerSet = new Set(mirrors.value.map(mirror => mirror.provider));
  return Array.from(providerSet);
});

// 加载镜像数据
const loadMirrors = async () => {
  mirrors.value = getAllMirrors();
};

// 检测镜像可用性
const checkMirrors = async () => {
  loading.value = true;
  try {
    // 只检测筛选后的镜像
    const mirrorsToCheck = filteredMirrors.value;
    const results = await batchCheckMirrors(mirrorsToCheck);
    
    // 更新检测结果
    mirrors.value = mirrors.value.map(mirror => {
      const result = results.find(r => r.url === mirror.url);
      if (result) {
        return { ...mirror, ...result };
      }
      return mirror;
    });
    
    // 检测完成后自动排序
    sortMirrors();
    
    message.success('检测完成并已自动排序');
  } catch (error) {
    console.error('检测失败:', error);
    message.error('检测失败: ' + error.message);
  } finally {
    loading.value = false;
  }
};

// 一键检测所有镜像
const checkAllMirrors = async () => {
  // 重置筛选条件，确保检测所有镜像
  resetFilters();
  await checkMirrors();
  // 注意：checkMirrors 函数中已经包含了自动排序功能
};

// 复制镜像地址到剪贴板
const copyMirrorUrl = (url) => {
  navigator.clipboard.writeText(url)
    .then(() => {
      message.success('已复制到剪贴板');
    })
    .catch(err => {
      message.error('复制失败: ' + err.message);
    });
};

// 切换自动检测
const toggleAutoCheck = () => {
  if (autoCheckEnabled.value) {
    // 关闭自动检测
    stopAutoCheck();
  } else {
    // 开启自动检测
    startAutoCheck();
  }
};

// 开始自动检测
const startAutoCheck = () => {
  autoCheckEnabled.value = true;
  autoCheckCountdown.value = 60;
  
  // 创建倒计时定时器
  const countdownTimer = setInterval(() => {
    autoCheckCountdown.value -= 1;
    
    if (autoCheckCountdown.value <= 0) {
      // 执行检测（checkMirrors 函数中已包含自动排序功能）
      checkMirrors();
      // 重置倒计时
      autoCheckCountdown.value = 60;
    }
  }, 1000);
  
  autoCheckInterval.value = countdownTimer;
  message.info('已开启自动检测，每60秒检测一次并自动排序');
};

// 停止自动检测
const stopAutoCheck = () => {
  if (autoCheckInterval.value) {
    clearInterval(autoCheckInterval.value);
    autoCheckInterval.value = null;
  }
  autoCheckEnabled.value = false;
  message.info('已关闭自动检测');
};

// 重置筛选条件
const resetFilters = () => {
  searchKeyword.value = '';
  selectedProvider.value = '';
};

// 排序镜像列表
const sortMirrors = () => {
  // 创建一个新的数组，避免直接修改原数组
  const sortedMirrors = [...mirrors.value];
  
  // 排序规则：
  // 1. 正常访问的镜像（success === true）排在前面
  // 2. 正常访问的镜像中，按响应时间从快到慢排序
  // 3. 异常的镜像（success === false）排在中间
  // 4. 未检测的镜像（success === undefined）排在最后
  sortedMirrors.sort((a, b) => {
    // 如果 a 正常而 b 不正常或未检测，a 排在前面
    if (a.success === true && b.success !== true) return -1;
    // 如果 b 正常而 a 不正常或未检测，b 排在前面
    if (b.success === true && a.success !== true) return 1;
    // 如果 a 异常而 b 未检测，a 排在前面
    if (a.success === false && b.success === undefined) return -1;
    // 如果 b 异常而 a 未检测，b 排在前面
    if (b.success === false && a.success === undefined) return 1;
    
    // 如果两者状态相同且都是正常的，按响应时间排序
    if (a.success === true && b.success === true) {
      return a.responseTime - b.responseTime; // 从快到慢
    }
    
    // 其他情况保持原有顺序
    return 0;
  });
  
  // 更新镜像列表
  mirrors.value = sortedMirrors;
};

// 组件挂载时加载镜像数据
onMounted(() => {
  loadMirrors();
  // 初始加载后也进行一次排序
  sortMirrors();
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (autoCheckInterval.value) {
    clearInterval(autoCheckInterval.value);
  }
});
</script>

<template>
  <div class="cyber-container">
    <!-- 顶部导航栏 -->
    <header class="cyber-header">
      <div class="cyber-logo-container">
        <div class="cyber-logo-wrapper">
          <img src="./assets/vue.svg" class="cyber-logo" alt="Vue logo" />
        </div>
        <h1 class="cyber-title">DOCKER<span class="cyber-title-accent">SCAN</span></h1>
      </div>
      <div class="cyber-header-actions">
        <a-button type="primary" @click="checkMirrors" :loading="loading" class="cyber-button">
          <span class="cyber-button-icon">⚡</span> 检测筛选结果
        </a-button>
        <a-button type="primary" @click="checkAllMirrors" :loading="loading" class="cyber-button">
          <span class="cyber-button-icon">🔍</span> 全部检测
        </a-button>
        <a-button 
          :type="autoCheckEnabled ? 'danger' : 'default'" 
          @click="toggleAutoCheck"
          :loading="loading"
          class="cyber-button auto-check-button"
          :class="{'auto-check-active': autoCheckEnabled}"
        >
          <span class="cyber-button-icon">{{ autoCheckEnabled ? '⏱️' : '🔄' }}</span>
          {{ autoCheckEnabled ? `自动检测中 ${autoCheckCountdown}s` : '开启自动检测' }}
        </a-button>
        <a-button @click="resetFilters" class="cyber-button reset-button">
          <span class="cyber-button-icon">🔄</span> 重置筛选
        </a-button>
        <a-button 
          @click="showConfigGuide = !showConfigGuide" 
          class="cyber-button config-button"
          :class="{'config-active': showConfigGuide}"
        >
          <span class="cyber-button-icon">⚙️</span> {{ showConfigGuide ? '返回镜像列表' : '配置镜像源' }}
        </a-button>
      </div>
    </header>
    
    <!-- 主内容区 -->
    <main class="cyber-content">
      <div v-if="!showConfigGuide" class="cyber-card">
        <div class="cyber-card-header">
          <div class="cyber-card-title">
            <span class="cyber-icon">📊</span> Docker镜像源列表
          </div>
        </div>
        
        <!-- 状态统计面板 -->
        <div class="cyber-stats-container">
          <div class="cyber-stats-grid">
            <div class="cyber-stat-item" v-if="autoCheckEnabled">
              <a-statistic-countdown 
                :value="Date.now() + autoCheckCountdown * 1000" 
                format="ss" 
                suffix="秒后检测" 
                class="cyber-countdown"
              />
            </div>
            <div class="cyber-stat-item total-stat">
              <a-statistic 
                title="总镜像数" 
                :value="mirrorStats.total" 
                class="cyber-stat"
              />
            </div>
            <div class="cyber-stat-item success-stat">
              <a-statistic 
                title="正常可访问" 
                :value="mirrorStats.normal" 
                valueStyle="color: #0cff70"
                class="cyber-stat"
              >
                <template #suffix>
                  <span v-if="mirrorStats.total > 0" class="cyber-stat-percent">
                    {{ Math.round(mirrorStats.normal / mirrorStats.total * 100) }}%
                  </span>
                </template>
              </a-statistic>
            </div>
            <div class="cyber-stat-item slow-stat">
              <a-statistic 
                title="响应缓慢" 
                :value="mirrorStats.slow" 
                valueStyle="color: #ffcc00"
                class="cyber-stat"
              >
                <template #suffix>
                  <span v-if="mirrorStats.total > 0" class="cyber-stat-percent">
                    {{ Math.round(mirrorStats.slow / mirrorStats.total * 100) }}%
                  </span>
                </template>
              </a-statistic>
            </div>
            <div class="cyber-stat-item error-stat">
              <a-statistic 
                title="异常不可用" 
                :value="mirrorStats.error" 
                valueStyle="color: #ff3e5f"
                class="cyber-stat"
              >
                <template #suffix>
                  <span v-if="mirrorStats.total > 0" class="cyber-stat-percent">
                    {{ Math.round(mirrorStats.error / mirrorStats.total * 100) }}%
                  </span>
                </template>
              </a-statistic>
            </div>
            <div class="cyber-stat-item untested-stat">
              <a-statistic 
                title="未检测" 
                :value="mirrorStats.untested" 
                valueStyle="color: #7f8c8d"
                class="cyber-stat"
              >
                <template #suffix>
                  <span v-if="mirrorStats.total > 0" class="cyber-stat-percent">
                    {{ Math.round(mirrorStats.untested / mirrorStats.total * 100) }}%
                  </span>
                </template>
              </a-statistic>
            </div>
          </div>
        </div>
        
        <!-- 筛选工具栏 -->
        <div class="cyber-filters">
          <a-input-search
            v-model:value="searchKeyword"
            placeholder="搜索镜像名称或描述"
            class="cyber-search"
            @search="searchKeyword = $event"
          >
            <template #prefix>
              <span class="cyber-search-icon">🔍</span>
            </template>
          </a-input-search>
          
          <a-select
            v-model:value="selectedProvider"
            class="cyber-select"
            placeholder="按提供商筛选"
            allow-clear
          >
            <a-select-option v-for="provider in providers" :key="provider" :value="provider">
              {{ provider }}
            </a-select-option>
          </a-select>
        </div>
        
        <!-- 数据表格 -->
        <a-table
          :dataSource="filteredMirrors"
          :loading="loading"
          rowKey="url"
          :pagination="{ pageSize: 10 }"
          :defaultSortOrder="'ascend'"
          class="cyber-table"
        >
          <a-table-column title="镜像名称" dataIndex="name" />
          <a-table-column title="提供商" dataIndex="provider" />
          <a-table-column title="描述" dataIndex="description" />
          <a-table-column title="镜像地址" dataIndex="url">
            <template #default="{ text }">
              <div class="cyber-url-container">
                <a :href="text" target="_blank" class="cyber-url">{{ text }}</a>
                <a-button type="link" size="small" @click="copyMirrorUrl(text)" class="cyber-copy-btn">
                  <template #icon><copy-outlined /></template>
                </a-button>
              </div>
            </template>
          </a-table-column>
          <a-table-column title="状态" dataIndex="success">
            <template #default="{ text, record }">
              <div class="cyber-status">
                <span v-if="text === true && record.responseTime < 1000" class="cyber-status-badge success">正常</span>
                <span v-else-if="text === true && record.responseTime >= 1000" class="cyber-status-badge warning">缓慢</span>
                <span v-else-if="text === false" class="cyber-status-badge error">异常</span>
                <span v-else class="cyber-status-badge default">未检测</span>
              </div>
            </template>
          </a-table-column>
          <a-table-column title="响应时间" dataIndex="responseTime">
            <template #default="{ text }">
              <span v-if="text !== undefined">
                <span :class="{
                  'cyber-response-fast': text < 500,
                  'cyber-response-normal': text >= 500 && text < 1000,
                  'cyber-response-slow': text >= 1000
                }">{{ text }}ms</span>
              </span>
              <span v-else class="cyber-no-data">--</span>
            </template>
          </a-table-column>
          <a-table-column title="消息" dataIndex="message">
            <template #default="{ text }">
              <span v-if="text" class="cyber-message">{{ text }}</span>
              <span v-else class="cyber-no-data">--</span>
            </template>
          </a-table-column>
          <a-table-column title="操作" width="100px">
            <template #default="{ record }">
              <a-button type="link" size="small" @click="copyMirrorUrl(record.url)" class="cyber-action-btn">
                <span class="cyber-action-icon">📋</span> 复制
              </a-button>
            </template>
          </a-table-column>
        </a-table>
      </div>
      
      <!-- 配置向导页面 -->
      <DockerConfigGuide v-if="showConfigGuide" :mirrors="mirrors" />
    </main>
    
    <!-- 页脚 -->
    <footer class="cyber-footer">
      <div class="cyber-footer-content">
        <span class="cyber-footer-text">DOCKER<span class="cyber-footer-accent">SCAN</span> © 2023</span>
        <span class="cyber-footer-divider">|</span>
        <span class="cyber-footer-tech">Powered by Vue3 + Vite + Ant Design Vue</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 全局容器 */
.cyber-container {
  min-height: 100vh;
  background-color: var(--light-bg);
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  font-family: 'Rajdhani', 'Orbitron', sans-serif;
  background-image: 
    linear-gradient(rgba(200, 200, 200, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(200, 200, 200, 0.05) 1px, transparent 1px);
  background-size: 20px 20px, 20px 20px;
  background-position: center center, center center;
}

/* 顶部导航栏 */
.cyber-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 2rem;
  background: white;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-wrap: wrap;
}

.cyber-logo-container {
  display: flex;
  align-items: center;
}

.cyber-logo-wrapper {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #0066ff 0%, #00ccff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  box-shadow: 0 0 10px rgba(0, 150, 255, 0.5);
  position: relative;
  overflow: hidden;
}

.cyber-logo-wrapper::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: linear-gradient(45deg, rgba(0, 102, 255, 0) 0%, rgba(0, 204, 255, 0.5) 100%);
  animation: rotate 8s linear infinite;
  z-index: -1;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cyber-logo {
  height: 24px;
  filter: none;
}

.cyber-title {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.cyber-title-accent {
  color: #00ffcc;
  -webkit-text-fill-color: #00ffcc;
  position: relative;
}

.cyber-title-accent::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, rgba(0, 255, 204, 0) 0%, rgba(0, 255, 204, 1) 50%, rgba(0, 255, 204, 0) 100%);
}

.cyber-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 0.5rem;
}

.config-button {
  /* background: linear-gradient(180deg, #2a1a4a 0%, #15102a 100%) !important; */
  border-color: #3a2a5a !important;
}

.config-button:hover {
  box-shadow: 0 0 12px rgba(150, 50, 255, 0.4) !important;
  border-color: #4a3a6a !important;
}

.config-active {
  background: linear-gradient(180deg, #3a1a4a 0%, #25102a 100%) !important;
  border-color: #5a2a5a !important;
  box-shadow: 0 0 8px rgba(255, 50, 255, 0.3) !important;
}

.config-active:hover {
  box-shadow: 0 0 12px rgba(255, 50, 255, 0.5) !important;
}

/* 按钮样式 */
.cyber-button {
  /* background: linear-gradient(180deg, #1a2a4a 0%, #0d1526 100%) !important; */
  border: 1px solid var(--border-color) !important;
  color: var(--text-color) !important;
  border-radius: 4px !important;
  padding: 0.4rem 1rem !important;
  height: auto !important;
  font-weight: 500 !important;
  position: relative;
  overflow: hidden;
  transition: var(--hover-transition);
  box-shadow: 0 0 8px rgba(0, 150, 255, 0.2) !important;
  text-shadow: var(--text-shadow) !important;
}

.cyber-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transition: all 0.5s ease;
}

.cyber-button:hover {
  box-shadow: 0 0 15px rgba(0, 150, 255, 0.5) !important;
  border-color: var(--primary-color) !important;
  transform: translateY(-3px);
  text-shadow: 0 0 8px var(--primary-glow) !important;
}

.cyber-button:hover::before {
  left: 100%;
}

/* .cyber-button-icon {
  margin-right: 0.5rem;
  font-size: 1rem;
} */

.auto-check-button.auto-check-active {
  /* background: linear-gradient(180deg, #4a1a2a 0%, #260d15 100%) !important; */
  border-color: #5a2a3a !important;
  box-shadow: 0 0 8px rgba(255, 50, 100, 0.3) !important;
}

.auto-check-button.auto-check-active:hover {
  box-shadow: 0 0 12px rgba(255, 50, 100, 0.5) !important;
}

.reset-button {
  /* background: linear-gradient(180deg, #2a2a3a 0%, #15151d 100%) !important; */
  border-color: #3a3a4a !important;
}

/* 主内容区 */
.cyber-content {
  flex: 1;
  padding: 1.5rem;
  background-color: var(--light-bg);
  background-image: 
    linear-gradient(rgba(200, 200, 200, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(200, 200, 200, 0.05) 1px, transparent 1px);
  background-size: 20px 20px, 20px 20px;
  background-position: center center, center center;
}

/* 卡片样式 */
.cyber-card {
  background: white;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
}

.cyber-card-header {
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: #f9f9f9;
}

.cyber-card-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
}

.cyber-icon {
  margin-right: 0.5rem;
  font-size: 1.2rem;
}

/* 统计面板 */
.cyber-stats-container {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: #f9f9f9;
}

.cyber-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.2rem;
}

.cyber-stat-item {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

.cyber-stat {
  position: relative;
}

.cyber-stat-percent {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-left: 0.3rem;
}

.total-stat {
  border-left: 3px solid var(--primary-color);
}

.success-stat {
  border-left: 3px solid var(--success-color);
}

.slow-stat {
  border-left: 3px solid var(--warning-color);
}

.error-stat {
  border-left: 3px solid var(--error-color);
}

.untested-stat {
  border-left: 3px solid #9e9e9e;
}

/* 筛选工具栏 */
.cyber-filters {
  display: flex;
  gap: 1rem;
  margin: 1.5rem;
  flex-wrap: wrap;
}

.cyber-search {
  min-width: 300px;
  background: white !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 4px !important;
}

.cyber-search input {
  background: transparent !important;
  color: var(--text-color) !important;
}

.cyber-search-icon {
  margin-right: 0.5rem;
  opacity: 0.7;
}

.cyber-select {
  min-width: 200px;
  background: white !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 4px !important;
}

.cyber-select :deep(.ant-select-selector) {
  background: transparent !important;
  border: none !important;
  color: var(--text-color) !important;
}

/* 表格样式 */
.cyber-table {
  margin: 0 1.5rem 1.5rem;
}

.cyber-table :deep(.ant-table) {
  background: white !important;
  color: var(--text-color) !important;
}

.cyber-table :deep(.ant-table-thead > tr > th) {
  background: #f5f5f5 !important;
  color: var(--text-color) !important;
  border-bottom: 1px solid var(--border-color) !important;
}

.cyber-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid var(--border-color) !important;
}

.cyber-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #f9f9f9 !important;
}

.cyber-table :deep(.ant-table-tbody > tr) {
  background: white;
}

.cyber-table :deep(.ant-table-tbody > tr:nth-child(odd)) {
  background: #fafafa;
}

.cyber-table :deep(.ant-pagination-item-active) {
  border-color: var(--primary-color) !important;
  background: rgba(33, 150, 243, 0.1) !important;
}

.cyber-table :deep(.ant-pagination-item-active a) {
  color: var(--primary-color) !important;
}

/* URL容器 */
.cyber-url-container {
  display: flex;
  align-items: center;
}

.cyber-url {
  margin-right: 0.5rem;
  word-break: break-all;
  color: var(--primary-color);
}

.cyber-copy-btn {
  opacity: 0.7;
  color: var(--primary-color) !important;
}

/* 状态标签 */
.cyber-status {
  display: inline-flex;
}

.cyber-status-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  position: relative;
}

.cyber-status-badge.success {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: var(--success-color);
}

.cyber-status-badge.warning {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: var(--warning-color);
}

.cyber-status-badge.error {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: var(--error-color);
}

.cyber-status-badge.default {
  background: rgba(158, 158, 158, 0.1);
  border: 1px solid rgba(158, 158, 158, 0.3);
  color: #757575;
}

/* 响应时间 */
.cyber-response-fast {
  color: var(--success-color);
  font-weight: bold;
}

.cyber-response-normal {
  color: var(--primary-color);
  font-weight: 600;
}

.cyber-response-slow {
  color: var(--warning-color);
  font-weight: bold;
}

.cyber-no-data {
  color: #7f8c8d;
  opacity: 0.7;
}

.cyber-message {
  font-family: 'Courier New', monospace;
  color: #e0e0ff;
  opacity: 0.9;
}

/* 操作按钮 */
.cyber-action-btn {
  color: var(--primary-color) !important;
  padding: 0.2rem 0.5rem !important;
  border-radius: 4px;
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.25) !important;
}

.cyber-action-icon {
  margin-right: 0.3rem;
}

/* 页脚 */
.cyber-footer {
  padding: 1rem;
  background: white;
  border-top: 1px solid var(--border-color);
  text-align: center;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

.cyber-footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.cyber-footer-text {
  font-weight: 500;
  letter-spacing: 1px;
}

.cyber-footer-accent {
  color: var(--primary-color);
}

.cyber-footer-divider {
  color: #e0e0e0;
}

.cyber-footer-tech {
  opacity: 0.7;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .cyber-header {
    padding: 0.8rem 1rem;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .cyber-logo-container {
    margin-bottom: 0.8rem;
  }
  
  .cyber-header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .cyber-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .cyber-filters {
    flex-direction: column;
  }
  
  .cyber-search, .cyber-select {
    width: 100%;
  }
}
</style>
