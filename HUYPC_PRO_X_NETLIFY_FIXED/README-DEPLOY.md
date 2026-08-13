# HUYPC PRO X — BẢN NETLIFY FIX

Cấu trúc ROOT GitHub bắt buộc:
netlify.toml
package.json
public/admin/index.html
public/admin/app.js
public/admin/style.css
netlify/functions/admin.js
netlify/functions/license.js

1. Upload NỘI DUNG của ZIP vào ROOT repository. Không để thêm thư mục server/ hay HUYPC_PRO_X_NETLIFY_FIXED/ bên ngoài.
2. Netlify → Import project từ GitHub. Không dùng Drop deployment.
3. Không đặt Base directory.
4. Environment variable: ADMIN_SECRET = secret của bạn, scope Functions/Runtime.
5. Deploy lại.
6. Kiểm tra: https://TEN-SITE.netlify.app/.netlify/functions/admin
   Nếu trả {"ok":false,"error":"UNAUTHORIZED"} thì Function đã chạy đúng.
7. Admin: https://TEN-SITE.netlify.app/admin/

Nếu vừa đổi ADMIN_SECRET, phải Trigger deploy mới.
Không gửi ADMIN_SECRET cho bất kỳ ai và không commit secret vào GitHub.
