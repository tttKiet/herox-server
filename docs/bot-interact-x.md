# Tài liệu hệ thống tương tác chéo link - X Interaction Bot

## Tổng quan hệ thống

Hệ thống tương tác chéo link là một bot Telegram được thiết kế để quản lý việc tương tác chéo giữa các người dùng trên nền tảng X (Twitter). Nguyên tắc cơ bản của hệ thống là "Give to Get" - người dùng phải tương tác (comment) với link của người khác trước khi có thể đăng link của mình để nhận tương tác.

## Flow hoạt động từ phía người dùng

### Thiết lập hồ sơ

1. Người dùng bắt đầu bằng cách nhấn **Setup Profile** trên bot Telegram
2. Người dùng nhập số lượng username X mà họ muốn sử dụng để tương tác chéo (ví dụ: 10 username)
3. Hệ thống lưu trữ thông tin này và liên kết với tài khoản Telegram của người dùng

### Nhận nhiệm vụ tương tác

1. Người dùng nhấn nút **Get Post** để nhận nhiệm vụ tương tác
2. Bot sẽ gửi về N file .txt, mỗi file tương ứng với một username X đã đăng ký:
   - Mỗi file chứa N link tweet cần comment (số lượng N được cấu hình bởi admin)
   - Các link này là của người dùng khác đã đăng ký vào hệ thống
   - Nếu admin đã thiết lập danh sách ưu tiên, một số trong các link này (số lượng T) sẽ là link của "người nhà" (người được ưu tiên)

### Thực hiện tương tác

1. Người dùng sử dụng các username X của mình để comment vào tất cả các link đã nhận
2. Mỗi username phải comment đủ số lượng link được chỉ định trong file tương ứng
3. Người dùng không bắt buộc phải tương tác với tất cả các link (N+T) nếu đã hoàn thành đủ số lượng N theo yêu cầu

### Kiểm tra tương tác

1. Sau khi hoàn thành việc comment, người dùng quay lại bot Telegram và nhấn nút **Check**
2. Hệ thống sẽ tự động kiểm tra xem tất cả các username đã comment đủ số lượng link yêu cầu chưa:
   - Kiểm tra từng tweet URL
   - Xác minh rằng mỗi username đã comment vào đúng tweet được chỉ định
   - Đảm bảo số lượng comment đạt yêu cầu

### Đăng link nhận tương tác

1. Nếu tất cả 10 username đã comment đủ số lượng link yêu cầu, hệ thống sẽ thông báo "OK"
2. Người dùng có thể đăng link của mình bằng cách nhấn nút **Post Links**
3. Người dùng nhập 10 link tweet mà họ muốn nhận tương tác từ người dùng khác
4. Các link này sẽ được đưa vào hệ thống và phân phối cho người dùng khác khi họ nhấn **Get Post**

### Quy tắc và ràng buộc

1. Nếu chỉ một username không tương tác đủ số lượng link yêu cầu, toàn bộ link của người dùng sẽ không được kích hoạt
2. Người dùng phải hoàn thành tất cả nhiệm vụ tương tác trước khi có thể đăng link của mình
3. Hệ thống chỉ chấp nhận link tweet hợp lệ từ nền tảng X (Twitter)

## Quản lý từ phía admin

### Cấu hình hệ thống

1. Admin có thể điều chỉnh số lượng link yêu cầu (N) cho mỗi username
2. Admin có thể thêm/sửa/xóa link trong danh sách "người nhà" (T)
3. Admin có thể thiết lập tỷ lệ phân phối giữa link thông thường và link ưu tiên

### Theo dõi người dùng

1. Admin có thể xem danh sách tất cả người dùng Telegram đã đăng ký vào hệ thống
2. Đối với mỗi người dùng, admin có thể xem:
   - Số lượng và danh sách username X đã đăng ký
   - Trạng thái tương tác của từng username (đã tương tác bao nhiêu link, còn thiếu bao nhiêu)
   - Lịch sử các link đã đăng và số lượng tương tác nhận được

### Quản lý link

1. Admin có thể xem, thêm, sửa hoặc xóa các link trong hệ thống
2. Admin có thể đánh dấu link là "ưu tiên" để đưa vào danh sách link của "người nhà"
3. Admin có thể xem số lượng tương tác mà mỗi link đã nhận được

## Kiến trúc kỹ thuật

### Thành phần hệ thống

1. **Bot Telegram**:

   - Xử lý tương tác với người dùng
   - Gửi và nhận thông tin qua Telegram API
   - Tạo và gửi các file nhiệm vụ

2. **Backend API**:

   - Xử lý logic nghiệp vụ
   - Quản lý dữ liệu người dùng
   - Quản lý links và nhiệm vụ
   - API kiểm tra comment trên X

3. **Cơ sở dữ liệu**:
   - Lưu trữ thông tin người dùng
   - Lưu trữ danh sách link và trạng thái
   - Lưu trữ kết quả kiểm tra và thống kê

### API kiểm tra comment

API kiểm tra comment sẽ sử dụng phương thức cookie-based để xác minh:

1. Kiểm tra một tweet URL cụ thể
2. Xác minh xem một username X cụ thể đã comment vào tweet đó chưa
3. Trả về kết quả với thông tin chi tiết về comment (nếu có)

### Quy trình kiểm tra

1. Khi người dùng nhấn **Check**, hệ thống sẽ:

   - Lấy danh sách tất cả các username và link cần kiểm tra
   - Gọi API kiểm tra comment cho từng cặp username/link
   - Tổng hợp kết quả và cập nhật trạng thái trong cơ sở dữ liệu
   - Trả kết quả tổng hợp cho người dùng

2. Quá trình kiểm tra được thực hiện song song để tối ưu thời gian
3. Kết quả kiểm tra được lưu trữ để tránh việc kiểm tra lại không cần thiết

## Lưu ý triển khai

1. Cần đảm bảo API kiểm tra comment có khả năng xử lý khối lượng lớn yêu cầu
2. Bot Telegram cần được thiết kế để xử lý nhiều người dùng đồng thời
3. Cần có cơ chế cache và hàng đợi để tối ưu hiệu suất hệ thống
4. Cần thiết kế giao diện người dùng trên bot Telegram rõ ràng và dễ sử dụng
5. Cần có cơ chế phát hiện và xử lý spam hoặc lạm dụng hệ thống

## Phụ lục: Sơ đồ quy trình

```
┌─────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                 │     │                   │     │                   │
│  SETUP PROFILE  │────▶│    GET POSTS      │────▶│  INTERACT WITH    │
│                 │     │                   │     │      LINKS        │
└─────────────────┘     └───────────────────┘     └─────────┬─────────┘
                                                            │
                                                            ▼
┌─────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                 │     │                   │     │                   │
│   POST LINKS    │◀────│      CHECK        │◀────│    VERIFICATION   │
│                 │     │                   │     │                   │
└─────────────────┘     └───────────────────┘     └───────────────────┘
```
