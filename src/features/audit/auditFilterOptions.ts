export const actionLabels: Record<string, string> = {
  Created: 'thêm mới',
  Updated: 'cập nhật',
  Deleted: 'xóa',
  Published: 'công bố',
};

export const entityLabels: Record<string, string> = {
  CriteriaGroup: 'nhóm tiêu chí',
  Criteria: 'tiêu chí',
  Submission: 'hồ sơ thi đua',
  SubmissionResult: 'kết quả tiêu chí',
  SubmissionHistory: 'lịch sử hồ sơ',
  ApprovalHistory: 'lịch sử phê duyệt',
  EmulationClassification: 'xếp loại thi đua',
  ScoringConfig: 'cấu hình điểm',
  User: 'tài khoản người dùng',
  UserAuth: 'thông tin xác thực',
  UserRole: 'gán vai trò người dùng',
  Role: 'vai trò người dùng',
  FileEntity: 'tệp tin',
  FileVariant: 'phiên bản tệp tin',
  PublicationBatch: 'đợt công bố',
  FinalDecision: 'quyết định cuối cùng',
  Period: 'kỳ thi đua',
  Cluster: 'cụm thi đua',
  ClusterWard: 'thành viên cụm thi đua',
  Department: 'ban',
};

/** Lọc theo nhóm hành động: BE khớp chính xác hoặc hậu tố "_<mã>".
 * Ví dụ request_revision khớp cả scorer/reviewer/specialist_request_revision. */
export const auditActionFilterOptions: Array<{ value: string; label: string }> = [
  { value: 'created', label: 'Thêm mới' },
  { value: 'updated', label: 'Cập nhật' },
  { value: 'deleted', label: 'Xóa' },
  { value: 'published', label: 'Công bố' },
  { value: 'submit', label: 'Nộp đề xuất' },
  { value: 'score', label: 'Chấm điểm' },
  { value: 'forward', label: 'Gửi duyệt' },
  { value: 'approve', label: 'Phê duyệt' },
  { value: 'request_revision', label: 'Yêu cầu sửa' },
  { value: 'add_criteria', label: 'Bổ sung tiêu chí' },
  { value: 'committee_finalize', label: 'Kết thúc duyệt' },
  { value: 'remind', label: 'Nhắc nhở' },
  { value: 'group_publish', label: 'Công bố nhóm tiêu chí' },
];

export const auditActionFilterLabels: Record<string, string> = Object.fromEntries(
  auditActionFilterOptions.map(({ value, label }) => [value, label]),
);

export const auditEntityFilterOptions = Object.entries(entityLabels).map(
  ([value, label]) => ({ value, label: label.charAt(0).toUpperCase() + label.slice(1) }),
);
