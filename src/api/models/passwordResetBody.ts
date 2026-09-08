/* eslint-disable */

export interface PasswordResetBody {
  email: string;
  /**
     * @minLength 6
     * @maxLength 6
     */
  code: string;
  /**
     * @minLength 8
     * @maxLength 128
     */
  new_password: string;
}
