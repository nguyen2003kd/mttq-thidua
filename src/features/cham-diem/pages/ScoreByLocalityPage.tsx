import SpecialistReviewPage from './SpecialistReviewPage';

/**
 * Route /thi-dua/cham-diem/:diaPhuongId[/:nhomTieuChiId] — tái dùng toàn bộ
 * flow chấm điểm (danh sách nhóm tiêu chí → chi tiết chấm) của trang Chuyên viên,
 * chỉ đổi basePath điều hướng về /thi-dua/cham-diem.
 */
export default function ScoreByLocalityPage() {
  return <SpecialistReviewPage basePath="/thi-dua/cham-diem" />;
}
