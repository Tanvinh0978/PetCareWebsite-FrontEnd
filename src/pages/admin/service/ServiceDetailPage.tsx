import ServiceDetail from '@/components/service/ServiceDetail';

export default function ServiceDetailPage() {
  return <ServiceDetail backTo="/admin/services" editTo={(id) => '/admin/services/' + id + '/edit'} />;
}
