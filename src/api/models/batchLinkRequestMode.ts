/* eslint-disable */

export type BatchLinkRequestMode = typeof BatchLinkRequestMode[keyof typeof BatchLinkRequestMode];


export const BatchLinkRequestMode = {
  view: 'view',
  download: 'download',
} as const;
