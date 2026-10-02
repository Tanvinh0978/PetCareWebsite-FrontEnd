import { Link } from 'react-router-dom';
import { SERVICE_TYPE_LABEL, type ServiceType } from '../types';

const blurbs: Record<ServiceType, string> = {
  Grooming: 'Tắm, sấy, tỉa lông theo giống.',
  Boarding: 'Phòng riêng, có người trông cả ngày.',
  Diet: 'Khẩu phần theo cân nặng và sức khỏe.',
  Care: 'Theo dõi và báo cáo mỗi ngày cho bạn.',
};

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Chó mèo của bạn đi vắng cả ngày? Có chúng tôi lo.</h1>
        <p>Chọn dịch vụ, chọn giờ, mang bé đến. Bé được tắm gọn, ăn đúng bữa và bạn nhận được ảnh cùng ghi chú sau mỗi buổi.</p>
        <Link to="/dich-vu" className="btn">Xem dịch vụ</Link>
      </section>
      <section className="tiles">
        {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => (
          <Link key={t} to={`/dich-vu?loai=${t}`} className="tile">
            <h2>{SERVICE_TYPE_LABEL[t]}</h2>
            <p>{blurbs[t]}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
