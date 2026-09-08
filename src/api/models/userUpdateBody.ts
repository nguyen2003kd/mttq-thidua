/* eslint-disable */

export interface UserUpdateBody {
  /**
     * @minLength 3
     * @maxLength 50
     */
  username?: string;
  /**
     * @minLength 1
     * @maxLength 100
     */
  first_name?: string;
  /**
     * @minLength 1
     * @maxLength 100
     */
  last_name?: string;
  /** @pattern ^\+?[1-9]\d{9,14}$ */
  phone?: string;
  /** @nullable */
  avatar_id?: string | null;
}
