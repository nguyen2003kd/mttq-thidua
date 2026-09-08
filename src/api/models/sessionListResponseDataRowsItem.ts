/* eslint-disable */

export type SessionListResponseDataRowsItem = {
  id: string;
  platform: string;
  /** @nullable */
  device_id: string | null;
  /** @nullable */
  device_name: string | null;
  /** @nullable */
  ip_address: string | null;
  /** @nullable */
  user_agent: string | null;
  last_activity_at: string;
  created_at: string;
  expires_at: string;
};
