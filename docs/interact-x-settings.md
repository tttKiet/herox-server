# Hệ thống cài đặt tương tác X (X Interaction Settings)

## Tổng quan

Hệ thống cài đặt tương tác X cho phép quản lý các thông số cấu hình trong việc phân phối nhiệm vụ tương tác giữa các thành viên. Các cài đặt này được lưu trữ trong MongoDB và được quản lý thông qua class `SettingsManager`.

## Cấu trúc dữ liệu

Collection **interactXSettings** có cấu trúc:

```typescript
interface IInteractXSettings {
  _id?: ObjectId;
  minimumLinksForTask: number; // Số link thấp nhất để hoàn thành nhiệm vụ (n)
  additionalLinks: number; // Số link thêm vào (t)
  selectionMethod: "newest" | "oldest" | "random"; // Cách lấy bài đăng
  additionalLinkSource: "member" | "admin"; // Nguồn link bổ sung
  updatedAt: Date;
  updatedBy: string; // ID của admin đã cập nhật
}
```

## Công thức phân phối nhiệm vụ

- Mỗi nhiệm vụ yêu cầu người dùng phải tương tác với ít nhất `minimumLinksForTask` (n) liên kết
- Hệ thống sẽ bổ sung thêm `additionalLinks` (t) liên kết từ nguồn được chỉ định bởi `additionalLinkSource`
- Tổng số liên kết trong một nhiệm vụ = n + t
- Các liên kết được chọn theo phương thức được chỉ định trong `selectionMethod`:
  - `newest`: Lấy các bài đăng mới nhất
  - `oldest`: Lấy các bài đăng cũ nhất
  - `random`: Lấy ngẫu nhiên các bài đăng

## Khởi tạo hệ thống

Khi máy chủ khởi động, hệ thống tự động gọi phương thức `initDefaultSettings()` để kiểm tra và tạo cài đặt mặc định nếu chưa tồn tại:

- `minimumLinksForTask`: 20
- `additionalLinks`: 5
- `selectionMethod`: "oldest"
- `additionalLinkSource`: "admin"

## Sử dụng API

### Khởi tạo và lấy cài đặt

```typescript
const settingsManager = new SettingsManager();
const settings = await settingsManager.getSettings();
```

### Cập nhật cài đặt

```typescript
const updatedSettings = await settingsManager.updateSettings(
  {
    minimumLinksForTask: 25,
    additionalLinks: 10,
    selectionMethod: "random",
  },
  adminId
);
```

### Tính toán phân phối nhiệm vụ

```typescript
const { requiredLinks, totalLinks, sourceForAdditionalLinks } =
  await settingsManager.calculateLinkDistribution();
```

## Ví dụ sử dụng

Xem thêm các ví dụ cụ thể về cách tích hợp SettingsManager trong các phần khác của ứng dụng trong file:
`src/test/settingsManagerUsageExamples.js`

## Kiểm tra chức năng

Để kiểm tra chức năng của SettingsManager, chạy script test:

```
node src/test/testSettingsManager.js
```
