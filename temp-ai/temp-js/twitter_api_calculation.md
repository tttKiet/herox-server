# Tính toán số lượng API Key cần thiết cho Twitter API

## Điều kiện và ràng buộc

Twitter API có những giới hạn sau:

- 1 API key chỉ có thể gọi 1 API trong 15 phút, sau đó phải chờ hết 15 phút mới được gọi lại
- 1 API key có giới hạn 100 lần gọi/tháng
- Khi sử dụng 1 API key, nó sẽ được lưu vào Redis với timeout 15 phút

## Yêu cầu

- Cần thực hiện được 150,000 requests/tháng

## Tính toán

### 1. Số lượng API key cần thiết dựa trên giới hạn requests/tháng

```
Số API key cần thiết = Tổng số request cần thiết / Số request mỗi key có thể thực hiện trong 1 tháng
Số API key cần thiết = 150,000 / 100 = 1,500 API keys
```

### 2. Số lượng API key cần thiết dựa trên giới hạn rate limit (15 phút)

Để tính số lượng API key cần thiết dựa trên rate limit, ta cần tính số request cần thực hiện trong 1 giờ:

```
Số request/tháng = 150,000
Số ngày trung bình trong tháng = 30
Số request/ngày = 150,000 / 30 = 5,000 request/ngày
Số request/giờ = 5,000 / 24 = 208.33 request/giờ
```

Vì mỗi API key cần 15 phút để "nghỉ ngơi" trước khi có thể sử dụng lại, trong 1 giờ mỗi key có thể sử dụng tối đa 4 lần.

```
Số API key cần cho mỗi giờ = Số request/giờ / Số lần mỗi key có thể dùng trong 1 giờ
Số API key cần cho mỗi giờ = 208.33 / 4 = 52.08 ≈ 53 API keys
```

### 3. Số lượng API key thực tế cần thiết

Số lượng API key thực tế cần thiết sẽ là giá trị lớn nhất của hai con số trên:

- 1,500 API keys (dựa trên giới hạn request/tháng)
- 53 API keys (dựa trên rate limit)

**=> Cần 1,500 API keys** để đáp ứng được cả hai điều kiện.

## Mô hình triển khai

### Quản lý API key với Redis

```javascript
// Pseudocode cho việc quản lý API key với Redis
function getAvailableApiKey() {
  // Lấy tất cả key không nằm trong Redis (có nghĩa là key đã hết timeout 15 phút)
  const availableKeys = allApiKeys.filter(
    (key) => !redis.exists(`api_key:${key}`)
  );

  if (availableKeys.length > 0) {
    const selectedKey = availableKeys[0]; // Lấy key đầu tiên có sẵn

    // Thêm key vào Redis với timeout 15 phút (900 giây)
    redis.set(`api_key:${selectedKey}`, "1", "EX", 900);

    // Tăng bộ đếm số lần sử dụng của key này trong tháng
    redis.incr(`api_key_monthly:${selectedKey}`);

    return selectedKey;
  }

  // Không có key nào khả dụng
  return null;
}
```

### Kiểm tra giới hạn tháng

```javascript
function checkMonthlyLimit(apiKey) {
  const count = redis.get(`api_key_monthly:${apiKey}`);

  // Nếu đã đạt giới hạn 100 request/tháng
  if (count >= 100) {
    // Đánh dấu key này không sử dụng được cho đến tháng tiếp theo
    redis.set(
      `api_key_disabled:${apiKey}`,
      "1",
      "EX",
      getRemainingSecondsInMonth()
    );
    return false;
  }

  return true;
}
```

### Tối ưu hóa

1. **Phân bổ đều**: Thay vì luôn lấy key đầu tiên có sẵn, nên phân bổ đều giữa các key để tránh một số key đạt giới hạn 100 request/tháng sớm hơn.

2. **Nhóm theo batch**: Nếu cần thực hiện nhiều requests cùng lúc, có thể nhóm theo batch để giảm thiểu thời gian chờ.

3. **Theo dõi và phân tích**: Triển khai hệ thống theo dõi để phát hiện key nào đang bị sử dụng quá mức hoặc bị chặn.

## Kết luận

Để thực hiện được 150,000 requests/tháng với các ràng buộc của Twitter API, cần có **1,500 API keys**. Mô hình quản lý sử dụng Redis sẽ đảm bảo:

1. Không key nào được sử dụng lại trong vòng 15 phút
2. Không key nào vượt quá 100 request/tháng
3. Luôn có key sẵn sàng để sử dụng nếu có đủ 1,500 keys

Lưu ý: Nếu không cần thực hiện requests đều đặn trong tháng (ví dụ: tập trung vào một vài ngày), số lượng key cần thiết có thể cao hơn đáng kể do giới hạn rate limit 15 phút.
