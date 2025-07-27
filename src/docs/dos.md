# Cấu trúc cơ sở dữ liệu cho Bot Telegram

Tài liệu này mô tả các bảng dữ liệu được sử dụng bởi Bot Tương tác X (Telegram).

## Tổng quan

Bot Telegram sử dụng MongoDB để lưu trữ dữ liệu về người dùng, bài đăng và tương tác. Các bảng chính là:

1. `interactXTgUsers` - Lưu trữ thông tin về người dùng Telegram
2. `interactXTgPosts` - Lưu trữ thông tin về các bài đăng X (Twitter)
3. `interactXTgInteractions` - Lưu trữ thông tin về các tương tác giữa người dùng và bài đăng
4. `interactXSettings` - Lưu trữ các tham số cấu hình và thiết lập hệ thống

## Chi tiết các bảng

### interactXTgUsers

Bảng này lưu trữ thông tin về người dùng Telegram đã đăng ký với bot.

```typescript
interface ITelegramUser {
  _id?: ObjectId;
  userId: string; // ID người dùng Telegram
  username: string; // Tên người dùng Telegram
  chatId: string; // ID chat Telegram để gửi tin nhắn
  registeredUsernames: string[]; // Danh sách tên người dùng X đã đăng ký
  createdAt: Date;
  updatedAt: Date;
}
```

**Mục đích:**

- Theo dõi người dùng Telegram đã đăng ký
- Lưu trữ tên người dùng X của họ cho các nhiệm vụ tương tác
- Duy trì ID chat để gửi tin nhắn và thông báo

### interactXTgPosts

Bảng này lưu trữ thông tin về các bài đăng X (Twitter) mà người dùng gửi để nhận tương tác.

```typescript
interface IXPost {
  _id?: ObjectId;
  postId: string; // ID bài đăng X
  postUrl: string; // URL bài đăng X
  username: string; // Tên người dùng X đã đăng
  content?: string; // Nội dung bài đăng (tùy chọn)
  type: "member" | "admin"; // Loại bài đăng: thành viên hoặc admin
  createdAt: Date;
  updatedAt: Date;
}
```

**Mục đích:**

- Theo dõi các bài đăng cần tương tác
- Liên kết các bài đăng với tác giả gốc của chúng
- Cung cấp URL cho các nhiệm vụ tương tác
- Phân loại các bài đăng theo loại người dùng (member/admin)

### interactXTgInteractions

Bảng này theo dõi các tương tác giữa người dùng và bài đăng, như bình luận, thích hoặc retweet.

```typescript
interface IInteraction {
  _id?: ObjectId;
  telegramUserId: string; // Tham chiếu đến người dùng Telegram
  xUsername: string; // Tên người dùng X thực hiện tương tác
  targetPostId: string; // Tham chiếu đến bài đăng X đích
  targetPostUrl: string; // URL của bài đăng đích
  status: "todo" | "done" | "failed"; // Trạng thái tương tác
  commentId?: string; // Nếu tương tác là bình luận, ID của bình luận
  interactionType: "comment" | "like" | "retweet"; // Loại tương tác
  createdAt: Date;
  updatedAt: Date;
}
```

**Mục đích:**

- Theo dõi người dùng nào cần tương tác với bài đăng nào
- Ghi lại trạng thái của các tương tác (đang chờ, hoàn thành, thất bại)
- Lưu trữ loại tương tác (bình luận, thích, retweet)
- Theo dõi trạng thái hoàn thành của các nhiệm vụ tương tác

### interactXSettings

Bảng này lưu trữ cấu hình hệ thống và các tham số cho hệ thống tương tác.

```typescript
interface IInteractXSettings {
  _id?: ObjectId;
  minimumLinksForTask: number; // Số link thấp nhất để hoàn thành nhiệm vụ (n)
  additionalLinks: number; // Số link thêm vào (t)
  selectionMethod: "newest" | "oldest" | "random"; // Cách lấy bài đăng: mới nhất, cũ nhất, ngẫu nhiên
  additionalLinkSource: "member" | "admin"; // Nguồn link bổ sung: từ thành viên hoặc admin
  updatedAt: Date;
  updatedBy: string; // ID của admin đã cập nhật cấu hình
}
```

**Mục đích:**

- Cấu hình các tham số của hệ thống tương tác
- Lưu các thiết lập cho việc phân bổ nhiệm vụ tương tác
- Quản lý cách chọn bài đăng và số lượng nhiệm vụ cho người dùng

**Example Usage:**

- Với thiết lập minimumLinksForTask = 20 và additionalLinks = 5: Người dùng cần tương tác với ít nhất 20 trong tổng số 25 bài đăng được giao
- Với selectionMethod = "newest": Hệ thống sẽ ưu tiên chọn các bài đăng mới nhất để giao nhiệm vụ
- Với additionalLinkSource = "member": Các link bổ sung (5 link) sẽ được lấy từ nhóm member thay vì admin

