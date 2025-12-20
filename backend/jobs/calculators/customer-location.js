/**
 * TP.HCM Address Parser (Backend Port)
 * Parse addresses to extract district and zone information
 *
 * Ported from: web/src/utils/addressParser.js
 * Changes: ES6 exports → CommonJS
 */

// Complete list of 24 districts in Ho Chi Minh City
const HCM_DISTRICTS = [
  // Inner-city districts
  { name: 'Quận 1', aliases: ['q1', 'quan 1', 'q.1'], zone: 'Trung tâm' },
  { name: 'Quận 2', aliases: ['q2', 'quan 2', 'q.2', 'thu duc q2'], zone: 'Đông' },
  { name: 'Quận 3', aliases: ['q3', 'quan 3', 'q.3'], zone: 'Trung tâm' },
  { name: 'Quận 4', aliases: ['q4', 'quan 4', 'q.4'], zone: 'Nam' },
  { name: 'Quận 5', aliases: ['q5', 'quan 5', 'q.5'], zone: 'Trung tâm' },
  { name: 'Quận 6', aliases: ['q6', 'quan 6', 'q.6'], zone: 'Tây' },
  { name: 'Quận 7', aliases: ['q7', 'quan 7', 'q.7'], zone: 'Nam' },
  { name: 'Quận 8', aliases: ['q8', 'quan 8', 'q.8'], zone: 'Nam' },
  { name: 'Quận 9', aliases: ['q9', 'quan 9', 'q.9', 'thu duc q9'], zone: 'Đông' },
  { name: 'Quận 10', aliases: ['q10', 'quan 10', 'q.10'], zone: 'Trung tâm' },
  { name: 'Quận 11', aliases: ['q11', 'quan 11', 'q.11'], zone: 'Tây' },
  { name: 'Quận 12', aliases: ['q12', 'quan 12', 'q.12'], zone: 'Bắc' },

  // Other districts
  { name: 'Thủ Đức', aliases: ['thu duc', 'thủ đức', 'tp thu duc'], zone: 'Đông' },
  { name: 'Bình Thạnh', aliases: ['binh thanh', 'bình thạnh', 'q binh thanh'], zone: 'Bắc' },
  { name: 'Tân Bình', aliases: ['tan binh', 'tân bình', 'q tan binh'], zone: 'Tây' },
  { name: 'Tân Phú', aliases: ['tan phu', 'tân phú', 'q tan phu'], zone: 'Tây' },
  { name: 'Phú Nhuận', aliases: ['phu nhuan', 'phú nhuận', 'q phu nhuan'], zone: 'Trung tâm' },
  { name: 'Gò Vấp', aliases: ['go vap', 'gò vấp', 'q go vap'], zone: 'Bắc' },
  { name: 'Bình Tân', aliases: ['binh tan', 'bình tân', 'q binh tan'], zone: 'Tây' },

  // Suburban districts
  { name: 'Hóc Môn', aliases: ['hoc mon', 'hóc môn', 'h hoc mon'], zone: 'Ngoại thành' },
  { name: 'Củ Chi', aliases: ['cu chi', 'củ chi', 'h cu chi'], zone: 'Ngoại thành' },
  { name: 'Bình Chánh', aliases: ['binh chanh', 'bình chánh', 'h binh chanh'], zone: 'Ngoại thành' },
  { name: 'Nhà Bè', aliases: ['nha be', 'nhà bè', 'h nha be'], zone: 'Nam' },
  { name: 'Cần Giờ', aliases: ['can gio', 'cần giờ', 'h can gio'], zone: 'Ngoại thành' }
];

/**
 * Parse address to extract district and zone
 * @param {string} address - Full address
 * @returns {Object} { district, zone, raw }
 */
function parseAddress(address) {
  if (!address) {
    return { district: 'Unknown', zone: 'Unknown', raw: '' };
  }

  const addressLower = address.toLowerCase()
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Find district in address
  for (const districtInfo of HCM_DISTRICTS) {
    // Check exact name
    if (addressLower.includes(districtInfo.name.toLowerCase())) {
      return {
        district: districtInfo.name,
        zone: districtInfo.zone,
        raw: address
      };
    }

    // Check aliases
    for (const alias of districtInfo.aliases) {
      if (addressLower.includes(alias)) {
        return {
          district: districtInfo.name,
          zone: districtInfo.zone,
          raw: address
        };
      }
    }
  }

  // Not found
  return { district: 'Unknown', zone: 'Unknown', raw: address };
}

module.exports = {
  parseAddress,
  HCM_DISTRICTS
};
