import { describe, expect, it } from 'vitest';
import { getNotificationTarget, parseNotificationPayload } from './notificationNavigation';

describe('parseNotificationPayload', () => {
  it('parse JSON object hợp lệ', () => {
    const payload = parseNotificationPayload('{"eventType":"revision_requested","criteriaGroupId":"g1"}');
    expect(payload).toEqual({ eventType: 'revision_requested', criteriaGroupId: 'g1' });
  });

  it('trả null với chuỗi rỗng / JSON lỗi / mảng', () => {
    expect(parseNotificationPayload(null)).toBeNull();
    expect(parseNotificationPayload('')).toBeNull();
    expect(parseNotificationPayload('not-json')).toBeNull();
    expect(parseNotificationPayload('[1,2]')).toBeNull();
  });
});

describe('getNotificationTarget — thông báo cho địa phương', () => {
  const local = 'LOCAL' as const;

  it('revision_requested → trang nhóm tiêu chí của địa phương', () => {
    const target = getNotificationTarget(
      parseNotificationPayload('{"eventType":"revision_requested","criteriaGroupId":"g1"}'),
      local,
      '25195',
    );
    expect(target).toEqual({ to: '/dia-phuong/tieu-chi/g1' });
  });

  it('criteria_group_applied → vào thẳng nhóm đầu tiên', () => {
    const target = getNotificationTarget(
      parseNotificationPayload('{"eventType":"criteria_group_applied","criteriaGroupIds":["g1","g2"]}'),
      local,
      '25195',
    );
    expect(target).toEqual({ to: '/dia-phuong/tieu-chi/g1' });
  });

  it('criteria_group_applied với criteriaGroupId đơn → nhóm đó', () => {
    const target = getNotificationTarget(
      parseNotificationPayload('{"eventType":"criteria_group_applied","criteriaGroupId":"g9"}'),
      local,
      null,
    );
    expect(target).toEqual({ to: '/dia-phuong/tieu-chi/g9' });
  });

  it('result_published → trang kết quả kèm periodId', () => {
    const target = getNotificationTarget(
      parseNotificationPayload('{"eventType":"result_published","periodId":"p1"}'),
      local,
      '25195',
    );
    expect(target).toEqual({ to: '/dia-phuong/ket-qua?periodId=p1' });
  });

  it('submission_reminder → trang danh sách tiêu chí', () => {
    const target = getNotificationTarget(
      parseNotificationPayload('{"eventType":"submission_reminder","wardCode":"25195"}'),
      local,
      '25195',
    );
    expect(target).toEqual({ to: '/dia-phuong/tieu-chi' });
  });

  it('submission_reminder có kỳ → trang tiêu chí của kỳ đó', () => {
    const target = getNotificationTarget(
      parseNotificationPayload('{"eventType":"submission_reminder","wardCode":"25195","periodId":"p9"}'),
      local,
      '25195',
    );
    expect(target).toEqual({ to: '/dia-phuong/tieu-chi?periodId=p9' });
  });

  it('supplementary_criteria_added → trang nhóm tiêu chí', () => {
    const target = getNotificationTarget(
      parseNotificationPayload('{"eventType":"supplementary_criteria_added","criteriaGroupId":"g3"}'),
      local,
      '25195',
    );
    expect(target).toEqual({ to: '/dia-phuong/tieu-chi/g3' });
  });
});

describe('getNotificationTarget — thông báo cho cấp xử lý', () => {
  it('scorer_revision_requested → trang chấm điểm của SCORER', () => {
    const target = getNotificationTarget(
      parseNotificationPayload('{"eventType":"scorer_revision_requested","criteriaGroupId":"g1","wardCode":"loc-25195"}'),
      'SCORER',
      null,
    );
    expect(target).toEqual({ to: '/thi-dua/cham-diem/25195/g1' });
  });

  it('reviewer_revision_requested → trang duyệt của REVIEWER', () => {
    const target = getNotificationTarget(
      parseNotificationPayload('{"eventType":"reviewer_revision_requested","criteriaGroupId":"g1","wardCode":"25195"}'),
      'REVIEWER',
      null,
    );
    expect(target).toEqual({ to: '/chuyen-vien/duyet/25195/g1' });
  });

  it('specialist_review_requested → trang duyệt của SPECIALIST', () => {
    const target = getNotificationTarget(
      parseNotificationPayload('{"eventType":"specialist_review_requested","criteriaGroupId":"g1","wardCode":"25195"}'),
      'SPECIALIST',
      null,
    );
    expect(target).toEqual({ to: '/chuyen-vien/duyet/25195/g1' });
  });

  it('thông báo cấp xử lý thiếu wardCode → không điều hướng', () => {
    const target = getNotificationTarget(
      parseNotificationPayload('{"eventType":"scorer_revision_requested","criteriaGroupId":"g1"}'),
      'SCORER',
      null,
    );
    expect(target).toBeNull();
  });

  it('role không khớp eventType → không điều hướng', () => {
    const target = getNotificationTarget(
      parseNotificationPayload('{"eventType":"scorer_revision_requested","criteriaGroupId":"g1","wardCode":"25195"}'),
      'LOCAL',
      '25195',
    );
    expect(target).toBeNull();
  });
});

describe('getNotificationTarget — fallback', () => {
  it('eventType lạ → null', () => {
    const target = getNotificationTarget(
      parseNotificationPayload('{"eventType":"unknown_event"}'),
      'LOCAL',
      '25195',
    );
    expect(target).toBeNull();
  });

  it('payload null → null', () => {
    expect(getNotificationTarget(null, 'LOCAL', '25195')).toBeNull();
  });
});
