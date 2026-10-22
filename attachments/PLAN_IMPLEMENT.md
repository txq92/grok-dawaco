# PLAN_IMPLEMENT.md — Website tính tiền nước theo định mức nhân khẩu

## 1. Mục tiêu
Xây dựng website tiếng Việt, responsive, tính và giải thích tiền nước theo số nhân khẩu, sản lượng tiêu thụ và bảng giá trong ảnh người dùng cung cấp. Bản đầu là ứng dụng tĩnh HTML/CSS/JavaScript, không cần backend.

## 2. Phạm vi MVP
- Nhập số nhân khẩu (số nguyên không âm) và lượng nước tiêu thụ (m³, không âm).
- Hiển thị định mức, lượng trong định mức, lượng ngoài định mức.
- Phân bổ phần trong định mức vào ba bậc; phần vượt định mức tính theo giá riêng.
- Hiển thị bảng chi tiết: sản lượng, đơn giá, thành tiền theo bậc và tổng cộng.
- Cho phép chỉnh sửa đơn giá và khôi phục giá mặc định.
- Giao diện phù hợp điện thoại và máy tính; định dạng tiền VND theo `vi-VN`.
- Chỉ rõ tổng tiền **chưa gồm VAT và các khoản phí khác**.

## 3. Dữ liệu và quy tắc đã xác nhận từ ví dụ
- Định mức mỗi nhân khẩu: 4 m³/tháng.
- Đơn giá mặc định (VND/m³): bậc 1 = 5.119; bậc 2 = 6.135; bậc 3 = 7.644; ngoài định mức = 18.101.
- Ví dụ: 3 nhân khẩu, 32 m³; định mức = 12 m³, vượt = 20 m³.
- Trong ví dụ, 12 m³ được chia: bậc 1 = 10 m³, bậc 2 = 2 m³, bậc 3 = 0 m³.
- Tiền tương ứng: 51.190 + 12.270 + 0 + 362.020 = **425.480 VND**.

## 4. Quy tắc tạm áp dụng cho MVP (cần xác nhận)
**Giả định A:** 3 nhân khẩu tương đương 1 hộ chỉ là diễn giải của ví dụ; ngưỡng bậc giá cố định theo 1 hộ: 10 m³ đầu, 20 m³ tiếp theo, phần trên 30 m³. Chưa tự động nhân ngưỡng bậc theo số hộ quy đổi.

Với N là nhân khẩu, Q là lượng nước:
- D = 4 × N.
- Q_in = min(Q, D).
- Q_out = max(0, Q − D).
- B1 = min(Q_in, 10).
- B2 = min(max(Q_in − 10, 0), 20).
- B3 = max(Q_in − 30, 0).
- Tổng = B1×5119 + B2×6135 + B3×7644 + Q_out×18101.

**Không coi giả định này là quy định chính thức**. Phải làm rõ cơ chế quy đổi nhân khẩu/hộ trước khi triển khai sử dụng thực tế.

## 5. Yêu cầu chức năng
| ID | Yêu cầu | Tiêu chí nghiệm thu |
|---|---|---|
| FR-01 | Nhập nhân khẩu | Chặn số âm, số thập phân và dữ liệu không hợp lệ |
| FR-02 | Nhập sản lượng | Chặn giá trị âm, không hợp lệ; hỗ trợ số thập phân |
| FR-03 | Tính định mức | D = N × 4 |
| FR-04 | Phân bổ sản lượng | Tổng các bậc và vượt định mức bằng Q |
| FR-05 | Tính tiền | Tính từng bậc chính xác, tổng bằng tổng các dòng |
| FR-06 | Sửa giá | Người dùng chỉnh được 4 đơn giá và có nút đặt lại |
| FR-07 | Hiển thị | Có bảng kết quả, thông báo chưa bao gồm thuế/phí |
| FR-08 | Responsive | Dùng tốt ở màn hình di động và desktop |

