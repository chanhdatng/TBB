import { useMemo } from 'react';
import { calculateGeographicStats, getZoneColor, getDeliveryTier } from '../../utils/addressParser';
import { MapPin, TrendingUp, DollarSign, Users, Truck } from 'lucide-react';

const GeographicView = ({ customers }) => {
  const geoStats = useMemo(() =>
    calculateGeographicStats(customers),
    [customers]
  );

  // Format currency
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(num));
  };

  const identificationRate = customers.length > 0
    ? Math.round((geoStats.totalIdentified / customers.length) * 100)
    : 0;

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <MapPin className="w-16 h-16 mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold mb-2">Chưa có dữ liệu địa lý</h3>
        <p className="text-sm">Cần ít nhất một khách hàng để phân tích địa lý</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Phân tích Địa lý TP.HCM</h2>
        <p className="text-gray-600">
          Phân bố khách hàng theo quận/huyện và zone giao hàng
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đã xác định được</p>
              <p className="text-2xl font-bold text-gray-900">{geoStats.totalIdentified}</p>
              <p className="text-xs text-gray-500 mt-1">{identificationRate}% tổng số KH</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Số Zone phủ sóng</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(geoStats.byZone).length}</p>
              <p className="text-xs text-gray-500 mt-1">Trên tổng 6 zone HCM</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Số Quận phủ sóng</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(geoStats.byDistrict).length}</p>
              <p className="text-xs text-gray-500 mt-1">Trên tổng 24 quận HCM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Phân bố theo Zone
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            6 zone chính của TP.HCM
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {geoStats.topZones.map((zone) => {
              const zoneColor = getZoneColor(zone.zone);
              const percentage = customers.length > 0
                ? Math.round((zone.count / customers.length) * 100)
                : 0;

              return (
                <div
                  key={zone.zone}
                  className={`p-5 rounded-lg border-2 ${zoneColor.border} ${zoneColor.bg} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`font-bold text-lg ${zoneColor.text}`}>{zone.zone}</h4>
                    <span className={`text-2xl font-bold ${zoneColor.text}`}>{percentage}%</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className={`flex items-center gap-1 ${zoneColor.text} opacity-80`}>
                        <Users className="w-4 h-4" />
                        Khách hàng
                      </span>
                      <span className={`font-semibold ${zoneColor.text}`}>{zone.count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`flex items-center gap-1 ${zoneColor.text} opacity-80`}>
                        <DollarSign className="w-4 h-4" />
                        Doanh thu
                      </span>
                      <span className={`font-semibold ${zoneColor.text}`}>{formatVND(zone.revenue)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-current opacity-50">
                      <span className={`${zoneColor.text} opacity-80`}>TB Đơn/KH</span>
                      <span className={`font-semibold ${zoneColor.text}`}>{formatNumber(zone.avgOrders)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Districts */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Top 10 Quận/Huyện
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Xếp hạng theo số lượng khách hàng
          </p>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Hạng</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Quận/Huyện</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Zone</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Khách hàng</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Doanh thu</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">TB AOV</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Giao hàng</th>
                </tr>
              </thead>
              <tbody>
                {geoStats.topDistricts.slice(0, 10).map((district, index) => {
                  const deliveryInfo = getDeliveryTier(district.district);
                  const zoneColor = getZoneColor(
                    geoStats.byZone[Object.keys(geoStats.byZone).find(zone =>
                      geoStats.byZone[zone].customers.some(c => c.location?.district === district.district)
                    )]?.customers[0]?.location?.zone
                  );

                  return (
                    <tr
                      key={district.district}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-900">{district.district}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${zoneColor.bg} ${zoneColor.text} border ${zoneColor.border}`}>
                          {geoStats.byZone[Object.keys(geoStats.byZone).find(zone =>
                            geoStats.byZone[zone].customers.some(c => c.location?.district === district.district)
                          )]?.customers[0]?.location?.zone || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-gray-900">{district.count}</td>
                      <td className="py-4 px-4 text-right text-gray-700">{formatVND(district.revenue)}</td>
                      <td className="py-4 px-4 text-right text-gray-700">{formatVND(district.avgOrderValue)}</td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Truck className={`w-4 h-4 ${deliveryInfo.color}`} />
                          <span className={`text-xs font-medium ${deliveryInfo.color}`}>
                            {deliveryInfo.label}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Insights & Khuyến nghị
        </h4>
        <ul className="space-y-2 text-sm text-green-800">
          <li>• <strong>Zone tập trung</strong>: {geoStats.topZones[0]?.zone} có nhiều khách nhất ({geoStats.topZones[0]?.count} KH) - tối ưu logistics tại đây</li>
          <li>• <strong>Giao nhanh (Tier 1)</strong>: Ưu tiên kho hàng/hub tại zone Trung tâm để phục vụ nhanh</li>
          <li>• <strong>Ngoại thành</strong>: Xem xét tăng phí giao hàng hoặc tạo chương trình free ship cho đơn lớn</li>
          <li>• <strong>Mở rộng</strong>: Zone có ít khách có thể là cơ hội marketing chưa khai thác</li>
          <li>• <strong>Tỷ lệ xác định</strong>: {identificationRate}% - {identificationRate < 80 ? 'nên cải thiện thu thập địa chỉ' : 'tốt, tiếp tục duy trì'}</li>
        </ul>
      </div>
    </div>
  );
};

export default GeographicView;
