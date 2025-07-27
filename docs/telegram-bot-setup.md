# Hướng dẫn thiết lập Bot Telegram

Dưới đây là hướng dẫn chi tiết để thiết lập và kết nối API với Bot Telegram cho hệ thống tương tác chéo link X.

## Bước 1: Tạo Bot Telegram

1. Truy cập BotFather trên Telegram: https://t.me/BotFather
2. Gõ lệnh `/newbot` để tạo bot mới
3. Nhập tên hiển thị cho bot (ví dụ: X Interaction Bot)
4. Nhập username cho bot (ví dụ: x_interaction_bot)
5. Lưu lại token API được cung cấp (dạng `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

## Bước 2: Thiết lập môi trường

1. Thêm các biến môi trường sau vào file `.env`:

```
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=<your_bot_token>
TELEGRAM_WEBHOOK_URL=<your_webhook_url> # Chỉ cần cho môi trường production
TELEGRAM_WEBHOOK_PORT=3000
AUTO_START_BOT=true

# API Configuration
API_BASE_URL=http://localhost:3000/api/v1
API_KEY=<your_api_key>
```

2. Cài đặt các package cần thiết:

```bash
npm install telegraf form-data multer winston
```

## Bước 3: Cấu trúc thư mục

Đảm bảo bạn đã có cấu trúc thư mục sau:

```
src/
├── app/
│   └── handler/
│       └── telegram/
│           ├── scenes/
│           │   ├── setupUserScene.ts
│           │   ├── getPostsScene.ts
│           │   ├── checkInteractionScene.ts
│           │   └── postLinksScene.ts
│           ├── TelegramBotHandler.ts
│           └── TelegramService.ts
├── route/
│   ├── index.ts
│   └── telegramBot.ts
└── utils/
    └── logger.ts
```

## Bước 4: API Endpoints

Dưới đây là các API endpoints cần triển khai để bot Telegram hoạt động:

1. `POST /api/v1/telegram/user-profile`: Lưu thông tin hồ sơ người dùng
2. `GET /api/v1/telegram/tasks`: Lấy danh sách nhiệm vụ cho người dùng
3. `POST /api/v1/telegram/check-interactions`: Kiểm tra trạng thái tương tác
4. `POST /api/v1/telegram/user-links`: Lưu danh sách link của người dùng

## Bước 5: Khởi động Bot

### Chế độ Development (Polling)

Trong môi trường phát triển, bot sử dụng Long Polling để nhận updates:

```bash
npm run start:dev
```

### Chế độ Production (Webhook)

Trong môi trường sản xuất, bot sử dụng Webhook:

1. Đảm bảo server có thể truy cập từ internet (có thể dùng ngrok để test)
2. Cập nhật `TELEGRAM_WEBHOOK_URL` trong file `.env`
3. Khởi động server:

```bash
npm run start:production
```

## Bước 6: Kiểm tra Bot

1. Truy cập bot của bạn trên Telegram
2. Gõ lệnh `/start` để bắt đầu
3. Sử dụng các nút trên bàn phím để tương tác với bot

## Tích hợp với API kiểm tra comment

Để tích hợp với API kiểm tra comment X đã được phát triển trước đó:

1. Đảm bảo endpoint `/api/v1/x/check-comment` đã được triển khai
2. Sử dụng `TelegramService` để gọi API này trong quá trình kiểm tra tương tác
3. Cung cấp cookie nếu cần thiết để tăng độ chính xác của việc kiểm tra

## Lưu ý quan trọng

1. **Bảo mật token**: Không chia sẻ token bot Telegram với bất kỳ ai
2. **Xử lý rate limit**: Telegram có giới hạn số lượng tin nhắn gửi mỗi giây, cần thiết kế hệ thống để tránh vượt quá giới hạn
3. **Backup dữ liệu**: Thường xuyên sao lưu dữ liệu người dùng
4. **Xử lý lỗi**: Triển khai cơ chế xử lý lỗi toàn diện để tránh bot bị crash

## Nguồn tài nguyên tham khảo

1. Telegraf.js Documentation: https://telegraf.js.org/
2. Telegram Bot API: https://core.telegram.org/bots/api
3. Winston Logger: https://github.com/winstonjs/winston

## Hỗ trợ

Nếu gặp vấn đề hoặc cần hỗ trợ:

1. Kiểm tra logs trong thư mục `logs/`
2. Kiểm tra kết nối mạng và cấu hình webhook
3. Liên hệ với đội phát triển
