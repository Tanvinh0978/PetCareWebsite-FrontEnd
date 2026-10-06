// Tạo khung một nhóm màn hình mới cho một vai trò và tự đăng ký route + menu.
// Dùng: npm run new:page -- <vai-tro> <ten-thu-muc> <TenEntity>
// Ví dụ: npm run new:page -- admin pets Pet
import fs from 'node:fs';
import path from 'node:path';

const [role, name, entity] = process.argv.slice(2);
const ROLES = ['admin', 'staff', 'customer'];
if (!ROLES.includes(role) || !/^[a-z][a-z0-9-]*$/.test(name ?? '') || !/^[A-Z][A-Za-z0-9]*$/.test(entity ?? '')) {
  console.error('Dùng: npm run new:page -- <admin|staff|customer> <ten-thu-muc-chu-thuong> <TenEntityPascalCase>\nVí dụ: npm run new:page -- admin pets Pet');
  process.exit(1);
}
const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const cap = role[0].toUpperCase() + role.slice(1);
const page = entity + 'ListPage';
const write = (file, content) => {
  if (fs.existsSync(file)) { console.log('Bỏ qua (đã có): ' + file); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

write(path.join('src', 'types', name + '.ts'), `// Kiểu dữ liệu ${entity}. Khớp entity ${entity} ở backend (JSON camelCase, enum là chuỗi).
export interface ${entity} {
  id: string;
  // TODO: thêm các trường theo backend
}
`);

write(path.join('src', 'api', camel + 'Api.ts'), `import { http } from './client';
import type { ApiResponse } from '@/types/api';
import type { ${entity} } from '@/types/${name}';

// TODO: sửa đường dẫn cho khớp controller ở backend
export async function get${entity}List(): Promise<${entity}[]> {
  const res = await http.get<ApiResponse<${entity}[]>>('/${name}');
  return res.data.result ?? [];
}
`);

const pageContent = role === 'admin'
  ? `import { useEffect, useState } from 'react';
import { get${entity}List } from '@/api/${camel}Api';
import { getErrorMessage } from '@/api/client';
import type { ${entity} } from '@/types/${name}';

export default function ${page}() {
  const [items, setItems] = useState<${entity}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    get${entity}List()
      .then(setItems)
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page wide">
      <div className="page-head">
        <div>
          <h1>${entity} Management</h1>
          <p className="page-subtitle">List and manage ${name} records.</p>
        </div>
      </div>

      {error && <p className="msg error">{error}</p>}

      <div className="table-card">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th>ID</th>
                {/* TODO: thêm các cột theo thực thể ${entity} */}
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="table-empty-box">
                      <h3>No ${name} found</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="col-idx">{idx + 1}</td>
                    <td>{item.id}</td>
                    <td className="col-actions">
                      <div className="action-group">
                        <button type="button" className="btn-action view">View</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
`
  : `import { useEffect, useState } from 'react';
import { get${entity}List } from '@/api/${camel}Api';
import { getErrorMessage } from '@/api/client';
import type { ${entity} } from '@/types/${name}';

export default function ${page}() {
  const [items, setItems] = useState<${entity}[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    get${entity}List().then(setItems).catch((e) => setError(getErrorMessage(e)));
  }, []);

  return (
    <section className="page">
      <h1>${entity}</h1>
      {error && <p className="msg error">{error}</p>}
      {/* TODO: thay bằng giao diện thật cho vai trò ${role} */}
      <pre>{JSON.stringify(items, null, 2)}</pre>
    </section>
  );
}
`;

write(path.join('src', 'pages', role, name, page + '.tsx'), pageContent);

// Đăng ký route.
const routesFile = path.join('src', 'routes', 'index.tsx');
let r = fs.readFileSync(routesFile, 'utf8');
const comp = cap + page;
if (!r.includes('<' + comp + ' />')) {
  r = r.replace('// [new-page:imports]', `import ${comp} from '@/pages/${role}/${name}/${page}';\n// [new-page:imports]`);
  r = r.replace(`// [new-page:${role}]`, `{ path: '${name}', element: <${comp} /> },\n        // [new-page:${role}]`);
  fs.writeFileSync(routesFile, r);
}

// Đăng ký menu.
const navFile = path.join('src', 'routes', 'nav.ts');
let n = fs.readFileSync(navFile, 'utf8');
if (!n.includes(`to: '${name}'`) && !n.includes(`to: "${name}"`)) {
  n = n.replace(`// [new-page:nav-${role}]`, `{ label: '${entity}', to: '${name}' },\n    // [new-page:nav-${role}]`);
  fs.writeFileSync(navFile, n);
}
console.log(`Xong: src/pages/${role}/${name}. Mở /${role}/${name} để xem.`);
