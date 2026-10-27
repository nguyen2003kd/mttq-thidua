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

export const businessActionFilterLabels: Record<string, string> = {
  local_submit: 'Nộp đề xuất',
  scorer_score: 'Chấm điểm',
  scorer_forward: 'Gửi duyệt',
  reviewer_approve: 'Phê duyệt',
  reviewer_score: 'Điều chỉnh điểm',
  specialist_approve: 'Duyệt hồ sơ',
  specialist_score: 'Thẩm định điểm',
  scorer_request_revision: 'Yêu cầu sửa (Người chấm điểm)',
  reviewer_request_revision: 'Yêu cầu sửa (Lãnh đạo ban)',
  specialist_request_revision: 'Yêu cầu sửa (Chuyên viên thi đua)',
  scorer_add_criteria: 'Bổ sung tiêu chí (Người chấm điểm)',
  reviewer_add_criteria: 'Bổ sung tiêu chí (Lãnh đạo ban)',
  specialist_add_criteria: 'Bổ sung tiêu chí (Chuyên viên thi đua)',
  committee_finalize: 'Kết thúc duyệt',
  remind: 'Nhắc nhở',
  group_publish: 'Công bố nhóm tiêu chí',
};

/** Mỗi mã nghiệp vụ vẫn có lựa chọn riêng, nhãn phân biệt theo cấp thực hiện. */
const capitalize = (label: string) => label.charAt(0).toUpperCase() + label.slice(1);

export const auditActionFilterOptions = [
  ...Object.entries(actionLabels).map(([value, label]) => ({ value, label: capitalize(label) })),
  ...Object.entries(businessActionFilterLabels).map(([value, label]) => ({ value, label })),
];

export const auditEntityFilterOptions = Object.entries(entityLabels)
  .map(([value, label]) => ({ value, label: capitalize(label) }));
