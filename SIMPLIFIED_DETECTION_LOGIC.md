# Docker镜像检测工具 - 简化检测逻辑

## 修改概述

根据用户需求，将Docker镜像检测逻辑简化为只检查 `/v2` 端点，采用"只要有返回就是可用的，无返回或请求空的为不可用"的策略。

## 主要修改

### 1. 简化检测逻辑

**修改前：**
- 检查 `/v2` 端点
- 检查 `hello-world` 镜像的 manifest
- 复杂的可用性判断逻辑
- 多个状态码的复杂处理

**修改后：**
- 只检查 `/v2` 端点
- 简化的可用性判断：`response.status >= 200 && response.status < 500`
- 空响应检查：对象为空、字符串为空、null值
- 保留特殊状态码的友好提示

### 2. 具体代码变更

#### 移除的复杂逻辑：
```javascript
// 移除了manifest检查
const testImage = `/api/v2/library/hello-world/manifests/latest`;
const manifestResponse = await axios.get(testImage, ...);

// 移除了复杂的可用性判断
const isAvailable = ACCEPTABLE_STATUSES.includes(manifestResponse.status) &&
                  !isManifestEmpty &&
                  responseTime <= RESPONSE_TIME_THRESHOLD.POOR;
```

#### 新增的简化逻辑：
```javascript
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
}
```

### 3. 移除的常量

```javascript
// 移除了不再需要的常量
// const ACCEPTABLE_STATUSES = [200, 401, 403, 429];
```

## 检测逻辑说明

### 可用性判断标准

1. **HTTP状态码检查**：`response.status >= 200 && response.status < 500`
   - 200-499 状态码被认为是可接受的
   - 500+ 状态码被认为是服务器错误

2. **空响应检查**：
   - `null` 或 `undefined` 响应
   - 空对象 `{}`
   - 空字符串 `""` 或只包含空白字符的字符串

3. **特殊状态码处理**：
   - 401：需要认证但可用
   - 403：需要认证但可用
   - 429：限流但可能可用

### 性能评估

保持原有的性能评估逻辑：
- `responseTime <= 1000ms`：excellent
- `responseTime <= 3000ms`：good
- `responseTime > 3000ms`：poor

## 优势

### 1. 简化性
- 减少了检测步骤，提高检测速度
- 逻辑更清晰，易于维护
- 减少了网络请求数量

### 2. 准确性
- 大多数Docker Registry的 `/v2` 端点都能正确响应
- 避免了因特定镜像不可用而误判整个服务不可用的情况

### 3. 兼容性
- 保持了与现有错误处理逻辑的兼容性
- 保留了用户友好的错误信息
- 不影响现有的UI和用户体验

## 测试验证

通过测试脚本验证了以下场景：
- ✅ 正常响应 (200)
- ✅ 需要认证 (401/403)
- ✅ 限流 (429)
- ✅ 空响应对象
- ✅ 空响应字符串
- ✅ null响应
- ✅ 服务器错误 (500)
- ✅ DNS解析失败

## 总结

这次修改成功简化了Docker镜像检测逻辑，使其更加高效和可靠：

1. **检测速度提升**：减少了不必要的manifest检查
2. **逻辑更清晰**：简化的判断条件更容易理解和维护
3. **保持准确性**：仍然能够正确识别可用的镜像服务
4. **用户体验**：保持了友好的错误信息和状态显示

新的检测逻辑符合"只要有返回就是可用的，无返回或请求空的为不可用"的要求，同时保持了系统的稳定性和用户体验。
