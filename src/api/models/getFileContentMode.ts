/* eslint-disable */

export type GetFileContentMode = typeof GetFileContentMode[keyof typeof GetFileContentMode];


export const GetFileContentMode = {
  view: 'view',
  download: 'download',
} as const;
