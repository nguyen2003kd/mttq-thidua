import type { Role } from '@/types/domain';

/** Dữ liệu điều hướng parse từ trường `data` (JSON) của thông báo. */
export interface NotificationPayload {
  eventType?: string;
  submissionId?: string;
  criteriaGroupId?: string;
  criteriaGroupIds?: string[];
  criteriaId?: string;
  wardCode?: string | null;
  periodId?: string;
}

export interface NotificationTarget {
  to: string;
}

/** Parse chuỗi JSON `data` của thông báo an toàn — trả null nếu không phải JSON object. */
export function parseNotificationPayload(data: string | null | undefined): NotificationPayload | null {
  if (!data) return null;
  try {
    const parsed = JSON.parse(data) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as NotificationPayload;
  } catch {
    return null;
  }
}

/** Mã địa phương chuẩn hóa: bỏ tiền tố "loc-" nếu có. */
function normalizeWardCode(code: string | null | undefined) {
  return code?.trim().replace(/^loc-/i, '') ?? '';
}

/**
 * Xác định route đích khi người dùng bấm vào thông báo, theo eventType + role.
 * Trả null nếu không có đích phù hợp (chỉ đánh dấu đã đọc).
 */
export function getNotificationTarget(
  payload: NotificationPayload | null,
  role: Role | undefined,
  fallbackWardCode: string | null | undefined,
): NotificationTarget | null {
  if (!payload?.eventType) return null;

  const eventType = payload.eventType;
  // Địa phương nhận thông báo → dùng ward của chính người nhận nếu payload không có.
  const wardCode = normalizeWardCode(payload.wardCode) || normalizeWardCode(fallbackWardCode);

  switch (eventType) {
    case 'revision_requested':
    case 'supplementary_criteria_added':
    case 'criteria_added':
    case 'criteria_updated':
    case 'criteria_disabled':
      return payload.criteriaGroupId ? { to: `/dia-phuong/tieu-chi/${payload.criteriaGroupId}` } : null;

    case 'criteria_group_applied':
    case 'criteria_group_updated': {
      // Vào thẳng nhóm đầu tiên trong danh sách được giao.
      const groupId = payload.criteriaGroupId ?? payload.criteriaGroupIds?.[0];
      return groupId ? { to: `/dia-phuong/tieu-chi/${groupId}` } : null;
    }

    case 'result_published':
      return payload.periodId ? { to: `/dia-phuong/ket-qua?periodId=${encodeURIComponent(payload.periodId)}` } : null;

    case 'submission_reminder':
      // Có kỳ trong payload (nhắc nhở khi công bố) → vào đúng kỳ đó; không có → trang tiêu chí chung.
      return payload.periodId
        ? { to: `/dia-phuong/tieu-chi?periodId=${encodeURIComponent(payload.periodId)}` }
        : { to: '/dia-phuong/tieu-chi' };

    case 'scorer_revision_requested':
      if (role !== 'SCORER' || !wardCode || !payload.criteriaGroupId) return null;
      return { to: `/thi-dua/cham-diem/${wardCode}/${payload.criteriaGroupId}` };

    case 'reviewer_revision_requested':
    case 'specialist_review_requested':
      if ((role !== 'REVIEWER' && role !== 'SPECIALIST') || !wardCode || !payload.criteriaGroupId) return null;
      return { to: `/chuyen-vien/duyet/${wardCode}/${payload.criteriaGroupId}` };

    default:
      return null;
  }
}
