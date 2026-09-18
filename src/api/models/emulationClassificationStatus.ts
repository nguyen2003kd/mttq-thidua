/* eslint-disable */

export type EmulationClassificationStatus = typeof EmulationClassificationStatus[keyof typeof EmulationClassificationStatus];


export const EmulationClassificationStatus = {
  Active: 'Active',
  Inactive: 'Inactive',
} as const;