## 6. Yêu cầu phi chức năng
- Hoạt động hoàn toàn offline sau khi tải trang; không gửi dữ liệu lên server.
- Không dùng thư viện frontend bắt buộc hoặc API bên ngoài.
- Nhập liệu có nhãn rõ ràng, hỗ trợ bàn phím; độ tương phản đủ đọc.
- Logic tính tiền tách riêng khỏi UI để kiểm thử.
- Không làm tròn sản lượng trung gian; quy tắc làm tròn tiền cần được xác nhận nếu cho phép m³ lẻ.

## 7. Thiết kế kỹ thuật đề xuất
```text
water-calculator/
├── index.html        # Giao diện và biểu mẫu
├── styles.css        # Responsive styling
├── calculator.js     # Hàm tính thuần, kiểm tra dữ liệu
├── app.js            # Đồng bộ UI và kết quả
├── tests/            # Kiểm thử logic
│   └── calculator.test.js
└── README.md         # Cách chạy, giả định và giới hạn
```
Không yêu cầu Docker trong MVP; có thể bổ sung `Dockerfile` và `docker-compose.yml` để triển khai Nginx khi cần.

## 8. Test cases tối thiểu
| Case | N | Q (m³) | Kỳ vọng |
|---|---:|---:|---|
| TC-01 | 3 | 32 | Trong mức 12, ngoài mức 20, tổng 425.480 VND |
| TC-02 | 3 | 0 | Tổng 0 |
| TC-03 | 3 | 10 | B1=10, tổng 51.190 VND |
| TC-04 | 3 | 12 | B1=10, B2=2, tổng 63.460 VND |
| TC-05 | 1 | 6 | Trong mức 4, ngoài mức 2, tổng 56.678 VND |
| TC-06 | 0 | 5 | Theo giả định: toàn bộ 5 m³ ngoài định mức; cần xác nhận nghiệp vụ |
| TC-07 | -1 | 10 | Báo lỗi nhập liệu |
| TC-08 | 3 | -5 | Báo lỗi nhập liệu |
| TC-09 | 9 | 35 | Kiểm tra bậc 3 theo giả định A; cần xác nhận quy đổi hộ |

## 9. Các điểm cần quyết định trước khi chốt phiên bản chính thức
1. “3 nhân khẩu tương đương 1 hộ”: số hộ quy đổi tính thế nào cho 1, 2, 4, 5, 6… nhân khẩu? Có nhân các ngưỡng bậc theo số hộ quy đổi không?
2. Trường hợp không đăng ký nhân khẩu, có tính toàn bộ ngoài định mức không?
3. Khi có m³ lẻ, làm tròn số tiền ở từng bậc hay chỉ ở tổng?
4. Có tính VAT, phí bảo vệ môi trường và các phụ phí không? Nếu có, mức và thứ tự tính?
5. Bảng giá áp dụng từ ngày nào và có cần lưu nhiều phiên bản giá không?

## 10. Các giai đoạn triển khai
- **Giai đoạn 1 — Chốt nghiệp vụ:** Xác nhận 5 câu hỏi mục 9; lưu công thức chính thức.
- **Giai đoạn 2 — Logic & test:** Viết hàm tính thuần, kiểm tra biên và ví dụ 425.480 VND.
- **Giai đoạn 3 — Giao diện:** Biểu mẫu, bảng chi tiết, chỉnh giá, responsive.
- **Giai đoạn 4 — QA:** Test mobile/desktop, nhập sai, số thập phân, kết quả và độ dễ dùng.
- **Giai đoạn 5 — Triển khai:** Đóng gói tĩnh, tùy chọn Nginx/Docker, hướng dẫn sử dụng.

## 11. Definition of Done
- Tất cả test cases đã xác nhận nghiệp vụ đều đạt.
- Kết quả mẫu 3 nhân khẩu/32 m³ đúng **425.480 VND**.
- Tổng sản lượng các dòng luôn bằng lượng tiêu thụ.
- Không chấp nhận dữ liệu sai; giao diện dùng tốt trên điện thoại.
- README ghi rõ biểu giá, giả định và những khoản tiền chưa tính.

## 12. Trạng thái
**Chỉ hoàn thành tài liệu kế hoạch; chưa triển khai source code.** Chờ xác nhận các quy tắc còn mơ hồ trước khi xây dựng bản chính thức.
