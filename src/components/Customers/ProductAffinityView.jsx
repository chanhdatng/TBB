import { useMemo } from 'react';
import { analyzeProductAffinityBySegment } from '../../utils/customerMetrics';
import { ShoppingBag, TrendingUp, DollarSign, Package } from 'lucide-react';

const ProductAffinityView = ({ customers, orders }) => {
  const affinityData = useMemo(() =>
    analyzeProductAffinityBySegment(customers, orders),
    [customers, orders]
  );

  // Calculate overall top products
  const topProducts = useMemo(() => {
    const productTotals = {};
    const productRevenue = {};

    orders.forEach(order => {
      order.items?.forEach(item => {
        if (item.name) {
          const amount = item.amount || 1;
          const price = item.price || 0;
          productTotals[item.name] = (productTotals[item.name] || 0) + amount;
          productRevenue[item.name] = (productRevenue[item.name] || 0) + (price * amount);
        }
      });
    });

    return Object.entries(productTotals)
      .map(([name, quantity]) => ({
        name,
        quantity,
        revenue: productRevenue[name] || 0
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [orders]);

  // Get RFM segment color
  const getSegmentColor = (segment) => {
    const colors = {
      'Champions': 'bg-purple-100 text-purple-800 border-purple-300',
      'Loyal': 'bg-blue-100 text-blue-800 border-blue-300',
      'Potential': 'bg-green-100 text-green-800 border-green-300',
      'Promising': 'bg-teal-100 text-teal-800 border-teal-300',
      'Need Attention': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'About to Sleep': 'bg-orange-100 text-orange-800 border-orange-300',
      'At Risk': 'bg-red-100 text-red-800 border-red-300',
      'Lost': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[segment] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Format currency
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (topProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Package className="w-16 h-16 mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold mb-2">Chưa có dữ liệu sản phẩm</h3>
        <p className="text-sm">Cần ít nhất một đơn hàng để phân tích sản phẩm</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Phân tích Sản phẩm</h2>
        <p className="text-gray-600">
          Sản phẩm phổ biến và xu hướng mua hàng theo phân khúc khách hàng
        </p>
      </div>

      {/* Top 10 Products Overall */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Top 10 Sản phẩm Bán chạy
          </h3>
          <p className="text-sm text-gray-600 mt-1">Xếp hạng theo tổng số lượng đã bán</p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {product.quantity} đã bán
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {formatVND(product.revenue)}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Doanh thu</div>
                    <div className="font-bold text-gray-900">{formatVND(product.revenue)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Affinity by RFM Segment */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-600" />
            Sản phẩm Yêu thích theo Phân khúc
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Top sản phẩm mỗi nhóm khách hàng RFM thích mua nhất
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(affinityData.bySegment).map(([segment, products]) => {
              const topSegmentProducts = products.slice(0, 5);
              if (topSegmentProducts.length === 0) return null;

              return (
                <div
                  key={segment}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className={`p-4 border-b ${getSegmentColor(segment)}`}>
                    <h4 className="font-semibold">{segment}</h4>
                    <p className="text-xs mt-1 opacity-80">
                      {topSegmentProducts.reduce((sum, p) => sum + p.quantity, 0)} sản phẩm đã mua
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {topSegmentProducts.map((product, idx) => (
                        <div
                          key={product.name}
                          className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-700">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </span>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {product.quantity}
                            </div>
                            <div className="text-xs text-gray-500">đã bán</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Insights & Khuyến nghị
        </h4>
        <ul className="space-y-2 text-sm text-purple-800">
          <li>• <strong>Champions & Loyal</strong>: Nhóm này thường mua sản phẩm cao cấp - nên ưu tiên marketing sản phẩm mới</li>
          <li>• <strong>Potential & Promising</strong>: Tạo combo/bundle với sản phẩm họ đã mua để tăng AOV</li>
          <li>• <strong>At Risk & Lost</strong>: Gửi khuyến mãi cho sản phẩm họ từng thích để kích hoạt lại</li>
          <li>• <strong>Cross-sell</strong>: Nếu sản phẩm A và B cùng xuất hiện nhiều, tạo combo để tăng sales</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductAffinityView;
