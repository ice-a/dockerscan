# Docker镜像检测工具 - 错误处理改进

## 问题描述

当Docker镜像地址出现"Couldn't resolve host"等DNS解析错误时，系统返回的错误信息不够清晰，用户无法准确了解镜像源的具体问题。

## 改进内容

### 1. 改进 `src/utils/dockerService.js` 中的错误处理

#### 主要修改：
- 增强了代理错误响应的处理逻辑
- 添加了对500状态码的特殊处理
- 改进了manifest检查中的错误处理
- 增加了更多网络错误类型的识别

#### 具体改进：

**代理错误响应处理：**
```javascript
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
}
```

**500状态码特殊处理：**
```javascript
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
```

**网络错误类型扩展：**
```javascript
} else if (error.code === 'ECONNREFUSED') {
  message = `连接被拒绝: ${url}`;
} else if (error.code === 'ETIMEDOUT') {
  message = `连接超时: ${url}`;
} else if (error.message && error.message.includes('Couldn\'t resolve host')) {
  message = `DNS解析失败: ${url}`;
}
```

### 2. 改进 `vite.config.js` 中的代理错误处理

#### 主要修改：
- 增强了代理错误信息的详细程度
- 添加了更多错误类型的识别和处理
- 改进了错误响应的JSON结构

#### 具体改进：

**错误类型识别：**
```javascript
// 根据错误类型返回更具体的错误信息
let errorCode = 'UNKNOWN';
let errorMessage = err.message;

if (err.code === 'ENOTFOUND') {
  errorCode = 'ENOTFOUND';
  errorMessage = `Couldn't resolve host: ${mirrorUrl}`;
} else if (err.code === 'ECONNREFUSED') {
  errorCode = 'ECONNREFUSED';
  errorMessage = `Connection refused: ${mirrorUrl}`;
} else if (err.code === 'ETIMEDOUT') {
  errorCode = 'ETIMEDOUT';
  errorMessage = `Connection timeout: ${mirrorUrl}`;
} else if (err.code === 'ECONNRESET') {
  errorCode = 'ECONNRESET';
  errorMessage = `Connection reset: ${mirrorUrl}`;
}
```

**改进的错误响应：**
```javascript
res.end(JSON.stringify({
  error: 'Proxy error',
  message: errorMessage,
  code: errorCode,
  url: mirrorUrl,
}));
```

## 改进效果

### 改进前：
- DNS解析失败时显示："连接失败: Couldn't resolve host"
- 用户无法准确了解具体是哪个镜像源出现问题
- 错误信息不够友好

### 改进后：
- DNS解析失败时显示："DNS解析失败: https://example.com"
- 连接被拒绝时显示："连接被拒绝: https://example.com"
- 连接超时时显示："连接超时: https://example.com"
- 错误信息更加清晰和具体

## 测试验证

创建了测试脚本验证错误处理逻辑的正确性，确保：
1. 代理错误响应能够正确解析
2. 网络错误能够正确识别
3. 错误消息能够正确格式化

## 兼容性

- 保持了与现有代码的完全兼容性
- 不影响正常的镜像检测功能
- 向后兼容所有现有的错误处理逻辑

## 总结

通过这些改进，系统现在能够：
1. 更准确地识别和报告网络错误
2. 提供更友好的错误信息给用户
3. 帮助用户快速定位镜像源的具体问题
4. 提高整体的用户体验
