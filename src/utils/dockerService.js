import axios from 'axios';

/**
 * 检测Docker镜像地址是否可用
 * @param {string} url - Docker镜像地址
 * @returns {Promise<{success: boolean, message: string, responseTime: number}>}
 */
export const checkDockerMirror = async (url) => {
  const startTime = Date.now();
  try {
    // 规范化URL，确保以https://或http://开头
    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = `https://${url}`;
    }

    // 清理URL末尾的斜杠
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');

    // 检测Registry v2 API是否可用
    const apiUrl = `${normalizedUrl}/v2/`;
    const response = await axios.get(apiUrl, {
      timeout: 8000, // 增加超时时间到8秒
      validateStatus: () => true,
      headers: {
        'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
      }
    });

    const responseTime = Date.now() - startTime;

    // 检查响应状态和Docker Registry API的可用性
    if (response.status === 200) {
      // 尝试访问一个常用镜像的manifest来验证实际可用性
      try {
        const testImage = `${normalizedUrl}/v2/library/hello-world/manifests/latest`;
        const manifestResponse = await axios.get(testImage, {
          timeout: 5000,
          headers: {
            'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
          }
        });

        return {
          success: manifestResponse.status === 200,
          message: manifestResponse.status === 200 
            ? '镜像服务可用，可成功获取镜像元数据'
            : `状态码: ${manifestResponse.status}, 无法获取镜像元数据`,
          responseTime,
        };
      } catch (manifestError) {
        return {
          success: false,
          message: `无法获取测试镜像元数据: ${manifestError.message}`,
          responseTime,
        };
      }
    } else if (response.status === 401) {
      // 401通常表示需要认证，但registry是可用的
      return {
        success: true,
        message: '镜像服务需要认证但可用',
        responseTime,
      };
    } else {
      return {
        success: false,
        message: `Registry API不可用，状态码: ${response.status}`,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      message: `连接失败: ${error.message}`,
      responseTime,
    };
  }
};

/**
 * 批量检测Docker镜像地址
 * @param {Array} mirrors - Docker镜像列表
 * @returns {Promise<Array>} - 检测结果列表
 */
export const batchCheckMirrors = async (mirrors) => {
  // 使用Promise.all并行检测以提高效率
  const checkPromises = mirrors.map(async (mirror) => {
    const result = await checkDockerMirror(mirror.url);
    return {
      ...mirror,
      ...result,
    };
  });

  return Promise.all(checkPromises);
};