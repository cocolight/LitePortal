
export const BizCode = {
  SUCCESS:                  { code: 1000, message: 'Success' , desc: '通用成功'},

  ICON_NOT_FOUND:           { code: 1001, message: 'Icon not found', desc: '单个图标未找到' },
  USER_NOT_FOUND:           { code: 1002, message: 'User not found' , desc: '用户ID无效'},
  PERMISSION_DENIED:        { code: 1003, message: 'Permission denied' ,desc: '无权访问/操作'},
  UNSUPPORTED_FORMAT:       { code: 1004, message: 'Icon format not supported' ,desc: '不支持的图标格式' },
  FILE_TOO_LARGE:           { code: 1005, message: 'Icon size too large', desc: '图标文件过大' },

  MISSING_PARAMETER:        { code: 1009, message: 'Missing parameter', desc: '通用缺少参数'},
  NO_FILE_UPLOADED:         { code: 1010, message: 'No file uploaded' ,desc: '未上传文件'},
  UPLOAD_FAILED:            { code: 1011, message: 'Icon upload failed' ,desc: '服务器写入/COS失败' },
  ICON_ALREADY_EXISTS:      { code: 1012, message: 'Icon already exists', desc: '图标已存在' },

  DELETE_FAILED:            { code: 1020, message: 'Icon deletion failed', desc: '服务器删除/COS删除失败'},
  ICON_ALREADY_DELETED:     { code: 1021, message: 'Icon already deleted', desc: '重复删除' },

  BATCH_SIZE_EXCEEDED:      { code: 1030, message: 'Batch size exceeded', desc: '批量上传数量超过限制20'},
  PARTIAL_SUCCESS:          { code: 1031, message: 'Partial success', desc: '批量部分成功'},
  ALL_ICONS_NOT_FOUND:      { code: 1032, message: 'All icons not found', desc: '批量全部未找到' },
} as const;

export type BizCodeKey = keyof typeof BizCode;