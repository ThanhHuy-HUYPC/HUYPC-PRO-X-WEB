# HUYPC KEY MANAGER

Website quản lý Key cho app HUYPC.

## Có sẵn
- Không cần màn hình đăng nhập.
- Tạo Key tự động.
- Chọn số ngày hoặc ngày hết hạn.
- Xem toàn bộ Key.
- Sửa User, thiết bị, hạn sử dụng, trạng thái.
- Khóa / mở khóa Key.
- Xóa từng Key hoặc toàn bộ.
- Xuất / nhập JSON.
- API `api/validate.php` để app kiểm tra Key.
- SQLite lưu dữ liệu server.

## Yêu cầu hosting
PHP 8+ và extension SQLite3.

## Cài đặt
Upload toàn bộ thư mục lên hosting, mở `index.html`.

Nếu host chạy PHP, thư mục `data/` phải có quyền ghi cho PHP.

## API cho app
POST tới:
`api/validate.php`

JSON:
`{"key":"HUYPC-XXXX-XXXX-XXXX-XXXX"}`

Key hợp lệ trả:
`{"valid":true,...}`

Key sai/hết hạn/bị khóa trả:
`{"valid":false,"error":"..."}`

## Lưu ý bảo mật
Thiết kế này đúng yêu cầu "không cần đăng nhập", nên URL quản trị ai biết URL cũng có thể thao tác. Không nên dùng cách này cho hệ thống Key thương mại nếu URL bị công khai. Khi đưa lên internet nên thêm lớp bảo vệ IP hoặc mật khẩu/API admin riêng.
