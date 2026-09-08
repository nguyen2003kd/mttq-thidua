/* eslint-disable */

export interface UserPublic {
  id: string;
  email: string;
  /** @nullable */
  username: string | null;
  /** @nullable */
  first_name: string | null;
  /** @nullable */
  last_name: string | null;
  status: string;
  /** @nullable */
  avatar_id?: string | null;
  roles: string[];
  permissions: string[];
  /** @nullable */
  last_login_at?: string | null;
}
