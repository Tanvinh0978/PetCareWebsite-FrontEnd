// Tạo khung cho một feature (model) mới và tự đăng ký vào src/features/index.ts.
// Dùng: npm run new:feature -- <thu-muc-chu-thuong> <TenEntity>
// Ví dụ: npm run new:feature -- pets Pet
import fs from 'node:fs';
import path from 'node:path';

const [name, entity] = process.argv.slice(2);
if (!name || !entity || !/^[a-z][a-z0-9-]*$/.test(name) || !/^[A-Z][A-Za-z0-9]*$/.test(entity)) {
  console.error('Dùng: npm run new:feature -- <thu-muc-chu-thuong> <TenEntityPascalCase>\nVí dụ: npm run new:feature -- pets Pet');
  process.exit(1);
}
const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const dir = path.join('src', 'features', name);
if (fs.existsSync(dir)) {
  console.error('Feature "' + name + '" đã tồn tại.');
  process.exit(1);
}
const write = (file, content) => {
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

write(path.join(dir, 'pages', `${entity}ListPage.tsx`), `import { useEffect, useState } from 'react';
import { get${entity}List } from '../api';
import { getErrorMessage } from '../../../shared/api/client';
import type { ${entity} } from '../types';

export default function ${entity}ListPage() {
  const [items, setItems] = useState<${entity}[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    get${entity}List().then(setItems).catch((e) => setError(getErrorMessage(e)));
  }, []);

  return (
    <section className="page">
      <h1>${entity}</h1>
      {error && <p className="msg error">{error}</p>}
      {/* TODO: thay bằng giao diện thật */}
      <pre>{JSON.stringify(items, null, 2)}</pre>
    </section>
  );
}
`);

write(path.join(dir, 'index.tsx'), `import ${entity}ListPage from './pages/${entity}ListPage';
import type { Feature } from '../../shared/types/feature';

export const ${camel}Feature: Feature = {
  routes: [{ path: '${name}', element: <${entity}ListPage /> }],
  nav: [{ label: '${entity}', to: '/${name}' }],
};
`);

const reg = path.join('src', 'features', 'index.ts');
let s = fs.readFileSync(reg, 'utf8');
s = s.replace('// [new-feature:imports]', `import { ${camel}Feature } from './${name}';\n// [new-feature:imports]`);
s = s.replace('// [new-feature:list]', `${camel}Feature,\n  // [new-feature:list]`);
fs.writeFileSync(reg, s);

console.log('Đã tạo src/features/' + name + ' và đăng ký vào src/features/index.ts');
console.log('Mở http://localhost:5173/' + name + ' để xem.');
