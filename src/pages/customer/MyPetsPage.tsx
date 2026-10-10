import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Row, Typography, Space, Modal, message, Spin, Empty, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { petService } from '@/services/pet.service';
import { useAuthStore } from '@/store/useAuthStore';

const { Title, Text } = Typography;

const MyPetsPage: React.FC = () => {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPets = async () => {
    try {
      setLoading(true);
      const res = await petService.getMyPets();
      const items = res;
      // It returns the list directly via my-pets endpoint
      if (Array.isArray(items)) {
        setPets(items);
      } else if ((items as any).items) {
        setPets((items as any).items);
      }
    } catch (error) {
      message.error('Failed to load pets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this pet?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await petService.delete(id);
          setPets(pets.filter(p => p.id !== id));
          message.success('Pet deleted successfully');
        } catch (error) {
          message.error('Failed to delete pet');
        }
      }
    });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>My Pets</Title>
        <Button type="primary" style={{ backgroundColor: '#059669' }} icon={<PlusOutlined />} onClick={() => navigate('/customer/pets/new')}>
          Add New Pet
        </Button>
      </div>

      {pets.length === 0 ? (
        <Empty description="You haven't added any pets yet." />
      ) : (
        <Row gutter={[16, 16]}>
          {pets.map(pet => (
            <Col xs={24} sm={12} md={8} lg={6} key={pet.id}>
              <Card
                hoverable
                actions={[
                  <EditOutlined key="edit" onClick={() => navigate(`/customer/pets/${pet.id}/edit`)} />,
                  <DeleteOutlined key="delete" onClick={() => handleDelete(pet.id)} style={{ color: 'red' }} />
                ]}
              >
                <Card.Meta
                  title={
                    <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                      <span>{pet.name}</span>
                      <Tag color="blue">{pet.species}</Tag>
                    </Space>
                  }
                  description={
                    <div style={{ marginTop: '10px' }}>
                      <p><strong>Breed:</strong> {pet.breed || 'N/A'}</p>
                      <p><strong>Weight:</strong> {pet.weight} kg</p>
                      <p><strong>Age:</strong> {pet.age ? pet.age + ' years' : 'N/A'}</p>
                      <p><strong>Status:</strong> {pet.isActive ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>}</p>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default MyPetsPage;
