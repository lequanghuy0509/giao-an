// Chuẩn bị thư mục build-app: chép file ứng dụng và tải sẵn các thư viện để app chạy được khi không có mạng.
const fs = require('fs'), path = require('path');
const out = 'build-app', libs = path.join(out, 'libs');
// Tự tìm thư mục chứa index.html (ở gốc kho hoặc trong thư mục con)
function find(dir, depth) {
  if (fs.existsSync(path.join(dir, 'index.html'))) return dir;
  if (depth === 0) return null;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || ['node_modules', 'dist', out, '.git', '.github'].includes(e.name)) continue;
    const r = find(path.join(dir, e.name), depth - 1);
    if (r) return r;
  }
  return null;
}
const src = find('.', 3);
if (!src) { console.error('Không tìm thấy file index.html trong kho. Hãy tải index.html lên GitHub.'); process.exit(1); }
console.log('Tìm thấy ứng dụng trong thư mục:', src);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(libs, { recursive: true });
for (const f of ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']) {
  const p = path.join(src, f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(out, f)); else console.log('Thiếu file', f);
}
const L = [
  ['https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js', 'docx.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'jszip.min.js'],
  ['https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js', 'pptxgen.bundle.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'pdf.min.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js', 'pdf.worker.min.js']
];
(async () => {
  let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
  for (const [u, n] of L) {
    try {
      const r = await fetch(u);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      fs.writeFileSync(path.join(libs, n), Buffer.from(await r.arrayBuffer()));
      html = html.split(u).join('libs/' + n);
      console.log('Đã tải', n);
    } catch (e) {
      console.log('Không tải được', n, '- giữ nguyên địa chỉ trên mạng:', String(e));
    }
  }
  fs.writeFileSync(path.join(out, 'index.html'), html);
})();
