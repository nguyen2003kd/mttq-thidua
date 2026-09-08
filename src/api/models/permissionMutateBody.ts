/* eslint-disable */

export interface PermissionMutateBody {
  /**
     * @minLength 1
     * @maxLength 255
     */
  name: string;
  /** @nullable */
  description?: string | null;
  /**
     * @minLength 1
     * @maxLength 100
     */
  resource: string;
  /**
     * @minLength 1
     * @maxLength 100
     */
  action: string;
}
