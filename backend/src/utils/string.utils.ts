// src/utils/string.utils.ts

/**
 * 将蛇形命名转换为驼峰命名
 * @param str 蛇形命名字符串 (如: online_icon)
 * @returns 驼峰命名字符串 (如: onlineIcon)
 */
export function snakeToCamel(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

/**
 * 将驼峰命名转换为蛇形命名
 * @param str 驼峰命名字符串 (如: onlineIcon)
 * @returns 蛇形命名字符串 (如: online_icon)
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * 递归转换对象的所有键名从蛇形到驼峰（处理循环引用）
 */
export function transformKeysToCamelCase(obj: any): any {
  // 使用WeakMap来跟踪已处理的对象，避免循环引用
  const seen = new WeakMap();

  return _transformKeysToCamelCase(obj, seen);
}

/**
 * 内部递归函数，处理循环引用
 */
function _transformKeysToCamelCase(obj: any, seen: WeakMap<any, any>): any {
  // 处理基本类型
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  // 处理日期对象
  if (obj instanceof Date) {
    return obj;
  }

  // 检查是否已经处理过这个对象（避免循环引用）
  if (seen.has(obj)) {
    return seen.get(obj);
  }

  // 处理数组
  if (Array.isArray(obj)) {
    const transformedArray: any[] = [];
    seen.set(obj, transformedArray); // 在转换前先记录，避免循环引用

    for (let i = 0; i < obj.length; i++) {
      transformedArray[i] = _transformKeysToCamelCase(obj[i], seen);
    }

    return transformedArray;
  }

  // 处理普通对象
  const transformedObj: any = {};
  seen.set(obj, transformedObj); // 在转换前先记录，避免循环引用

  for (const key of Object.keys(obj)) {
    const camelKey = snakeToCamel(key);
    const value = obj[key];

    // 递归转换值
    transformedObj[camelKey] = _transformKeysToCamelCase(value, seen);
  }

  return transformedObj;
}

/**
 * 安全版本的转换函数，带有错误处理
 */
export function safeTransformKeysToCamelCase(obj: any, maxDepth: number = 20): any {
  try {
    return _safeTransformKeysToCamelCase(obj, maxDepth);
  } catch (error) {
    console.warn('键名转换失败，返回原始对象:', error);
    return obj;
  }
}

function _safeTransformKeysToCamelCase(obj: any, maxDepth: number, currentDepth: number = 0): any {
  // 防止递归过深
  if (currentDepth > maxDepth) {
    return obj;
  }

  // 处理基本类型
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  // 处理日期对象
  if (obj instanceof Date) {
    return obj;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => _safeTransformKeysToCamelCase(item, maxDepth, currentDepth + 1));
  }

  // 处理普通对象（使用Set来检测循环引用）
  const seen = new Set();
  const transformedObj: any = {};

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    // 检测循环引用
    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        transformedObj[snakeToCamel(key)] = '[Circular]';
        continue;
      }
      seen.add(value);
    }

    transformedObj[snakeToCamel(key)] = _safeTransformKeysToCamelCase(value, maxDepth, currentDepth + 1);
  }

  return transformedObj;
}