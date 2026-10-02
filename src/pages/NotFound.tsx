
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="page">
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn này không tồn tại. <Link to="/">Về trang chủ</Link>.</p>
    </section>
  );
}
