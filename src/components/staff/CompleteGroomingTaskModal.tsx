import React, { useState, useEffect } from 'react';
import { DogIcon, CatIcon } from '@/components/common/PetIcons';
import {
  Modal,
  Form,
  Input,
  Typography,
  Tag,
  Alert,
  Divider,
  Row,
  Col,
  message,
} from 'antd';
import {
  CheckCircleFilled,
  HeartFilled,
  WarningOutlined,
  ScissorOutlined,
  UserOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import ImageUpload from '@/components/common/ImageUpload';
import groomingTaskService from '@/services/groomingTask.service';
import type { GroomingTaskResponseDTO } from '@/types/groomingTask.types';
import { normalizeStatus } from '@/types/groomingTask.types';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface CompleteGroomingTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: GroomingTaskResponseDTO | null;
}

const quickTags = [
  'Very well-behaved & gentle',
  'Nails trimmed & filed',
  'Ears cleaned thoroughly',
  'Anal glands expressed',
  'Round teddy bear cut applied',
  'Matted fur brushed & untangled',
  'Mild skin redness - please monitor',
  'Sensitive to loud blow dryer',
];

export const CompleteGroomingTaskModal: React.FC<CompleteGroomingTaskModalProps> = ({
  open,
  onClose,
  onSuccess,
  task,
}) => {
  const [form] = Form.useForm();
  const [beforeImage, setBeforeImage] = useState<string>('');
  const [resultImage, setResultImage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open && task) {
      setErrorMsg(null);
      setBeforeImage(task.beforeImageUrl || '');
      setResultImage(task.resultImageUrl || '');
      form.setFieldsValue({
        resultNote: task.resultNote || '',
      });
    }
  }, [open, task, form]);

  if (!task) return null;

  const handleTagClick = (tag: string) => {
    const currentNote = form.getFieldValue('resultNote') || '';
    const newNote = currentNote ? `${currentNote}. ${tag}` : tag;
    form.setFieldsValue({ resultNote: newNote });
  };

  const handleSubmit = async (values: { resultNote?: string }) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const currentStatus = normalizeStatus(task.status);

      if (currentStatus === 1 || currentStatus === 0) {
        await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
          status: 2,
          roomId: task.roomId || undefined,
        });
        await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
          status: 3,
          roomId: task.roomId || undefined,
        });
      } else if (currentStatus === 2) {
        await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
          status: 3,
          roomId: task.roomId || undefined,
        });
      }

      await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
        status: 4,
        resultNote: values.resultNote?.trim() || 'Service completed successfully.',
        beforeImageUrl: beforeImage || null,
        resultImageUrl: resultImage || null,
        roomId: task.roomId || undefined,
      });

      message.success(`Grooming session for ${task.petName} has been completed successfully!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update grooming task status.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isDog = task.petSpecies === 0 || String(task.petSpecies).toLowerCase() === 'dog';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
      centered
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              backgroundColor: '#faf6f0',
              border: '1.5px solid #eeddc8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#785839',
              fontSize: 20,
            }}
          >
            <CheckCircleFilled />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: '#3d2d23', fontFamily: "'Playfair Display', Georgia, serif" }}>
              Complete & Hand Over Service Session
            </Title>
            <Text type="secondary" style={{ fontSize: 13, color: '#8c735f' }}>
              Record grooming outcomes and before/after photos to hand over to reception & pet owner
            </Text>
          </div>
        </div>
      }
    >
      <div style={{ padding: '12px 0' }}>
        {/* Task Summary Banner */}
        <div
          style={{
            backgroundColor: '#fdfbf7',
            border: '1.5px solid #eeddc8',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: '#faf6f0',
                    border: '1px solid #eeddc8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDog ? <DogIcon size={20} /> : <CatIcon size={20} />}
                </div>
                <strong style={{ fontSize: 17, color: '#3d2d23', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {task.petName}
                </strong>
                {task.petBreed && (
                  <span
                    style={{
                      borderRadius: 999,
                      padding: '2px 8px',
                      backgroundColor: '#faf6f0',
                      border: '1px solid #eeddc8',
                      color: '#785839',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {task.petBreed}
                  </span>
                )}
                <span
                  style={{
                    borderRadius: 999,
                    padding: '2px 8px',
                    backgroundColor: '#faf6f0',
                    border: '1px solid #eeddc8',
                    color: '#785839',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {task.petWeight} kg
                </span>
              </div>

              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#554236' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <ScissorOutlined style={{ color: '#785839' }} />
                  <strong>Service:</strong> {task.serviceName}
                </span>
                {task.roomName && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <HomeOutlined style={{ color: '#785839' }} />
                    <strong>Station:</strong> {task.roomName}
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <UserOutlined style={{ color: '#785839' }} />
                  <strong>Owner:</strong> {task.customerName} ({task.customerPhone})
                </span>
              </div>
            </div>

            {normalizeStatus(task.status) === 4 ? (
              <span style={{ padding: '4px 12px', borderRadius: 999, backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.8rem', fontWeight: 700 }}>
                Completed
              </span>
            ) : normalizeStatus(task.status) === 3 ? (
              <span style={{ padding: '4px 12px', borderRadius: 999, backgroundColor: '#fcf9f5', color: '#785839', border: '1px solid #eeddc8', fontSize: '0.8rem', fontWeight: 700 }}>
                In Progress
              </span>
            ) : normalizeStatus(task.status) === 2 ? (
              <span style={{ padding: '4px 12px', borderRadius: 999, backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.8rem', fontWeight: 700 }}>
                Ready / Checked-In
              </span>
            ) : (
              <span style={{ padding: '4px 12px', borderRadius: 999, backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.8rem', fontWeight: 700 }}>
                Confirmed
              </span>
            )}
          </div>

          {/* Health Alert Note if present */}
          {task.petHealthNotes && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#92400e',
              }}
            >
              <WarningOutlined style={{ color: '#d97706', fontSize: 16 }} />
              <span>
                <strong>Special Pet Notice:</strong> {task.petHealthNotes}
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <Alert
            type="error"
            message={errorMsg}
            showIcon
            closable
            onClose={() => setErrorMsg(null)}
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Images Section */}
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#3d2d23', display: 'block', marginBottom: 10 }}>
              Pet Photography (Before & After Service)
            </span>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div
                  style={{
                    border: '1.5px solid #eeddc8',
                    borderRadius: 14,
                    padding: '16px',
                    backgroundColor: '#fdfbf7',
                    textAlign: 'center',
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: 4, color: '#3d2d23', fontSize: 13 }}>
                    1. Before Service Photo (Before)
                  </strong>
                  <span style={{ fontSize: 12, color: '#8c735f', display: 'block', marginBottom: 12 }}>
                    Coat & condition upon check-in
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ImageUpload
                      value={beforeImage}
                      onChange={(url) => setBeforeImage(url)}
                      folder="grooming-results"
                      width={180}
                      height={180}
                      title="Upload Before Photo"
                      helperText="JPG, PNG, WEBP up to 5MB"
                    />
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div
                  style={{
                    border: '1.5px solid #eeddc8',
                    borderRadius: 14,
                    padding: '16px',
                    backgroundColor: '#fdfbf7',
                    textAlign: 'center',
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: 4, color: '#3d2d23', fontSize: 13 }}>
                    2. After Service Photo (After) ⭐
                  </strong>
                  <span style={{ fontSize: 12, color: '#8c735f', display: 'block', marginBottom: 12 }}>
                    Styled, cleaned, and finished result
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ImageUpload
                      value={resultImage}
                      onChange={(url) => setResultImage(url)}
                      folder="grooming-results"
                      width={180}
                      height={180}
                      title="Upload After Photo"
                      helperText="Final result photo for owner"
                    />
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Quick Tags Suggestions */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: '#8c735f', display: 'block', marginBottom: 8, fontWeight: 600 }}>
              Quick note suggestions (Click to append):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {quickTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 999,
                    padding: '4px 12px',
                    backgroundColor: '#faf6f0',
                    border: '1px solid #eeddc8',
                    color: '#785839',
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => handleTagClick(tag)}
                >
                  + {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Result Note */}
          <Form.Item
            name="resultNote"
            label={<span style={{ fontWeight: 700, color: '#3d2d23' }}>Care Notes & Result Feedback</span>}
            rules={[
              { required: true, message: 'Please provide care notes or result feedback!' },
              { max: 1000, message: 'Notes cannot exceed 1000 characters!' },
            ]}
          >
            <TextArea
              rows={4}
              showCount
              maxLength={1000}
              placeholder="e.g. Pet was very well-behaved and gentle. Ears cleaned thoroughly, nails trimmed and round teddy bear style applied. Sensitive to loud dryer so low heat mode was used..."
              style={{
                borderRadius: 10,
                border: '1.5px solid #eeddc8',
                padding: '10px 12px',
                fontSize: '0.92rem',
              }}
            />
          </Form.Item>

          <Divider style={{ margin: '18px 0', borderColor: '#f1ece5' }} />

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '0.6rem 1.4rem',
                backgroundColor: '#ffffff',
                border: '1.5px solid #eeddc8',
                borderRadius: 999,
                color: '#785839',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.65rem 1.8rem',
                backgroundColor: '#3d2d23',
                color: '#ffffff',
                border: 'none',
                borderRadius: 999,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(61,45,35,0.18)',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              <HeartFilled />
              <span>{submitting ? 'Saving...' : 'Save & Notify Reception'}</span>
            </button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default CompleteGroomingTaskModal;
