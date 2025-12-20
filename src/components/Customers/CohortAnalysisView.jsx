import { useMemo } from 'react';
import { buildCohortRetentionData } from '../../utils/customerMetrics';
import { TrendingUp, Users, Calendar } from 'lucide-react';

const CohortAnalysisView = ({ customers, orders }) => {
  const cohortData = useMemo(() =>
    buildCohortRetentionData(customers, orders),
    [customers, orders]
  );

  // Get retention color based on percentage
  const getRetentionColor = (rate) => {
    if (rate >= 50) return 'bg-green-500 text-white';
    if (rate >= 30) return 'bg-yellow-500 text-white';
    if (rate >= 15) return 'bg-orange-500 text-white';
    if (rate > 0) return 'bg-red-500 text-white';
    return 'bg-gray-100 text-gray-400';
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (cohortData.length === 0) return null;

    const totalCohorts = cohortData.length;
    const avgCohortSize = Math.round(
      cohortData.reduce((sum, c) => sum + c.size, 0) / totalCohorts
    );

    // Average retention at month 3 (common benchmark)
    const month3Retention = cohortData
      .filter(c => c.retention.length > 3)
      .map(c => c.retention[3]?.rate || 0);
    const avgMonth3 = month3Retention.length > 0
      ? Math.round(month3Retention.reduce((sum, r) => sum + r, 0) / month3Retention.length)
      : 0;

    return { totalCohorts, avgCohortSize, avgMonth3 };
  }, [cohortData]);

  if (cohortData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Calendar className="w-16 h-16 mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold mb-2">Chưa có dữ liệu Cohort</h3>
        <p className="text-sm">Cần ít nhất 2 tháng dữ liệu để phân tích Cohort Retention</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Phân tích Cohort Retention</h2>
        <p className="text-gray-600">
          Theo dõi tỷ lệ khách hàng quay lại mua hàng theo tháng đăng ký
        </p>
      </div>

      {/* Summary Stats */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng số Cohort</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalCohorts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Trung bình KH/Cohort</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.avgCohortSize}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Retention Tháng 3</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.avgMonth3}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Retention Heatmap</h3>
          <p className="text-sm text-gray-600 mt-1">
            Tỷ lệ % khách hàng quay lại mua hàng sau N tháng kể từ đơn đầu tiên
          </p>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 bg-gray-50 border border-gray-200 font-semibold text-sm text-gray-700 sticky left-0 z-10">
                  Cohort
                </th>
                <th className="p-3 bg-gray-50 border border-gray-200 font-semibold text-sm text-gray-700 min-w-[60px]">
                  Size
                </th>
                {[...Array(12)].map((_, i) => (
                  <th
                    key={i}
                    className="p-3 bg-gray-50 border border-gray-200 font-semibold text-sm text-gray-700 min-w-[60px]"
                  >
                    M{i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortData.map((cohort) => (
                <tr key={cohort.cohort}>
                  <td className="p-3 border border-gray-200 font-medium text-sm text-gray-900 bg-gray-50 sticky left-0 z-10">
                    {cohort.label}
                  </td>
                  <td className="p-3 border border-gray-200 text-center text-sm text-gray-700 bg-white">
                    {cohort.size}
                  </td>
                  {cohort.retention.map((ret, idx) => (
                    <td
                      key={idx}
                      className={`p-3 border border-gray-200 text-center text-sm font-semibold ${getRetentionColor(ret.rate)}`}
                      title={`${ret.active}/${ret.total} khách hàng`}
                    >
                      {ret.rate > 0 ? `${Math.round(ret.rate)}%` : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Chú thích:</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-6 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700">≥ 50% (Tốt)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-6 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-700">30-49% (Khá)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-6 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-700">15-29% (Trung bình)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-6 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-700">1-14% (Thấp)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-6 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-sm text-gray-700">0% (Không có)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Insights
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• <strong>M0</strong>: Tỷ lệ khách quay lại trong tháng đầu tiên (tháng đăng ký)</li>
          <li>• <strong>M3</strong>: Benchmark quan trọng - retention sau 3 tháng</li>
          <li>• <strong>Cohort gần đây</strong>: Có ít dữ liệu hơn do chưa đủ thời gian</li>
          <li>• <strong>Mục tiêu</strong>: Retention M3 {'>'} 30% là tốt cho ngành F&B</li>
        </ul>
      </div>
    </div>
  );
};

export default CohortAnalysisView;
