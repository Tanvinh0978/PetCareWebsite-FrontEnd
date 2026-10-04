import { Link } from 'react-router-dom';
import { SERVICE_TYPE_LABEL, type ServiceType } from '../features/services/types';

const blurbs: Record<ServiceType, string> = {
  Grooming: 'Bathing, drying and styling for every breed.',
  Boarding: 'A private room and someone watching all day.',
  Diet: 'Meals matched to weight and health.',
  Care: 'Daily monitoring with reports for you.',
};

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Away all day? We will look after your pet.</h1>
        <p>Pick a service, pick a time, bring your pet in. They get cleaned up, fed on schedule, and you receive photos and notes after every visit.</p>
        <Link to="/services" className="btn">Browse services</Link>
      </section>
      <section className="tiles">
        {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => (
          <Link key={t} to={'/services?type=' + t} className="tile">
            <h2>{SERVICE_TYPE_LABEL[t]}</h2>
            <p>{blurbs[t]}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
