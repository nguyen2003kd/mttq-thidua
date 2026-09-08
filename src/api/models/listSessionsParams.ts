/* eslint-disable */
import type { ListSessionsSortOrder } from './listSessionsSortOrder.ts';

export type ListSessionsParams = {
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
sortOrder?: ListSessionsSortOrder;
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
