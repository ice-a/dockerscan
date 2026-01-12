// Docker 镜像加速服务配置
export const dockerServices = [
  {
    id: 'registry',
    name: 'registry',
    url: 'https://registry.cyou',
    provider: 'registry',
    description: 'registry 提供的 Docker 镜像加速服务'
  },
  {
    id: 'vvvv',
    name: 'vvvv',
    url: 'https://proxy.vvvv.ee',
    provider: 'vvvv',
    description: 'vvvv 提供的 Docker 镜像加速服务'
  },
  {
    id: '52013120',
    name: '52013120',
    url: 'https://demo.52013120.xyz',
    provider: '52013120',
    description: '52013120 提供的 Docker 镜像加速服务'
  },
  {
    id: 'dockerproxy',
    name: 'dockerproxy',
    url: 'https://dockerproxy.net',
    provider: 'dockerproxy',
    description: 'dockerproxy 提供的 Docker 镜像加速服务'
  },
  {
    id: '666860',
    name: '666860',
    url: 'https://666860.xyz',
    provider: '666860',
    description: '666860 提供的 Docker 镜像加速服务'
  },
  {
    id: 'unsee',
    name: 'unsee',
    url: 'https://docker-0.unsee.tech',
    provider: 'unsee',
    description: 'unsee 提供的 Docker 镜像加速服务'
  },
  {
    id: 'xiaogenban1993',
    name: 'xiaogenban1993',
    url: 'http://docker.xiaogenban1993.com',
    provider: 'xiaogenban1993',
    description: 'xiaogenban1993 提供的 Docker 镜像加速服务'
  },
  {
    id: 'lispy',
    name: 'lispy',
    url: 'https://lispy.org',
    provider: 'lispy',
    description: 'lispy 提供的 Docker 镜像加速服务'
  },
  {
    id: 'dockerproxy-com',
    name: 'Docker 镜像代理',
    url: 'https://dockerproxy.com',
    provider: 'Docker 镜像代理',
    description: 'Docker 镜像代理 提供的 Docker 镜像加速服务'
  },
  {
    id: 'daocloud',
    name: 'DaoCloud',
    url: 'https://docker.m.daocloud.io',
    provider: 'DaoCloud',
    description: 'DaoCloud 提供的 Docker 镜像加速服务'
  },
  {
    id: 'ghcr',
    name: 'ghcr',
    url: 'https://ghcr.nju.edu.cn/',
    provider: '1pancel',
    description: 'ghcr 提供的 Docker 镜像加速服务'
  },
  {
    id: '1panel',
    name: '1pancel',
    url: 'https://docker.1panel.live',
    provider: '1pancel',
    description: '1pancel 提供的 Docker 镜像加速服务'
  },
  {
    id: 'ustc',
    name: '中科大镜像站',
    url: 'https://docker.mirrors.ustc.edu.cn',
    provider: 'USTC',
    description: '中国科学技术大学开源软件镜像站'
  },
  {
    id: 'netease',
    name: '网易云镜像',
    url: 'https://hub-mirror.c.163.com',
    provider: '网易云',
    description: '网易云提供的 Docker Hub 镜像'
  },
  {
    id: 'aliyun',
    name: '阿里云镜像',
    url: 'https://registry.cn-hangzhou.aliyuncs.com',
    provider: '阿里云',
    description: '阿里云容器镜像服务'
  },
  {
    id: 'tencent',
    name: '腾讯云镜像',
    url: 'https://mirror.ccs.tencentyun.com',
    provider: '腾讯云',
    description: '腾讯云容器镜像服务'
  },
  {
    id: 'huawei',
    name: '华为云镜像',
    url: 'https://swr.cn-north-1.myhuaweicloud.com',
    provider: '华为云',
    description: '华为云软件开发生产线'
  },
  {
    id: 'daocloud-f136',
    name: 'DaoCloud 镜像',
    url: 'https://f1361db2.m.daocloud.io',
    provider: 'DaoCloud',
    description: 'DaoCloud 提供的镜像加速服务'
  },
  {
    id: 'baidu',
    name: '百度云镜像',
    url: 'https://mirror.baidubce.com',
    provider: '百度云',
    description: '百度智能云容器镜像服务'
  },
  {
    id: 'qiniu',
    name: '七牛云镜像',
    url: 'https://reg-mirror.qiniu.com',
    provider: '七牛云',
    description: '七牛云提供的 Docker 镜像加速'
  },
  {
    id: 'sjtu',
    name: '上海交大镜像',
    url: 'https://docker.mirrors.sjtug.sjtu.edu.cn',
    provider: '上海交大',
    description: '上海交通大学软件源镜像服务'
  },
  {
    id: 'tsinghua',
    name: '清华大学镜像',
    url: 'https://mirrors.tuna.tsinghua.edu.cn/docker-ce',
    provider: '清华大学',
    description: '清华大学开源软件镜像站'
  },
  {
    id: 'nju',
    name: '南京大学镜像',
    url: 'https://docker.nju.edu.cn',
    provider: '南京大学',
    description: '南京大学开源镜像站'
  },
  {
    id: 'volcengine',
    name: '字节跳动镜像',
    url: 'https://cr.volcengine.com',
    provider: '字节跳动',
    description: '火山引擎容器镜像服务'
  },
  {
    id: 'jdcloud',
    name: '京东云镜像',
    url: 'https://hub-mirror.jdcloud.com',
    provider: '京东云',
    description: '京东云容器镜像服务'
  },
  {
    id: 'upyun',
    name: '又拍云镜像',
    url: 'https://docker.mirrors.upyun.com',
    provider: '又拍云',
    description: '又拍云 Docker 镜像加速'
  },
  {
    id: 'azure-cn',
    name: 'Azure 中国镜像',
    url: 'https://dockerhub.azk8s.cn',
    provider: 'Azure',
    description: 'Microsoft Azure 中国镜像'
  },
  {
    id: 'docker-cn',
    name: '中国官方镜像',
    url: 'https://registry.docker-cn.com',
    provider: 'Docker官方',
    description: 'Docker 官方中国镜像'
  },
  {
    id: '1ms',
    name: '毫秒镜像',
    url: 'https://docker.1ms.run',
    provider: '毫秒镜像',
    description: '毫秒镜像 CloudFlare 加速'
  },
  {
    id: '1panel-live',
    name: '1Panel 镜像',
    url: 'https://docker.1panel.live',
    provider: '1Panel',
    description: '1Panel CloudFlare 镜像源'
  },
  {
    id: 'rat-dev',
    name: '耗子面板',
    url: 'https://hub.rat.dev',
    provider: '耗子面板',
    description: '耗子面板 CloudFlare 镜像'
  },
  {
    id: 'xuanyuan',
    name: '轩辕镜像',
    url: 'https://docker.xuanyuan.me',
    provider: '轩辕镜像',
    description: '轩辕镜像 CloudFlare 免费版'
  },
  {
    id: 'dockerproxy-net',
    name: 'DockerProxy',
    url: 'https://dockerproxy.net',
    provider: 'DockerProxy',
    description: 'DockerProxy Oracle CDN'
  },
  {
    id: 'fast360',
    name: 'Fast360',
    url: 'https://hub.fast360.xyz',
    provider: 'Fast360',
    description: 'Fast360 Nginx 镜像源'
  },
  {
    id: 'cloudlayer',
    name: 'Docker Layer ICU',
    url: 'https://image.cloudlayer.icu',
    provider: 'CloudLayer',
    description: 'Docker Layer ICU Nginx'
  },
  {
    id: 'nmqu',
    name: '奶昔论坛',
    url: 'https://docker-registry.nmqu.com',
    provider: '奶昔论坛',
    description: '奶昔论坛 CloudFlare 镜像'
  },
  {
    id: 'amingg',
    name: '爱铭网络',
    url: 'https://hub.amingg.com',
    provider: '爱铭网络',
    description: '爱铭网络 CloudFlare 镜像'
  },
  {
    id: 'hlmirror',
    name: '厚浪云',
    url: 'https://docker.hlmirror.com',
    provider: '厚浪云',
    description: '厚浪云 CloudFlare 镜像'
  },
  {
    id: 'nat-tf-2',
    name: '棉花云香港',
    url: 'https://hub2.nat.tf',
    provider: '棉花云',
    description: '棉花云香港 BGP 节点'
  },
  {
    id: 'nat-tf-3',
    name: '棉花云日本',
    url: 'https://hub3.nat.tf',
    provider: '棉花云',
    description: '棉花云日本东京节点'
  },
  {
    id: 'kejilion',
    name: '科技 lion',
    url: 'https://docker.kejilion.pro',
    provider: '科技lion',
    description: '自媒体 UP 主 Nginx 镜像'
  },
  {
    id: '367231',
    name: '1Panel 三方源',
    url: 'https://docker.367231.xyz',
    provider: '1Panel社区',
    description: '1Panel 核心用户 GXL 驱动'
  },
  {
    id: 'etcd',
    name: 'SUNBALCONY',
    url: 'https://docker.etcd.fun',
    provider: 'SUNBALCONY',
    description: 'ipip.icu 博主 EdgeOne'
  },
  {
    id: 'apiba',
    name: 'apiba 镜像',
    url: 'https://docker.apiba.cn',
    provider: 'apiba',
    description: 'apiba.cn CloudFlare 镜像'
  },
  {
    id: 'mxjia',
    name: 'mxjia 代理',
    url: 'https://proxy.vvvv.ee',
    provider: 'mxjia',
    description: 'NodeSeek 大佬 Nginx 代理'
  },
  {
    id: 'fnnas',
    name: '飞牛 NAS',
    url: 'https://docker.fnnas.com',
    provider: '飞牛NAS',
    description: '飞牛 NAS Nginx 镜像源'
  }
];
