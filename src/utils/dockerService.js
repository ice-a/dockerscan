import axios from 'axios';

// 定义响应时间阈值（毫秒）
const RESPONSE_TIME_THRESHOLD = {
  EXCELLENT: 1000,
  GOOD: 3000,
  POOR: 8000
};

// 可接受的状态码，视为服务可用
const ACCEPTABLE_STATUSES = [200, 401, 403, 429];

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

    // 使用代理路径
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

    if (ACCEPTABLE_STATUSES.includes(response.status)) {
      const isEmptyResponse = !response.data || (typeof response.data === 'object' && Object.keys(response.data).length === 0);
      if (isEmptyResponse) {
        return {
          success: false,
          message: 'Registry API返回空响应，服务不可用',
          responseTime,
          performance,
        };
      }

      // 尝试访问常用镜像的manifest
      try {
        const testImage = `/api/v2/library/hello-world/manifests/latest`;
        const manifestResponse = await axios.get(testImage, {
          timeout: RESPONSE_TIME_THRESHOLD.GOOD,
          headers: {
            'Accept': 'application/vnd.docker.distribution.manifest.v2+json',
            'X-Mirror-Url': normalizedUrl,
          },
        });

        const isManifestEmpty = !manifestResponse.data || (typeof manifestResponse.data === 'object' && Object.keys(manifestResponse.data).length === 0);
        const isAvailable = ACCEPTABLE_STATUSES.includes(manifestResponse.status) &&
                          !isManifestEmpty &&
                          responseTime <= RESPONSE_TIME_THRESHOLD.POOR;

        let message = isAvailable
          ? `镜像服务可用，可成功获取镜像元数据（${performance}）`
          : isManifestEmpty
            ? '镜像元数据返回空响应，服务不可用'
            : `状态码: ${manifestResponse.status}, 响应时间过长或无法获取镜像元数据`;

        if (response.status === 403 || manifestResponse.status === 403) {
          message = `镜像服务需要认证但可用（${performance}，状态码: ${response.status || manifestResponse.status}）`;
        } else if (response.status === 429 || manifestResponse.status === 429) {
          message = `镜像服务限流但可能可用（${performance}，状态码: ${response.status || manifestResponse.status}）`;
        }

        return {
          success: isAvailable || response.status === 403 || manifestResponse.status === 403,
          message,
          responseTime,
          performance,
        };
      } catch (manifestError) {
        let message = `无法获取测试镜像元数据: ${manifestError.message}`;
        if (response.status === 403) {
          message = `镜像服务需要认证但可用（${performance}，状态码: 403）`;
          return {
            success: true, // Treat 403 as usable even if manifest check fails
            message,
            responseTime,
            performance,
          };
        }
        return {
          success: false,
          message,
          responseTime,
          performance,
        };
      }
    } else {
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
    if (error.code === 'ENOTFOUND') {
      message = `DNS解析失败: ${url}`;
    } else if (error.code === 'ECONNRESET') {
      message = `连接被重置: ${url}`;
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