/* eslint-disable */

export interface FileMutateBody {
  /**
     * @maxLength 150
     * @nullable
     */
  title?: string | null;
  /**
     * @maxLength 500
     * @nullable
     */
  description?: string | null;
  /**
     * @maxLength 255
     * @nullable
     */
  note?: string | null;
  is_library?: boolean;
}
