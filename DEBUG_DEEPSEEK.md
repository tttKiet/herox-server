# Debug Lỗi ConnectTimeoutError với DeepSeek API

## Lỗi hiện tại

```
ConnectTimeoutError: Connect Timeout Error
```

## Nguyên nhân có thể

1. **Firewall/Proxy**: Hệ thống chặn kết nối outbound tới deepseek.com
2. **DNS Issue**: Không resolve được domain deepseek.com
3. **Network routing**: ISP/VPS provider chặn kết nối tới IP của DeepSeek
4. **Geographic blocking**: DeepSeek chặn kết nối từ một số quốc gia/region

## Các bước debug

### 1. Kiểm tra kết nối cơ bản

```bash
# Kiểm tra DNS resolution
nslookup api.deepseek.com

# Kiểm tra kết nối TCP
telnet api.deepseek.com 443

# Hoặc dùng curl để test
curl -v https://api.deepseek.com
```

### 2. Test từ server/VPS

```bash
# Test API endpoint trực tiếp
curl -X POST "https://api.deepseek.com/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```

### 3. Kiểm tra trong Docker (nếu chạy container)

```bash
# Exec vào container
docker exec -it <container_name> /bin/sh

# Test curl trong container
curl -v https://api.deepseek.com

# Kiểm tra DNS trong container
nslookup api.deepseek.com
```

### 4. Cải tiến trong code

File `src/app/handler/ai/index.ts` đã được cập nhật với:

- ✅ Timeout 60 giây
- ✅ Retry 3 lần với exponential backoff
- ✅ Log chi tiết lỗi
- ✅ Xử lý các loại timeout error khác nhau

## Các giải pháp

### 1. Proxy/VPN

Nếu VPS bị chặn, có thể dùng proxy:

```javascript
// Dùng proxy agent nếu cần
const { HttpsProxyAgent } = require("https-proxy-agent");
const agent = new HttpsProxyAgent("http://proxy:port");

fetch(url, { agent });
```

### 2. Alternative API endpoint

Thử các endpoint khác (nếu có):

```javascript
// Thay vì api.deepseek.com
const alternatives = [
  "https://api.deepseek.com",
  // Thêm backup endpoints nếu có
];
```

### 3. Increase timeout

Nếu mạng chậm:

```javascript
const timeoutMs = 120000; // Tăng lên 2 phút
```

### 4. Network configuration

Kiểm tra cấu hình mạng:

```bash
# Kiểm tra routing
traceroute api.deepseek.com

# Kiểm tra firewall
iptables -L
ufw status
```

## Test log mới

Sau khi chạy lại API, log sẽ hiển thị:

```
[fetchAI] Attempt 1/4 - Calling DeepSeek API...
[fetchAI] Error on attempt 1: fetch failed
[fetchAI] Connect timeout error - Network/DNS/Firewall issue
[fetchAI] Error details: { name: 'TypeError', code: 'UND_ERR_CONNECT_TIMEOUT', ... }
[fetchAI] Retrying in 1000ms... (1/3)
```

## Kết quả mong đợi

Nếu thành công:

```
[fetchAI] Success after 1 attempts
```

Nếu thất bại:

```
Timeout kết nối tới DeepSeek API sau 4 lần thử. Vui lòng kiểm tra kết nối mạng.
```

## Liên hệ support

Nếu vẫn lỗi, có thể:

1. Liên hệ VPS provider về việc mở port 443 outbound
2. Liên hệ DeepSeek support về IP whitelist
3. Thử chuyển sang API provider khác tạm thời
