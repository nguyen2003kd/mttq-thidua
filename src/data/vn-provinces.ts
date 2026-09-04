// Vietnamese Provinces Database
// Source: https://github.com/thanglequoc/vietnamese-provinces-database
// 34 tỉnh/thành phố (sắp xếp hành chính mới nhất 2025)

export interface VnProvince {
  code: string;
  name: string;
  fullName: string;
  unitType: 'thanh_pho' | 'tinh';
  region: string;
}

export const vnProvinces: VnProvince[] = [
  { code: '01', name: 'Hà Nội', fullName: 'Thành phố Hà Nội', unitType: 'thanh_pho', region: 'Đồng bằng sông Hồng' },
  { code: '04', name: 'Cao Bằng', fullName: 'Tỉnh Cao Bằng', unitType: 'tinh', region: 'Đông Bắc Bộ' },
  { code: '08', name: 'Tuyên Quang', fullName: 'Tỉnh Tuyên Quang', unitType: 'tinh', region: 'Tây Bắc Bộ' },
  { code: '11', name: 'Điện Biên', fullName: 'Tỉnh Điện Biên', unitType: 'tinh', region: 'Tây Bắc Bộ' },
  { code: '12', name: 'Lai Châu', fullName: 'Tỉnh Lai Châu', unitType: 'tinh', region: 'Tây Bắc Bộ' },
  { code: '14', name: 'Sơn La', fullName: 'Tỉnh Sơn La', unitType: 'tinh', region: 'Tây Bắc Bộ' },
  { code: '15', name: 'Lào Cai', fullName: 'Tỉnh Lào Cai', unitType: 'tinh', region: 'Tây Bắc Bộ' },
  { code: '19', name: 'Thái Nguyên', fullName: 'Tỉnh Thái Nguyên', unitType: 'tinh', region: 'Đông Bắc Bộ' },
  { code: '20', name: 'Lạng Sơn', fullName: 'Tỉnh Lạng Sơn', unitType: 'tinh', region: 'Đông Bắc Bộ' },
  { code: '22', name: 'Quảng Ninh', fullName: 'Tỉnh Quảng Ninh', unitType: 'tinh', region: 'Đông Bắc Bộ' },
  { code: '24', name: 'Bắc Ninh', fullName: 'Tỉnh Bắc Ninh', unitType: 'tinh', region: 'Đồng bằng sông Hồng' },
  { code: '25', name: 'Phú Thọ', fullName: 'Tỉnh Phú Thọ', unitType: 'tinh', region: 'Đồng bằng sông Hồng' },
  { code: '31', name: 'Hải Phòng', fullName: 'Thành phố Hải Phòng', unitType: 'thanh_pho', region: 'Đồng bằng sông Hồng' },
  { code: '33', name: 'Hưng Yên', fullName: 'Tỉnh Hưng Yên', unitType: 'tinh', region: 'Đồng bằng sông Hồng' },
  { code: '37', name: 'Ninh Bình', fullName: 'Tỉnh Ninh Bình', unitType: 'tinh', region: 'Đồng bằng sông Hồng' },
  { code: '38', name: 'Thanh Hoá', fullName: 'Tỉnh Thanh Hoá', unitType: 'tinh', region: 'Bắc Trung Bộ' },
  { code: '40', name: 'Nghệ An', fullName: 'Tỉnh Nghệ An', unitType: 'tinh', region: 'Bắc Trung Bộ' },
  { code: '42', name: 'Hà Tĩnh', fullName: 'Tỉnh Hà Tĩnh', unitType: 'tinh', region: 'Bắc Trung Bộ' },
  { code: '44', name: 'Quảng Trị', fullName: 'Tỉnh Quảng Trị', unitType: 'tinh', region: 'Bắc Trung Bộ' },
  { code: '46', name: 'Huế', fullName: 'Thành phố Huế', unitType: 'thanh_pho', region: 'Bắc Trung Bộ' },
  { code: '48', name: 'Đà Nẵng', fullName: 'Thành phố Đà Nẵng', unitType: 'thanh_pho', region: 'Duyên hải Nam Trung Bộ' },
  { code: '51', name: 'Quảng Ngãi', fullName: 'Tỉnh Quảng Ngãi', unitType: 'tinh', region: 'Duyên hải Nam Trung Bộ' },
  { code: '52', name: 'Gia Lai', fullName: 'Tỉnh Gia Lai', unitType: 'tinh', region: 'Tây Nguyên' },
  { code: '56', name: 'Khánh Hoà', fullName: 'Tỉnh Khánh Hoà', unitType: 'tinh', region: 'Duyên hải Nam Trung Bộ' },
  { code: '66', name: 'Đắk Lắk', fullName: 'Tỉnh Đắk Lắk', unitType: 'tinh', region: 'Tây Nguyên' },
  { code: '68', name: 'Lâm Đồng', fullName: 'Tỉnh Lâm Đồng', unitType: 'tinh', region: 'Tây Nguyên' },
  { code: '75', name: 'Đồng Nai', fullName: 'Thành phố Đồng Nai', unitType: 'thanh_pho', region: 'Đông Nam Bộ' },
  { code: '79', name: 'Hồ Chí Minh', fullName: 'Thành phố Hồ Chí Minh', unitType: 'thanh_pho', region: 'Đông Nam Bộ' },
  { code: '80', name: 'Tây Ninh', fullName: 'Tỉnh Tây Ninh', unitType: 'tinh', region: 'Đông Nam Bộ' },
  { code: '82', name: 'Đồng Tháp', fullName: 'Tỉnh Đồng Tháp', unitType: 'tinh', region: 'Đồng bằng sông Cửu Long' },
  { code: '86', name: 'Vĩnh Long', fullName: 'Tỉnh Vĩnh Long', unitType: 'tinh', region: 'Đồng bằng sông Cửu Long' },
  { code: '91', name: 'An Giang', fullName: 'Tỉnh An Giang', unitType: 'tinh', region: 'Đồng bằng sông Cửu Long' },
  { code: '92', name: 'Cần Thơ', fullName: 'Thành phố Cần Thơ', unitType: 'thanh_pho', region: 'Đồng bằng sông Cửu Long' },
  { code: '96', name: 'Cà Mau', fullName: 'Tỉnh Cà Mau', unitType: 'tinh', region: 'Đồng bằng sông Cửu Long' },
];

export const vnRegions = [
  'Đông Bắc Bộ',
  'Tây Bắc Bộ',
  'Đồng bằng sông Hồng',
  'Bắc Trung Bộ',
  'Duyên hải Nam Trung Bộ',
  'Tây Nguyên',
  'Đông Nam Bộ',
  'Đồng bằng sông Cửu Long',
];
