# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
## Phân hệ: Multi-tenant Onboarding & Storefront cho KOL

> Cấu trúc theo IEEE 830, rút gọn theo template BA nội bộ.

---

## TRANG BÌA
- Tên dự án: Affiliate KOL Platform (theaffiliate.ink)
- Tên tài liệu: Đặc tả yêu cầu phần mềm (SRS) — Phân hệ Multi-tenant Onboarding & Storefront
- Phiên bản: 1.0
- Ngày phát hành: 14/07/2026
- Người lập: Claude (hỗ trợ BA)
- Người phê duyệt: Chủ dự án (chưa ký)

## LỊCH SỬ THAY ĐỔI
| Phiên bản | Ngày | Người sửa | Nội dung thay đổi |
|---|---|---|---|
| 0.1 | 14/07/2026 | Claude | Bản nháp đầu tiên, dựa trên BRD sơ bộ đã thống nhất trong phiên làm việc |

---

# 1. GIỚI THIỆU

## 1.1. Mục đích tài liệu
Tài liệu đặc tả chi tiết yêu cầu chức năng và phi chức năng cho 3 hạng mục còn mở của giai đoạn "nền tảng multi-tenant" (OI-01, OI-02, OI-03 trong BRD sơ bộ), làm căn cứ triển khai và kiểm thử trước khi đóng vòng cô lập dữ liệu giữa các KOL.

## 1.2. Phạm vi sản phẩm (Scope)
- **Trong phạm vi:** trang đăng ký tự phục vụ để KOL tạo Organization mới; rà soát toàn bộ truy vấn quản trị theo `organizationId`; trang công khai riêng theo từng KOL tại `/store/[slug]`.
- **Ngoài phạm vi:** thanh toán/subscription; tên miền riêng (custom domain) cho từng KOL; xác minh email khi đăng ký; giới hạn tài nguyên (rate limit) theo Organization.

## 1.3. Định nghĩa, thuật ngữ, viết tắt
| Thuật ngữ | Giải thích |
|---|---|
| Organization | Ranh giới cô lập dữ liệu cao nhất — một KOL sở hữu đúng một Organization |
| Channel | Nhóm sản phẩm/bài viết theo dòng sản phẩm, nằm trong một Organization |
| Channel Staff | Vai trò nhân sự bị giới hạn vào đúng một Channel |
| Slug | Chuỗi định danh duy nhất dùng trong URL công khai (`/store/<slug>`) |
| KOL | Key Opinion Leader — người dùng chính của nền tảng, tương đương "Creator" |

## 1.4. Tài liệu tham chiếu
- BRD sơ bộ "Định nghĩa nghiệp vụ nền tảng Affiliate KOL Platform" (trao đổi hội thoại, 14/07/2026)
- Phân tích đối thủ Beacons.ai (trao đổi hội thoại, 14/07/2026)
- `prisma/schema.prisma` — schema hiện tại của hệ thống

## 1.5. Đối tượng đọc tài liệu
Đội phát triển (hiện do Claude Code đảm nhiệm), chủ dự án khi cần đối chiếu phạm vi đã bàn giao.

---

# 2. MÔ TẢ TỔNG QUAN

