# Bài 4. Bảo mật ứng dụng đám mây

Ngày thực hành: 26/11/2026.

## A. Quản lý bí mật
- Kiểm tra lịch sử Git: không phát hiện bí mật theo các mẫu đã kiểm tra.
- Bốn Codespaces Secrets đã được nạp sau Rebuild.
- Dependency graph, Dependabot alerts và Push protection đã bật.
- Tệp .env không được Git theo dõi, nằm trong .gitignore và .dockerignore.

## B. Kiểm thử
| Kiểm thử | HTTP thực tế |
|---|---:|
| Đăng ký người dùng A, B | 201 |
| Đăng nhập | 200 |
| Không token hoặc token sai | 401 |
| Token hợp lệ | 200 |
| NoSQL injection trong đăng nhập | 401 |
| A tạo ghi chú | 201 |
| B đọc, sửa, xóa hoặc đính kèm tệp vào ghi chú A | 404 |
| A sửa ghi chú | 200 |
| A xóa ghi chú | 204 |
| Đăng nhập sai lần 1–20 | 401 |
| Đăng nhập sai lần 21–25 | 429 |

Owner được lấy từ JWT, không tin giá trị owner trong request. Helmet trả header nosniff. Giới hạn 20 yêu cầu /auth trong 15 phút; kiểm thử rate limit chạy sau khi khởi động lại API.

## C. Quét lỗ hổng

npm audit --omit=dev: 0 lỗ hổng.
Dependabot: 0 cảnh báo mở trước khi push.

| Image | Kích thước | HIGH | CRITICAL |
|---|---:|---:|---:|
| node:22-alpine | 289 MB | 10 | 0 |
| node:22 | 1.67 GB | 479 | 20 |

Kết quả Trivy ngày 26/11/2026, đếm các phát hiện HIGH/CRITICAL trong JSON trên hai image ứng dụng. Alpine nhẹ hơn và ít phát hiện hơn; vẫn cần xem xét 10 HIGH, ưu tiên bản vá khả dụng và khả năng khai thác thực tế.

## D. Phân tích rủi ro

| Vấn đề | Rủi ro | Biện pháp bù trừ / đề xuất |
|---|---|---|
| 0.0.0.0/0 (giả định đề bài) | Mở đường kết nối từ mọi IPv4, tăng bề mặt tấn công | TLS, mật khẩu mạnh, quản lý Secrets, quyền tối thiểu |
| Cấu hình thực tế | IP Codespaces thay đổi sau Rebuild | Chỉ cấp IP /32, thời hạn 6 giờ; không mở 0.0.0.0/0 |
| Quyền database | notes_app quan sát có readWriteAnyDatabase và readWrite@notes | Rà soát và chỉ giữ readWrite trên notes nếu ứng dụng không cần database khác |
| Bucket attachments public | URL công khai có thể truy cập không qua API | Chuyển bucket private và cấp URL ký ngắn hạn sau kiểm tra owner |
| Giải pháp dài hạn | IP động, khó quản trị | IP egress tĩnh, Private Endpoint hoặc VPC peering nếu gói dịch vụ hỗ trợ |

## Câu hỏi phản biện
1. JWT bị lộ còn hiệu lực đến hết hạn nếu không có cơ chế thu hồi. Có thể dùng danh sách thu hồi theo jti hoặc phiên lưu server; đổi lại cần lưu trạng thái, tra cứu và dọn dữ liệu hết hạn.
2. Alpine thường có ít gói hệ điều hành hơn, nhưng ít cảnh báo không đồng nghĩa an toàn tuyệt đối. Cần xét khả năng khai thác, độ phủ cơ sở dữ liệu CVE và bản vá.
3. Nhà cung cấp chịu trách nhiệm hạ tầng dịch vụ, cơ chế bảo mật và vận hành nền tảng theo gói. Nhóm phát triển chịu trách nhiệm cấu hình truy cập, tài khoản và quyền, Secrets, xác thực/phân quyền ứng dụng, bảo mật tệp và cập nhật dependencies.
