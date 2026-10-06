import { Link } from 'react-router-dom';
import { useAuth } from '../shared/auth/AuthContext';
import { ROLE_BASE } from '../shared/auth/roles';
import { SERVICE_TYPE_LABEL, type ServiceType } from '../features/services/types';

const blurbs: Record<ServiceType, string> = {
  Grooming: 'Bathing, drying and styling for every breed.',
  Boarding: 'A private room and someone watching all day.',
  Diet: 'Meals matched to weight and health.',
  Care: 'Daily monitoring with reports for you.',
};

// Trang chủ dùng chung cho guest và customer; liên kết tự đổi theo khu vực.
export default function Home() {
  const base = ROLE_BASE[useAuth().role];
  return (
    <>
      <section className="hero">
        <h1>Away all day? We will look after your pet.</h1>
        <p>Pick a service, pick a time, bring your pet in. They get cleaned up, fed on schedule, and you receive photos and notes after every visit.</p>
        <Link to={base + '/services'} className="btn">Browse services</Link>
      </section>
      <section className="tiles">
        {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => (
          <Link key={t} to={base + '/services?type=' + t} className="tile">
            <h2>{SERVICE_TYPE_LABEL[t]}</h2>
            <p>{blurbs[t]}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