## Relationships

Các bảng dữ liệu có mối quan hệ với nhau như sau:

1. `interactXTgUsers` chứa thông tin người dùng Telegram và các tên người dùng X đã đăng ký
2. `interactXTgPosts` chứa thông tin về các bài đăng X được gửi để nhận tương tác
3. `interactXTgInteractions` liên kết người dùng với các bài đăng mà họ cần tương tác
4. `interactXSettings` ảnh hưởng đến cách phân phối nhiệm vụ từ bảng `interactXTgPosts` cho người dùng
5. `interactXTasks` quản lý các nhiệm vụ tương tác được giao cho người dùng
6. `interactXTaskLinks` quản lý danh sách các liên kết thuộc về mỗi nhiệm vụ

Khi người dùng đăng ký tên người dùng X thông qua lệnh `/setup`, thông tin được lưu vào bảng `interactXTgUsers`. Khi người dùng đăng các liên kết bằng lệnh `/post`, các liên kết được lưu vào bảng `interactXTgPosts` với loại "member" hoặc "admin".

Khi người dùng yêu cầu nhiệm vụ qua `/get`, hệ thống tạo một bản ghi trong `interactXTasks` và nhiều bản ghi trong `interactXTaskLinks` dựa trên cài đặt trong `interactXSettings`. Hệ thống ưu tiên phân phối các liên kết chưa nhận đủ số lượng tương tác cần thiết.

## Bảng dữ liệu mới cho hệ thống nhiệm vụ

### interactXTasks

Bảng này quản lý các nhiệm vụ tương tác được giao cho người dùng.

```typescript
interface ITask {
  _id?: ObjectId;
  telegramUserId: string; // ID người dùng Telegram được giao nhiệm vụ
  xUsername: string; // Tên người dùng X sẽ thực hiện nhiệm vụ
  taskNumber: number; // Số thứ tự nhiệm vụ (để phân biệt các nhiệm vụ khác nhau)
  minimumLinksForTask: number; // Số link tối thiểu cần hoàn thành (n)
  totalLinks: number; // Tổng số link được giao (n+t)
  completedLinks: number; // Số link đã hoàn thành
  status: "todo" | "done"; // Trạng thái nhiệm vụ
  createdAt: Date;
  updatedAt: Date;
}
```

**Mục đích:**

- Theo dõi nhiệm vụ tương tác được giao cho từng người dùng
- Lưu trữ tiến độ hoàn thành nhiệm vụ
- Quản lý số thứ tự nhiệm vụ cho mỗi người dùng

### interactXTaskLinks

Bảng này quản lý các liên kết được phân bổ cho từng nhiệm vụ.

```typescript
interface ITaskLink {
  _id?: ObjectId;
  taskId: ObjectId; // ID của nhiệm vụ mà link này thuộc về
  postId: string; // ID của bài đăng X
  postUrl: string; // URL của bài đăng
  type: "member" | "admin"; // Loại link: thành viên hoặc admin
  interactionCount: number; // Số lần đã được tương tác
  requiredInteractions: number; // Số lần tương tác cần đạt được
  status: "pending" | "completed"; // Trạng thái: đang chờ hoặc đã hoàn thành
  createdAt: Date;
  updatedAt: Date;
}
```

**Mục đích:**

- Liên kết các bài đăng X với nhiệm vụ cụ thể
- Theo dõi số lần tương tác cho từng bài đăng
- Xác định khi nào một bài đăng đã nhận đủ tương tác

## Cách sử dụng bảng dữ liệu bởi các lệnh Bot

- `/setup`: Tạo hoặc cập nhật thông tin trong bảng `interactXTgUsers`
- `/delete`: Cập nhật bảng `interactXTgUsers` bằng cách xóa các tên người dùng đã chỉ định
- `/post`: Tạo các mục trong bảng `interactXTgPosts` với loại "member"
- `/get`: Tạo nhiệm vụ mới trong bảng `interactXTasks` và phân bổ liên kết vào bảng `interactXTaskLinks` dựa trên cấu hình từ `interactXSettings`
- `/check`: Kiểm tra trạng thái nhiệm vụ và cập nhật tiến độ trong bảng `interactXTasks`
- `/profile`: Lấy dữ liệu người dùng từ bảng `interactXTgUsers`
- `/settings` (chỉ dành cho admin): Quản lý cấu hình trong bảng `interactXSettings`
- `/admin` (ẩn, chỉ dành cho admin): Thêm các bài đăng admin vào bảng `interactXTgPosts` với loại "admin"
