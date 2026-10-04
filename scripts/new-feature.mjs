// Tạo khung cho một feature (model) mới theo từng vai trò và tự đăng ký vào src/features/index.ts.
// Dùng: npm run new:feature -- <thu-muc-chu-thuong> <TenEntity> [vai-tro,...]
// Ví dụ: npm run new:feature -- invoices Invoice admin,staff,customer   (mặc định vai trò: admin)
import fs from 'node:fs';
import path from 'node:path';

const [name, entity, rolesArg = 'admin'] = process.argv.slice(2);
const ALLOWED = ['admin', 'staff', 'customer'];
const roles = rolesArg.split(',').map((r) => r.trim()).filter(Boolean);
if (!name || !entity || !/^[a-z][a-z0-9-]*$/.test(name) || !/^[A-Z][A-Za-z0-9]*$/.test(entity)
    || roles.length === 0 || roles.some((r) => !ALLOWED.includes(r))) {
  console.error('Dùng: npm run new:feature -- <thu-muc-chu-thuong> <TenEntityPascalCase> [admin,staff,customer]\nVí dụ: npm run new:feature -- invoices Invoice admin,customer');
  process.exit(1);
}
const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const dir = path.join('src', 'features', name);
const write = (file, content) => {
  if (fs.existsSync(file)) { console.log('Bỏ qua (đã có): ' + file); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

write(path.join(dir, 'types.ts'), `// Kiểu dữ liệu ${entity}. Khớp entity ${entity} ở backend (JSON camelCase, enum là chuỗi).
export interface ${entity} {
  id: string;
  // TODO: thêm các trường theo backend
}
`);
write(path.join(dir, 'api.ts'), `import { http } from '../../shared/api/client';
import type { ApiResponse } from '../../shared/types/api';
import type { ${entity} } from './types';

// TODO: sửa đường dẫn cho khớp controller ở backend
export async function get${entity}List(): Promise<${entity}[]> {
  const res = await http.get<ApiResponse<${entity}[]>>('/${name}');
  return res.data.result ?? [];
}
`);
const imports = [], routes = [], nav = [];
for (const role of roles) {
  const cap = role[0].toUpperCase() + role.slice(1);
  const page = entity + 'ListPage';
  write(path.join(dir, 'pages', role, page + '.tsx'), `import { useEffect, useState } from 'react';
import { get${entity}List } from '../../api';
import { getErrorMessage } from '../../../../shared/api/client';
import type { ${entity} } from '../../types';

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
`);
  imports.push(`import ${cap}${page} from './pages/${role}/${page}';`);
  routes.push(`    ${role}: [{ path: '${name}', element: <${cap}${page} /> }],`);
  nav.push(`    ${role}: [{ label: '${entity}', to: '${name}' }],`);
}
write(path.join(dir, 'index.tsx'), `${imports.join('\n')}
import type { Feature } from '../../shared/types/feature';

export const ${camel}Feature: Feature = {
  routes: {
${routes.join('\n')}
  },
  nav: {
${nav.join('\n')}
  },
};
`);

const reg = path.join('src', 'features', 'index.ts');
let s = fs.readFileSync(reg, 'utf8');
if (!s.includes(camel + 'Feature')) {
  s = s.replace('// [new-feature:imports]', `import { ${camel}Feature } from './${name}';\n// [new-feature:imports]`);
  s = s.replace('// [new-feature:list]', `${camel}Feature,\n  // [new-feature:list]`);
  fs.writeFileSync(reg, s);
}
console.log('Xong: src/features/' + name + ' cho vai trò ' + roles.join(', ') + '. Mở /' + roles[0] + '/' + name + ' để xem.');
