/* eslint-disable */

export interface RoleMutateBody {
  /**
     * @minLength 1
     * @maxLength 100
     */
  name: string;
  /** @nullable */
  description?: string | null;
}
