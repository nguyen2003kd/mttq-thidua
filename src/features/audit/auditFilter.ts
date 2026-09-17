import type { CriteriaTable } from '@/types/domain';

export interface ParsedAuditField {
  criteriaId?: string;
  localityId?: string;
}

/**
 * Parse fieldName của AuditEntry — format hiện tại:
 *  - "c1 - loc-25195"  (tiêu chí - địa phương)
 *  - "state - loc-26068" (chuyển trạng thái hồ sơ, không gắn tiêu chí)
 */
export function parseAuditField(fieldName: string): ParsedAuditField {
  const [rawCriteria, rawLocality] = fieldName.split(' - ').map((part) => part.trim());
  return {
    criteriaId: rawCriteria && rawCriteria !== 'state' ? rawCriteria : undefined,
    localityId: rawLocality || undefined,
  };
}

/** Map criteriaId → bảng tiêu chí chứa nó (nhóm tiêu chí). */
export function tableOfCriteria(criteriaId: string, tables: CriteriaTable[]): CriteriaTable | undefined {
  return tables.find((table) => table.criteria.some((c) => c.id === criteriaId));
}
