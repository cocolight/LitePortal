
export const BizCode = {
  SUCCESS:                  { code: 1000, message: 'Success' },

  ICON_NOT_FOUND:           { code: 1001, message: 'Icon not found' },
  USER_NOT_FOUND:           { code: 1002, message: 'User not found' },
  PERMISSION_DENIED:        { code: 1003, message: 'Permission denied' },
  UNSUPPORTED_FORMAT:       { code: 1004, message: 'Icon format not supported' },
  FILE_TOO_LARGE:           { code: 1005, message: 'Icon size too large' },

  MISSING_PARAMETER:        { code: 1009, message: 'Missing parameter' },
  NO_FILE_UPLOADED:         { code: 1010, message: 'No file uploaded' },
  UPLOAD_FAILED:            { code: 1011, message: 'Icon upload failed' },
  ICON_ALREADY_EXISTS:      { code: 1012, message: 'Icon already exists' },

  DELETE_FAILED:            { code: 1020, message: 'Icon deletion failed' },
  ICON_ALREADY_DELETED:     { code: 1021, message: 'Icon already deleted' },

  BATCH_SIZE_EXCEEDED:      { code: 1030, message: 'Batch size exceeded' },
  PARTIAL_SUCCESS:          { code: 1031, message: 'Partial success' },
  ALL_ICONS_NOT_FOUND:      { code: 1032, message: 'All icons not found' },
} as const;

export type BizCodeKey = keyof typeof BizCode;