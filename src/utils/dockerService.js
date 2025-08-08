import axios from 'axios';

// 定义响应时间阈值（毫秒）
const RESPONSE_TIME_THRESHOLD = {
  EXCELLENT: 1000,
  GOOD: 3000,
  POOR: 8000
};

// 响应时间阈值（毫秒）

/**
 * 检测Docker镜像地址是否可用
 * @param {string} url - Docker镜像地址
 * @returns {Promise<{success: boolean, message: string, responseTime: number, performance: string}>}
 */
export const checkDockerMirror = async (url) => {
  const startTime = Date.now();
  try {
    // 规范化URL
    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = `https://${url}`;
    }
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');

    // 验证URL有效性
    try {
      new URL(normalizedUrl);
    } catch (error) {
      return {
        success: false,
        message: `无效的URL: ${url}`,
        responseTime: 0,
        performance: 'failed',
      };
    }

    // 使用代理路径访问 /v2 端点
    const apiUrl = `/api/v2/`;
    const response = await axios.get(apiUrl, {
      timeout: RESPONSE_TIME_THRESHOLD.POOR,
      validateStatus: () => true,
      headers: {
        'Accept': 'application/vnd.docker.distribution.manifest.v2+json',
        'X-Mirror-Url': normalizedUrl,
      },
    });

    const responseTime = Date.now() - startTime;

    let performance = 'poor';
    if (responseTime <= RESPONSE_TIME_THRESHOLD.EXCELLENT) {
      performance = 'excellent';
    } else if (responseTime <= RESPONSE_TIME_THRESHOLD.GOOD) {
      performance = 'good';
    }

    // 简化的检测逻辑：只要有返回就认为可用
    if (response.status >= 200 && response.status < 500) {
      // 检查响应是否为空
      const isEmptyResponse = !response.data || 
        (typeof response.data === 'object' && Object.keys(response.data).length === 0) ||
        (typeof response.data === 'string' && response.data.trim() === '');
      
      if (isEmptyResponse) {
        return {
          success: false,
          message: 'Registry API返回空响应，服务不可用',
          responseTime,
          performance,
        };
      }

      // 有返回且不为空，认为可用
      let message = `镜像服务可用（${performance}）`;
      
      // 特殊状态码处理
      if (response.status === 401) {
        message = `镜像服务需要认证但可用（${performance}，状态码: 401）`;
      } else if (response.status === 403) {
        message = `镜像服务需要认证但可用（${performance}，状态码: 403）`;
      } else if (response.status === 429) {
        message = `镜像服务限流但可能可用（${performance}，状态码: 429）`;
      }

      return {
        success: true,
        message,
        responseTime,
        performance,
      };
    } else {
      // 检查是否是代理返回的错误响应
      if (response.status === 500 && response.data) {
        const errorData = response.data;
        let message = `Registry API不可用，状态码: ${response.status}`;
        
        if (errorData.code === 'ENOTFOUND') {
          message = `DNS解析失败: ${url}`;
        } else if (errorData.message) {
          message = `代理错误: ${errorData.message}`;
        }
        
        return {
          success: false,
          message,
          responseTime,
          performance: 'failed',
        };
      }
      
      return {
        success: false,
        message: `Registry API不可用，状态码: ${response.status}`,
        responseTime,
        performance,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let message = `连接失败: ${error.message}`;
    
    // 处理代理返回的错误响应
    if (error.response) {
      const errorData = error.response.data;
      if (errorData && errorData.code === 'ENOTFOUND') {
        message = `DNS解析失败: ${url}`;
      } else if (errorData && errorData.message) {
        message = `代理错误: ${errorData.message}`;
      } else {
        message = `HTTP错误: ${error.response.status} - ${error.response.statusText}`;
      }
    } else if (error.code === 'ENOTFOUND') {
      message = `DNS解析失败: ${url}`;
    } else if (error.code === 'ECONNRESET') {
      message = `连接被重置: ${url}`;
    } else if (error.code === 'ECONNREFUSED') {
      message = `连接被拒绝: ${url}`;
    } else if (error.code === 'ETIMEDOUT') {
      message = `连接超时: ${url}`;
    } else if (error.message && error.message.includes('Couldn\'t resolve host')) {
      message = `DNS解析失败: ${url}`;
    }
    
    return {
      success: false,
      message,
      responseTime,
      performance: 'failed',
    };
  }
};

/**
 * 批量检测Docker镜像地址
 * @param {Array} mirrors - Docker镜像列表
 * @returns {Promise<Array>} - 检测结果列表
 */
export const batchCheckMirrors = async (mirrors) => {
  const batchSize = 5;
  const results = [];
  for (let i = 0; i < mirrors.length; i += batchSize) {
    const batch = mirrors.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(async (mirror) => {
      const result = await checkDockerMirror(mirror.url);
      return { ...mirror, ...result };
    }));
    results.push(...batchResults);
    if (i + batchSize < mirrors.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return results;
};