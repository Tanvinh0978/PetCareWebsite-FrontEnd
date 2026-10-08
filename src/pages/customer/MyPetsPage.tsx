import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Row, Typography, Space, Modal, message, Spin, Empty, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { IPet } from '@/types/pet.types';
// import { petService } from '@/services/pet.service';

const { Title, Text } = Typography;

const MyPetsPage: React.FC = () => {
  const [pets, setPets] = useState<IPet[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPets = async () => {
    try {
      setLoading(true);
      // MOCK DATA WITH LOCALSTORAGE:
      const stored = localStorage.getItem('mock_pets');
      if (stored) {
        setPets(JSON.parse(stored));
      } else {
        const initialMock = [
          { id: 1, name: 'Lulu', species: 'Dog', breed: 'Poodle', age: 2, weight: 5, gender: 'Female' },
          { id: 2, name: 'Mimi', species: 'Cat', breed: 'British Shorthair', age: 1, weight: 3, gender: 'Female' },
        ];
        localStorage.setItem('mock_pets', JSON.stringify(initialMock));
        setPets(initialMock);
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

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this pet?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          // await petService.deletePet(id);
          const updatedPets = pets.filter(p => p.id !== id);
          localStorage.setItem('mock_pets', JSON.stringify(updatedPets));
          setPets(updatedPets);
          message.success('Pet deleted successfully');
        } catch (error) {
          message.error('Failed to delete pet');
        }
      }
    });
  };

  return (
    <div style={{ padding: '24px 48px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>My Pets</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/customer/pets/new')} size="large" style={{ borderRadius: 8, backgroundColor: '#059669', borderColor: '#059669' }}>
          Add New Pet
        </Button>
      </div>

      {loading && pets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}><Spin size="large" /></div>
      ) : pets.length === 0 ? (
        <Empty description="You have not added any pets yet." />
      ) : (
        <Row gutter={[24, 24]}>
          {pets.map(pet => (
            <Col xs={24} sm={12} md={8} lg={8} key={pet.id}>
              <Card
                hoverable
                style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                actions={[
                  <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/customer/pets/${pet.id}/edit`)}>Edit</Button>,
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(pet.id)}>Delete</Button>
                ]}
              >
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', backgroundColor: '#f0fdf4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32
                  }}>
                    {pet.species === 'Cat' ? '🐱' : pet.species === 'Dog' ? '🐶' : '🐾'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Title level={4} style={{ margin: '0 0 4px 0' }}>{pet.name}</Title>
                    <Space size={[0, 4]} wrap>
                      <Tag color="blue">{pet.species}</Tag>
                      <Tag color={pet.gender === 'Female' ? 'magenta' : 'cyan'}>{pet.gender}</Tag>
                    </Space>
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ display: 'block' }}>Breed: <Text strong>{pet.breed}</Text></Text>
                      <Text type="secondary" style={{ display: 'block' }}>Age: <Text strong>{pet.age} years</Text></Text>
                      <Text type="secondary" style={{ display: 'block' }}>Weight: <Text strong>{pet.weight} kg</Text></Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default MyPetsPage;
