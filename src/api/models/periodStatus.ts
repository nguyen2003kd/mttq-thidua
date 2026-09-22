/* eslint-disable */

export type PeriodStatus = typeof PeriodStatus[keyof typeof PeriodStatus];


export const PeriodStatus = {
  Draft: 'Draft',
  Active: 'Active',
  Closed: 'Closed',
} as const;
