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
 * 递归转换对象的所有键名从蛇形到驼峰
 */
export function transformKeysToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToCamelCase(item));
  }

  if (obj !== null && obj !== undefined && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = snakeToCamel(key);
      acc[camelKey] = transformKeysToCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
}