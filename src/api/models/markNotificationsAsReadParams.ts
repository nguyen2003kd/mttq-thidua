/* eslint-disable */
import type { MarkNotificationsAsReadSortOrder } from './markNotificationsAsReadSortOrder.ts';

export type MarkNotificationsAsReadParams = {
/**
 * filter, visit https://www.npmjs.com/package/sequelize-api-paginate for syntax
 */
filters?: string;
/**
 * sortField, visit https://www.npmjs.com/package/sequelize-api-paginate for syntax
 */
sortField?: string;
/**
 * sort order, visit https://www.npmjs.com/package/sequelize-api-paginate for syntax
 */
sortOrder?: MarkNotificationsAsReadSortOrder;
/**
 * page, visit https://www.npmjs.com/package/sequelize-api-paginate for syntax
 * @exclusiveMinimum 0
 */
page?: number;
/**
 * pageSize, visit https://www.npmjs.com/package/sequelize-api-paginate for syntax
 * @maximum 100
 * @exclusiveMinimum 0
 */
pageSize?: number;
};
