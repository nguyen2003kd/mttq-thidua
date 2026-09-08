/* eslint-disable */

export interface Permission {
  id: string;
  name: string;
  /** @nullable */
  description: string | null;
  resource: string;
  action: string;
  /** @nullable */
  created_at: string | null;
  /** @nullable */
  created_by: string | null;
  /** @nullable */
  updated_by: string | null;
}
