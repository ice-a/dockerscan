import axios from 'axios';

/**
 * 检测Docker镜像地址是否可用
 * @param {string} url - Docker镜像地址
 * @returns {Promise<{success: boolean, message: string, responseTime: number}>}
 */
export const checkDockerMirror = async (url) => {
  const startTime = Date.now();
  try {
    // 设置超时时间为5秒
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true, // 接受任何状态码
    });
    
    const responseTime = Date.now() - startTime;
    
    // 如果能够获取到响应，则认为镜像可用
    return {
      success: response.status < 500, // 5xx状态码通常表示服务器错误
      message: `状态码: ${response.status}`,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      message: error.message || '请求失败',
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
  const results = [];
  
  for (const mirror of mirrors) {
    const result = await checkDockerMirror(mirror.url);
    results.push({
      ...mirror,
      ...result,
    });
  }
  
  return results;
};