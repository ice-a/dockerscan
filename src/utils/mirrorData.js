// 导入1.js中的Docker镜像数据
import dockerServices from '/public/1.js';

/**
 * 获取所有Docker镜像数据
 * @returns {Array} Docker镜像列表
 */
export const getAllMirrors = () => {
  return dockerServices;
};

/**
 * 按提供商筛选Docker镜像
 * @param {string} provider - 提供商名称
 * @returns {Array} 筛选后的Docker镜像列表
 */
export const getMirrorsByProvider = (provider) => {
  if (!provider) return dockerServices;
  return dockerServices.filter(mirror => 
    mirror.provider.toLowerCase().includes(provider.toLowerCase())
  );
};

/**
 * 按名称搜索Docker镜像
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 搜索结果列表
 */
export const searchMirrors = (keyword) => {
  if (!keyword) return dockerServices;
  return dockerServices.filter(mirror => 
    mirror.name.toLowerCase().includes(keyword.toLowerCase()) ||
    mirror.provider.toLowerCase().includes(keyword.toLowerCase()) ||
    mirror.description.toLowerCase().includes(keyword.toLowerCase())
  );
};