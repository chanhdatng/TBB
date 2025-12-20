# Phase 1 Initialization Scripts

Scripts để khởi tạo Firebase schema cho Product Analytics System.

## 📋 Danh sách Scripts

### 1. `firebase-config.js`
Helper module để khởi tạo Firebase Admin SDK. Hỗ trợ 2 phương thức:
- Service account key file (`backend/serviceAccountKey.json`)
- Environment variables (trong `backend/.env`)

### 2. `add-product-fields.js`
Thêm các trường mới vào products collection:
- `cost`: Giá vốn sản phẩm (VND)
- `costLastUpdated`: Thời điểm cập nhật giá vốn
- `targetMargin`: Mục tiêu lợi nhuận (%)

### 3. `init-product-analytics.js`
Khởi tạo `productAnalytics` collection với structure đầy đủ cho từng sản phẩm.

### 4. `init-timeseries.js`
Khởi tạo `productTimeSeries` collection cho 3 sản phẩm test (tháng hiện tại).

### 5. `init-rankings.js`
Khởi tạo `globalRankings/current` document với structure rỗng.

### 6. `test-permissions.js`
Test write permissions cho tất cả collections mới.

### 7. `run-all.js` ⭐
**Master script** - chạy tất cả scripts theo thứ tự.

---

## 🚀 Cách sử dụng

### Option 1: Chạy tất cả (Recommended)

```bash
cd scripts
node run-all.js
```

### Option 2: Chạy từng script riêng lẻ

```bash
cd scripts
node test-permissions.js        # Test trước
node add-product-fields.js      # Thêm fields vào products
node init-product-analytics.js  # Khởi tạo analytics
node init-timeseries.js         # Khởi tạo time-series
node init-rankings.js           # Khởi tạo rankings
```

---

## ⚙️ Cấu hình Firebase Credentials

### Method 1: Service Account Key (Recommended)

1. Tải service account key từ Firebase Console
2. Lưu file tại: `backend/serviceAccountKey.json`
3. Chạy scripts (tự động detect file)

### Method 2: Environment Variables

Thêm vào `backend/.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

---

## ✅ Kiểm tra kết quả

Sau khi chạy xong, kiểm tra trong Firebase Console:

### 1. Products (cakes)
- Mở 1 product bất kỳ
- Kiểm tra có 3 fields mới: `cost`, `costLastUpdated`, `targetMargin`

### 2. productAnalytics
- Có document cho mỗi productId
- Structure đầy đủ: lifetime, recent30Days, recent7Days, trend, rankings, flags

### 3. productTimeSeries
- Có documents cho 3 products test
- Path: `{productId}/{YYYY-MM}`
- Daily data cho tất cả ngày trong tháng

### 4. globalRankings
- Có document tại path: `globalRankings/current`
- Arrays rỗng: topSellers, topRevenue, slowMovers, trending, topProfit

---

## 🐛 Troubleshooting

### Error: Firebase credentials not found
- Kiểm tra `backend/serviceAccountKey.json` tồn tại
- Hoặc kiểm tra `backend/.env` có đầy đủ Firebase credentials

### Error: Permission denied
- Kiểm tra Firebase Security Rules
- Admin SDK cần full access vào database

### Error: Collection not found
- Đảm bảo đã tạo 3 collections trong Firebase Console:
  - `productAnalytics`
  - `productTimeSeries`
  - `globalRankings`

---

## 📚 Liên quan

- Implementation Plan: `plans/20251209-1520-product-analytics-system/plan.md`
- Phase 1 Details: `plans/20251209-1520-product-analytics-system/phase-01-schema-infrastructure.md`
- Firebase Config: `src/firebase.js`

---

**Created**: 2025-12-09
**Phase**: 1 - Schema & Infrastructure Setup