## 2.1. Bối cảnh sản phẩm
Hệ thống hiện có model `Organization` với khoá ngoại `organizationId` (nullable) đã gắn vào `User`, `Channel`, `Product`, `Post` (PR #1, đang chờ merge). Dữ liệu hiện tại của chủ dự án đã được xác định sẽ backfill vào một Organization mặc định. Ba hạng mục trong tài liệu này là bước tiếp theo, biến schema nền tảng thành tính năng người dùng sử dụng được.

## 2.2. Tác nhân (Actors)
| Actor | Loại | Mô tả |
|---|---|---|
| KOL mới | Primary | Người chưa có tài khoản, truy cập `/signup` để tạo Organization của riêng mình |
| Owner | Primary | Chủ một Organization, toàn quyền trong tổ chức đó |
| Secondary Admin / Manager / Staff / Channel Staff | Primary | Nhân sự trong một Organization, quyền hạn theo vai trò đã định nghĩa ở BRD |
| Khách truy cập công khai | Primary | Xem trang `/store/[slug]` của một KOL, không cần đăng nhập |
| Hệ thống Prisma/Postgres (Supabase) | System | Lưu trữ dữ liệu, thực thi ràng buộc `organizationId` |
| Hệ thống Supabase Storage | System | Lưu ảnh sản phẩm, cô lập theo path nhưng không cô lập theo Organization ở tầng bucket |

## 2.3. Giả định và ràng buộc
- Giả định: PR #1 (schema Organization) đã merge vào `main` trước khi triển khai các use case dưới đây.
- Giả định: dữ liệu hiện tại của chủ dự án đã backfill xong vào một Organization mặc định, `organizationId` đã chuyển thành bắt buộc (NOT NULL) trên cả 4 bảng.
- Ràng buộc: không có dịch vụ gửi email trong hệ thống ở thời điểm viết tài liệu → không xác minh được email khi đăng ký (ghi nhận là NFR rủi ro, không phải NFR đạt được).
- Ràng buộc: một địa chỉ email chỉ gắn với đúng một tài khoản, không hỗ trợ một người tham gia nhiều Organization (BR-01 kế thừa từ BRD).

## 2.4. Sơ đồ nghiệp vụ tổng quan
KOL mới → `/signup` → tạo Organization + tài khoản Owner → đăng nhập → thao tác trong `/admin/*` (dữ liệu tự động lọc theo `organizationId` của người đăng nhập) → nội dung published hiển thị công khai tại `/store/[slug]`.

---

# 3. YÊU CẦU CHỨC NĂNG

## 3.1. Use case UC-01: KOL đăng ký tổ chức mới (self-serve signup)

| Mục | Nội dung |
|---|---|
| Mã use case | UC-01 |
| Tên | Đăng ký tổ chức mới |
| Actor | KOL mới (Primary) |
| Mô tả | Người dùng chưa có tài khoản tự tạo một Organization mới và trở thành Owner của tổ chức đó |
| Pre-condition | Người dùng chưa đăng nhập; email chưa tồn tại trong hệ thống |
| Post-condition | Một bản ghi Organization mới được tạo; một User với role = OWNER được tạo và gắn `organizationId` vào Organization vừa tạo; người dùng ở trạng thái đã đăng nhập |
| Trigger | Người dùng truy cập `/signup` và nộp form |

### Luồng chính
1. Người dùng truy cập `/signup`, nhập: tên tổ chức/thương hiệu (Organization.name), email, mật khẩu.
2. Hệ thống tự sinh slug từ tên tổ chức (chuẩn hoá: chữ thường, bỏ dấu, thay khoảng trắng bằng `-`), kiểm tra trùng với slug đã tồn tại.
3. Hệ thống kiểm tra email chưa tồn tại trong bảng User.
4. Hệ thống tạo Organization (name, slug) và User (email, passwordHash, role=OWNER, organizationId) trong một giao dịch (transaction) — cả hai cùng thành công hoặc cùng thất bại.
5. Hệ thống thiết lập phiên đăng nhập (session cookie) cho User vừa tạo.
6. Hệ thống chuyển hướng vào `/admin/products` (trang quản trị rỗng, sẵn sàng nhập sản phẩm đầu tiên).

### Luồng thay thế
- **A1 – Slug trùng (bước 2):** hệ thống tự thêm hậu tố số (`-2`, `-3`...) cho đến khi tìm được slug trống, không hỏi lại người dùng.

### Luồng ngoại lệ
- **E1 – Email đã tồn tại (bước 3):** hệ thống từ chối, trả thông báo "Email đã được sử dụng", không tạo Organization (rollback toàn bộ transaction).
- **E2 – Mật khẩu không đạt độ dài tối thiểu 8 ký tự (bước 1):** hệ thống từ chối tại tầng validation, không gọi đến bước 2.
- **E3 – Lỗi ghi dữ liệu ở bước 4 (transaction thất bại):** hệ thống không tạo session, trả lỗi chung, không để lại Organization mồ côi (orphan) không có Owner.

### Business rules
- BR-06: Tên tổ chức bắt buộc, tối đa 100 ký tự (theo ràng buộc `Organization.name` hiện tại của schema).
- BR-07: Slug là duy nhất toàn hệ thống, không phân biệt hoa/thường, chỉ chứa `a-z`, `0-9`, dấu `-`.
- BR-08: Không giới hạn số lượng Organization được tạo (đăng ký mở hoàn toàn, đã chốt ở BRD — VĐM-01).

### Yêu cầu dữ liệu
| Trường | Kiểu | Bắt buộc | Ràng buộc |
|---|---|---|---|
| Tên tổ chức | String | Có | 1–100 ký tự |
| Email | String | Có | Định dạng email hợp lệ, duy nhất toàn hệ thống |
| Mật khẩu | String | Có | Tối thiểu 8 ký tự |

---

## 3.2. Use case UC-02: Nhân sự thao tác dữ liệu trong phạm vi tổ chức

| Mục | Nội dung |
|---|---|
| Mã use case | UC-02 |
| Tên | Truy vấn/thao tác Product, Post, Channel, User bị giới hạn theo Organization của người đăng nhập |
| Actor | Owner, Secondary Admin, Manager, Staff, Channel Staff |
| Mô tả | Mọi thao tác đọc/ghi trong `/admin/*` và các API tương ứng chỉ tác động đến dữ liệu thuộc `organizationId` của người đăng nhập, bất kể vai trò |
| Pre-condition | Người dùng đã đăng nhập, có `organizationId` hợp lệ |
| Post-condition | Kết quả trả về (danh sách hoặc chi tiết) không chứa bất kỳ bản ghi nào thuộc Organization khác |
| Trigger | Bất kỳ request nào đến `/admin/products`, `/admin/posts`, `/admin/channels`, `/admin/users` hoặc API tương ứng |

### Luồng chính
1. Người dùng gửi request (xem danh sách, tạo, sửa, xoá).
2. Hệ thống xác định `organizationId` từ session của người đăng nhập.
3. Hệ thống thêm điều kiện `WHERE organizationId = <của người đăng nhập>` vào mọi truy vấn Prisma liên quan đến Product, Post, Channel, User.
4. Với thao tác ghi (create): hệ thống tự gán `organizationId` của người đăng nhập vào bản ghi mới, bỏ qua giá trị `organizationId` nếu client gửi kèm trong payload.
5. Với thao tác đọc/sửa/xoá theo id: nếu bản ghi tồn tại nhưng thuộc Organization khác, hệ thống trả về như thể không tồn tại (404), không trả 403 — tránh lộ thông tin bản ghi có tồn tại hay không.

### Luồng ngoại lệ
- **E1 – Người dùng cố truy cập id thuộc Organization khác (bước 5):** trả 404, ghi log truy cập bất thường (khuyến nghị, chưa bắt buộc ở phiên bản này).
- **E2 – Channel Staff thao tác ngoài Channel được gán (đã có từ trước, kế thừa):** áp dụng đồng thời với điều kiện `organizationId` — Channel Staff bị lọc kép: theo Organization và theo Channel.

### Business rules
- BR-09: Không có ngoại lệ "xem chéo Organization" cho bất kỳ vai trò nào, kể cả Owner — Owner chỉ là cao nhất trong phạm vi tổ chức của mình, không phải toàn hệ thống.
- BR-10: Toàn bộ endpoint dưới `/api/admin/*` bắt buộc áp dụng điều kiện lọc `organizationId` — không có ngoại lệ "tạm thời bỏ qua để test" trong môi trường production.

### Ghi chú kiểm thử bắt buộc
Đây là yêu cầu có rủi ro cao nhất trong toàn phân hệ (rò rỉ dữ liệu chéo giữa các KOL) — mỗi endpoint sửa đổi phải có test case xác nhận: tạo 2 Organization test, xác nhận Organization A không đọc/sửa/xoá được bản ghi của Organization B qua cả giao diện lẫn gọi API trực tiếp.

---

## 3.3. Use case UC-03: Khách truy cập xem trang công khai của một KOL

| Mục | Nội dung |
|---|---|
| Mã use case | UC-03 |
| Tên | Xem trang công khai theo slug |
| Actor | Khách truy cập công khai (không cần đăng nhập) |
| Mô tả | Khách truy cập `/store/<slug>` xem danh sách bài viết/sản phẩm đã published của đúng một KOL |
| Pre-condition | Slug tồn tại và thuộc một Organization hợp lệ |
| Post-condition | Trang hiển thị đúng nội dung của Organization tương ứng slug, không lẫn nội dung Organization khác |
| Trigger | Khách truy cập URL `/store/<slug>` hoặc `/store/<slug>/posts/<postSlug>` |

### Luồng chính
1. Khách truy cập `/store/<slug>`.
2. Hệ thống tra `Organization` theo slug.
3. Hệ thống truy vấn Post có `published = true` và `organizationId` = Organization vừa tra được, sắp xếp theo `createdAt` giảm dần.
4. Hệ thống hiển thị tên Organization thay cho nhãn hiệu cứng "The Affiliate Blog" hiện tại.
5. Khách chọn một bài viết → hệ thống điều hướng `/store/<slug>/posts/<postSlug>`, áp dụng cùng điều kiện lọc Organization khi tra Post theo `postSlug`.

### Luồng ngoại lệ
- **E1 – Slug không tồn tại (bước 2):** trả trang 404 chuẩn của Next.js.
- **E2 – Bài viết tồn tại nhưng thuộc Organization khác slug đang truy cập (bước 5):** trả 404, không redirect sang đúng Organization (tránh lộ việc slug bài viết có tồn tại ở nơi khác).
- **E3 – Bài viết chưa published (bước 3, 5):** không hiển thị trong danh sách; nếu truy cập thẳng URL bài viết chưa published, trả 404.

### Business rules
- BR-11: `Post.slug` là duy nhất trong phạm vi một Organization (`@@unique([organizationId, slug])`), không còn duy nhất toàn hệ thống — thay thế ràng buộc `Post_slug_key` hiện tại (lưu ý: đây chính là điểm đã gây lỗi build CI khi triển khai sớm hơn dự kiến — chỉ áp dụng thay đổi này sau khi `organizationId` đã bắt buộc và toàn bộ UC-02 đã triển khai).

---

# 4. YÊU CẦU PHI CHỨC NĂNG

| Mã | Nhóm | Yêu cầu |
|---|---|---|
| NFR-01 | Security | Mật khẩu băm bằng bcrypt, cost factor = 12 (đã áp dụng thống nhất tại 3 điểm tạo/đổi mật khẩu trong codebase) |
| NFR-02 | Security | Session cookie: `httpOnly = true`, `sameSite = lax`, `secure = true` khi `NODE_ENV = production` (đã triển khai tại `src/lib/session.ts`) |
| NFR-03 | Security | `SESSION_SECRET` bắt buộc tối thiểu 32 ký tự, hệ thống từ chối khởi động (throw lỗi) nếu thiếu hoặc ngắn hơn |
| NFR-04 | Security | Không có cơ chế xác minh email tại thời điểm đăng ký — ghi nhận là rủi ro đã biết (VĐM-01 trong BRD), không phải NFR đạt được |
| NFR-05 | Reliability | Thao tác tạo Organization + User (UC-01, bước 4) phải nguyên tử — dùng transaction, không để lại Organization không có Owner nếu bước tạo User thất bại |
| NFR-06 | Reliability | UC-02 (lọc theo `organizationId`) phải đạt 100% endpoint dưới `/api/admin/*` trước khi coi giai đoạn hoàn thành — không chấp nhận triển khai một phần |
| NFR-07 | Performance | Truy vấn danh sách Product/Post tại `/store/[slug]` sử dụng index trên `organizationId` (khoá ngoại đã có index mặc định qua Prisma) — không yêu cầu số P95 cụ thể ở quy mô cá nhân hiện tại, nhưng không được quét toàn bảng không lọc điều kiện |
| NFR-08 | Usability | Slug tổ chức tự sinh từ tên, người dùng không phải tự nhập chuỗi kỹ thuật khi đăng ký (UC-01 bước 2) |
| NFR-09 | Supportability | Không giới hạn cứng (hardcode) số lượng Organization trong code — giới hạn nếu có phải qua cấu hình |

**Lưu ý FURPS:** NFR-04 cố tình ghi nhận là "rủi ro đã biết" thay vì xoá khỏi tài liệu — theo nguyên tắc BA, một NFR không đạt được vẫn phải xuất hiện trong đặc tả kèm trạng thái, không được bỏ sót để tránh sai lệch kỳ vọng khi nghiệm thu.

---

# 5. YÊU CẦU TÍCH HỢP

| Hệ thống | Giao thức | Mô tả |
|---|---|---|
| Supabase Postgres (qua Prisma) | SQL qua connection pooler | Lưu Organization, User, Channel, Product, Post; ràng buộc `organizationId` thực thi ở tầng ứng dụng (Prisma `where`), không phải Row-Level Security ở tầng Postgres — ghi nhận là giới hạn thiết kế hiện tại |
| Supabase Storage | REST API | Lưu ảnh sản phẩm; không cô lập theo Organization ở tầng path — VĐM-02 kế thừa từ BRD, cần quyết định trước khi mở rộng |
| Vercel (hosting) | HTTPS | Preview environment cần đủ biến môi trường giống Production (bài học từ sự cố CI vừa xử lý trong phiên làm việc) |

---

# 6. MA TRẬN TRUY VẾT (Traceability Matrix)

| Yêu cầu nghiệp vụ (BRD) | Use case | NFR liên quan | Trạng thái |
|---|---|---|---|
| OI-01: Trang đăng ký công khai | UC-01 | NFR-01, 02, 03, 04, 05, 08 | Chưa triển khai |
| OI-02: Rà soát truy vấn theo organizationId | UC-02 | NFR-06, 07, 09 | Chưa triển khai |
| OI-03: Trang công khai theo từng KOL | UC-03 | NFR-07 | Chưa triển khai |
| BR-03 (BRD): Post.slug duy nhất | BR-11 (SRS) | — | Phụ thuộc UC-02 hoàn tất trước |

---

# 7. PHÊ DUYỆT (Sign-off)

| Vai trò | Họ tên | Chữ ký | Ngày |
|---|---|---|---|
| Chủ dự án | | | |
| BA lập tài liệu | Claude (hỗ trợ BA) | — | 14/07/2026 |

---

## Ghi chú triển khai
Thứ tự khuyến nghị: UC-02 (rescoping) nên hoàn tất **trước** khi bật BR-11 (đổi `Post.slug` sang unique theo Organization) — đúng như bài học từ lỗi CI đã xảy ra khi ràng buộc cũ bị gỡ sớm hơn logic ứng dụng. UC-01 và UC-03 có thể triển khai song song sau khi UC-02 ổn định.
