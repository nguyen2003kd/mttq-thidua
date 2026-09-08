/* eslint-disable */

export interface RegisterBody {
  email: string;
  /**
     * @minLength 1
     * @maxLength 128
     */
  password: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  /** @pattern ^\+?[1-9]\d{9,14}$ */
  phone?: string;
}
