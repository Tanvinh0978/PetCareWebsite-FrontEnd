import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DogIcon, CatIcon } from '@/components/common/PetIcons';
import {
  Row,
  Col,
  Tag,
  Button,
  DatePicker,
  Spin,
  Empty,
  message,
  Image,
  Tooltip,
} from 'antd';
import {
  ClockCircleOutlined,
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  PlayCircleFilled,
  CheckCircleFilled,
  CheckCircleOutlined,
  LoginOutlined,
  WarningFilled,
  ScissorOutlined,
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  SyncOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import groomingTaskService from '@/services/groomingTask.service';
import type { GroomingTaskResponseDTO } from '@/types/groomingTask.types';
import { normalizeStatus } from '@/types/groomingTask.types';
import CompleteGroomingTaskModal from '@/components/staff/CompleteGroomingTaskModal';

export const GroomingTasksPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [tasks, setTasks] = useState<GroomingTaskResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  const [actionLoadingItemId, setActionLoadingItemId] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<GroomingTaskResponseDTO | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const data = await groomingTaskService.getMyTasks({
        date: dateStr,
        pageSize: 100,
      });
      setTasks(data.items || []);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load grooming task schedule.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handlePrevDay = () => setSelectedDate((prev) => prev.subtract(1, 'day'));
  const handleToday = () => setSelectedDate(dayjs());
  const handleNextDay = () => setSelectedDate((prev) => prev.add(1, 'day'));

  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return tasks;
    const tabNum = Number(activeTab);
    if (tabNum === 1) {
      return tasks.filter((t) => {
        const s = normalizeStatus(t.status);
        return s === 1 || s === 0;
      });
    }
    return tasks.filter((t) => normalizeStatus(t.status) === tabNum);
  }, [tasks, activeTab]);

  const counts = useMemo(() => {
    let confirmed = 0;
    let checkedIn = 0;
    let inProgress = 0;
    let completed = 0;

    tasks.forEach((t) => {
      const s = normalizeStatus(t.status);
      if (s === 1 || s === 0) confirmed++;
      else if (s === 2) checkedIn++;
      else if (s === 3) inProgress++;
      else if (s === 4) completed++;
    });

    return { total: tasks.length, confirmed, checkedIn, inProgress, completed };
  }, [tasks]);

  const handleCheckInTask = async (task: GroomingTaskResponseDTO) => {
    try {
      setActionLoadingItemId(task.itemId);
      const currentStatus = normalizeStatus(task.status);
      if (currentStatus === 0) {
        await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
          status: 1,
          roomId: task.roomId || undefined,
        });
      }
      await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
        status: 2,
        roomId: task.roomId || undefined,
      });
      message.success(`Checked in ${task.petName} successfully!`);
      fetchTasks();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to check in pet.';
      message.error(msg);
    } finally {
      setActionLoadingItemId(null);
    }
  };

  const handleStartTask = async (task: GroomingTaskResponseDTO) => {
    try {
      setActionLoadingItemId(task.itemId);
      const currentStatus = normalizeStatus(task.status);
      if (currentStatus === 0) {
        await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
          status: 1,
          roomId: task.roomId || undefined,
        });
      }
      if (currentStatus === 1 || currentStatus === 0) {
        await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
          status: 2,
          roomId: task.roomId || undefined,
        });
      }
      await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
        status: 3,
        roomId: task.roomId || undefined,
      });
      message.success(`Started grooming session for ${task.petName}!`);
      fetchTasks();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to start grooming session.';
      message.error(msg);
    } finally {
      setActionLoadingItemId(null);
    }
  };

  const handleOpenCompleteModal = (task: GroomingTaskResponseDTO) => {
    setCompletingTask(task);
    setCompleteModalOpen(true);
  };

  const tabItems = [
    { key: 'all', label: 'All', count: counts.total },
    { key: '2', label: 'Waiting / Checked-In', count: counts.checkedIn },
    { key: '3', label: 'In Progress', count: counts.inProgress },
    { key: '4', label: 'Completed', count: counts.completed },
    { key: '1', label: 'Confirmed', count: counts.confirmed },
  ];

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '16px 20px 48px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '2.1rem',
              color: '#3d2d23',
              fontWeight: 700,
            }}
          >
            Grooming & Spa Workstation
          </h1>
          <p style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            Track assigned pets, start service sessions, and document completed results in real time.
          </p>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#ffffff',
            padding: '6px 14px',
            borderRadius: 999,
            boxShadow: '0 2px 10px rgba(61,45,35,0.05)',
            border: '1.5px solid #eeddc8',
          }}
        >
          <Tooltip title="Previous day">
            <button
              type="button"
              onClick={handlePrevDay}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '1px solid #eeddc8',
                backgroundColor: '#faf6f0',
                color: '#785839',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <LeftOutlined />
            </button>
          </Tooltip>

          <button
            type="button"
            onClick={handleToday}
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.82rem',
              fontWeight: 700,
              border: selectedDate.isSame(dayjs(), 'day') ? 'none' : '1px solid #eeddc8',
              backgroundColor: selectedDate.isSame(dayjs(), 'day') ? '#3d2d23' : '#ffffff',
              color: selectedDate.isSame(dayjs(), 'day') ? '#ffffff' : '#785839',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Today
          </button>

          <DatePicker
            value={selectedDate}
            onChange={(d) => d && setSelectedDate(d)}
            format="DD/MM/YYYY"
            allowClear={false}
            style={{
              borderRadius: 999,
              width: 135,
              height: 32,
              border: '1px solid #eeddc8',
              fontSize: '0.85rem',
            }}
          />

          <Tooltip title="Next day">
            <button
              type="button"
              onClick={handleNextDay}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '1px solid #eeddc8',
                backgroundColor: '#faf6f0',
                color: '#785839',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <RightOutlined />
            </button>
          </Tooltip>

          <Tooltip title="Refresh task list">
            <button
              type="button"
              onClick={fetchTasks}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '1px solid #eeddc8',
                backgroundColor: '#faf6f0',
                color: '#785839',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 12,
                marginLeft: 4,
              }}
            >
              <ReloadOutlined spin={loading} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
        {tabItems.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 18px',
                borderRadius: 999,
                backgroundColor: isActive ? '#3d2d23' : '#ffffff',
                color: isActive ? '#ffffff' : '#785839',
                border: isActive ? 'none' : '1.5px solid #eeddc8',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: isActive
                  ? '0 4px 14px rgba(61,45,35,0.18)'
                  : '0 1px 3px rgba(61,45,35,0.04)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{t.label}</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  backgroundColor: isActive ? '#eeddc8' : '#faf6f0',
                  color: isActive ? '#3d2d23' : '#785839',
                  border: isActive ? 'none' : '1px solid #eeddc8',
                }}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <Spin spinning={loading} tip="Loading grooming tasks...">
        {filteredTasks.length === 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1.5px dashed #eeddc8',
              padding: '60px 20px',
              textAlign: 'center',
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <strong style={{ fontSize: '1.05rem', color: '#3d2d23', display: 'block' }}>
                    No grooming tasks scheduled for {selectedDate.format('DD/MM/YYYY')}
                  </strong>
                  <span style={{ fontSize: '0.88rem', color: '#8c735f', display: 'block', marginTop: 4 }}>
                    {activeTab === 'all'
                      ? 'No appointments assigned yet for this workstation date.'
                      : 'No tasks match the currently selected filter.'}
                  </span>
                </div>
              }
            />
          </div>
        ) : (
          <Row gutter={[20, 20]}>
            {filteredTasks.map((task) => {
              const status = normalizeStatus(task.status);
              const isDog = task.petSpecies === 0 || String(task.petSpecies).toLowerCase() === 'dog';
              const isConfirmed = status === 1 || status === 0;
              const isCheckedIn = status === 2;
              const isInProgress = status === 3;
              const isCompleted = status === 4;

              const startTime = task.scheduledStartAt
                ? dayjs(task.scheduledStartAt).format('HH:mm')
                : '--:--';
              const endTime = task.scheduledEndAt
                ? dayjs(task.scheduledEndAt).format('HH:mm')
                : '--:--';

              return (
                <Col xs={24} md={12} lg={8} key={task.itemId}>
                  <div
                    onClick={() => {
                      if (isInProgress || isCompleted) {
                        handleOpenCompleteModal(task);
                      }
                    }}
                    style={{
                      borderRadius: '20px',
                      cursor: isInProgress || isCompleted ? 'pointer' : 'default',
                      backgroundColor: '#ffffff',
                      border: isInProgress
                        ? '2px solid #785839'
                        : isCheckedIn
                        ? '1.5px solid #d97706'
                        : '1.5px solid #eeddc8',
                      boxShadow: isInProgress
                        ? '0 6px 20px rgba(120,88,57,0.14)'
                        : isCheckedIn
                        ? '0 4px 16px rgba(217,119,6,0.1)'
                        : '0 4px 16px rgba(61,45,35,0.04)',
                      padding: '20px 22px',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #f1ece5',
                        paddingBottom: 12,
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ClockCircleOutlined style={{ color: '#785839', fontSize: 14 }} />
                          <strong style={{ fontSize: '0.98rem', color: '#3d2d23' }}>
                            {startTime} - {endTime}
                          </strong>
                          {task.durationMinutes > 0 && (
                            <span
                              style={{
                                fontSize: '0.74rem',
                                borderRadius: 999,
                                padding: '1px 7px',
                                backgroundColor: '#faf6f0',
                                border: '1px solid #eeddc8',
                                color: '#785839',
                                fontWeight: 600,
                              }}
                            >
                              {task.durationMinutes}m
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            marginTop: 4,
                            color: '#8c735f',
                            fontSize: '0.82rem',
                          }}
                        >
                          <HomeOutlined style={{ color: '#785839' }} />
                          <span>{task.roomName || 'Pending Station Assignment'}</span>
                        </div>
                      </div>

                      {isConfirmed && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 10px',
                            borderRadius: 999,
                            backgroundColor: '#f0f9ff',
                            color: '#0369a1',
                            border: '1px solid #bae6fd',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          <CheckCircleOutlined style={{ fontSize: 11 }} />
                          <span>Confirmed</span>
                        </span>
                      )}
                      {isCheckedIn && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 10px',
                            borderRadius: 999,
                            backgroundColor: '#fffbeb',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                          <span>Ready / Checked-In</span>
                        </span>
                      )}
                      {isInProgress && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 10px',
                            borderRadius: 999,
                            backgroundColor: '#fcf9f5',
                            color: '#785839',
                            border: '1.5px solid #eeddc8',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          <SyncOutlined spin style={{ fontSize: 11, color: '#785839' }} />
                          <span>In Progress</span>
                        </span>
                      )}
                      {isCompleted && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 10px',
                            borderRadius: 999,
                            backgroundColor: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          <CheckCircleFilled style={{ fontSize: 11 }} />
                          <span>Completed</span>
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            backgroundColor: '#faf6f0',
                            border: '1.5px solid #eeddc8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {isDog ? <DogIcon size={18} /> : <CatIcon size={18} />}
                        </div>
                        <div>
                          <strong
                            style={{
                              fontSize: '1.1rem',
                              color: '#3d2d23',
                              display: 'block',
                              lineHeight: 1.25,
                              fontFamily: "'Playfair Display', Georgia, serif",
                            }}
                          >
                            {task.petName}
                          </strong>
                          <span style={{ fontSize: '0.82rem', color: '#8c735f' }}>
                            {task.petBreed || (isDog ? 'Canine' : 'Feline')} •{' '}
                            <strong style={{ color: '#3d2d23' }}>{task.petWeight} kg</strong>
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          backgroundColor: '#faf6f0',
                          border: '1px solid #eeddc8',
                          borderRadius: '10px',
                          padding: '9px 12px',
                          marginBottom: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <ScissorOutlined style={{ color: '#785839', fontSize: 15 }} />
                        <strong style={{ fontSize: '0.88rem', color: '#3d2d23' }}>
                          {task.serviceName}
                        </strong>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.85rem',
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#554236' }}>
                          <UserOutlined style={{ color: '#8c735f' }} />
                          <span style={{ fontWeight: 600 }}>{task.customerName}</span>
                        </div>
                        <a
                          href={`tel:${task.customerPhone}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#785839',
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          <PhoneOutlined />
                          <span>{task.customerPhone}</span>
                        </a>
                      </div>

                      {task.petHealthNotes ? (
                        <div
                          style={{
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '10px',
                            padding: '9px 12px',
                            marginBottom: 14,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                          }}
                        >
                          <WarningFilled style={{ color: '#d97706', fontSize: 15, marginTop: 2, flexShrink: 0 }} />
                          <div style={{ fontSize: '0.8rem', color: '#92400e', lineHeight: 1.4 }}>
                            <strong>Special Pet Notice:</strong> {task.petHealthNotes}
                          </div>
                        </div>
                      ) : null}

                      {isCompleted && (
                        <div
                          style={{
                            backgroundColor: '#fcf9f5',
                            border: '1px solid #eeddc8',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            marginBottom: 14,
                          }}
                        >
                          {(task.beforeImageUrl || task.resultImageUrl) && (
                            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                              <Image.PreviewGroup>
                                {task.beforeImageUrl && (
                                  <div style={{ textAlign: 'center' }}>
                                    <Image
                                      src={task.beforeImageUrl}
                                      width={56}
                                      height={56}
                                      style={{ objectFit: 'cover', borderRadius: 8, border: '1.5px solid #eeddc8' }}
                                    />
                                    <div style={{ fontSize: 10, color: '#8c735f', marginTop: 2 }}>Before</div>
                                  </div>
                                )}
                                {task.resultImageUrl && (
                                  <div style={{ textAlign: 'center' }}>
                                    <Image
                                      src={task.resultImageUrl}
                                      width={56}
                                      height={56}
                                      style={{ objectFit: 'cover', borderRadius: 8, border: '1.5px solid #eeddc8' }}
                                    />
                                    <div style={{ fontSize: 10, color: '#047857', fontWeight: 700, marginTop: 2 }}>Finished Result</div>
                                  </div>
                                )}
                              </Image.PreviewGroup>
                            </div>
                          )}
                          {task.resultNote && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: '0.8rem',
                                color: '#554236',
                                fontStyle: 'italic',
                                lineHeight: 1.4,
                              }}
                            >
                              "{task.resultNote}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      style={{ borderTop: '1px solid #f1ece5', paddingTop: 14, marginTop: 'auto' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isConfirmed && (
                        <button
                          type="button"
                          disabled={actionLoadingItemId === task.itemId}
                          onClick={() => handleCheckInTask(task)}
                          style={{
                            width: '100%',
                            height: 42,
                            borderRadius: 999,
                            backgroundColor: '#3d2d23',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            border: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            boxShadow: '0 4px 14px rgba(61,45,35,0.18)',
                            cursor: actionLoadingItemId === task.itemId ? 'not-allowed' : 'pointer',
                            opacity: actionLoadingItemId === task.itemId ? 0.7 : 1,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <LoginOutlined />
                          <span>{actionLoadingItemId === task.itemId ? 'Checking in...' : 'Check In'}</span>
                        </button>
                      )}

                      {isCheckedIn && (
                        <button
                          type="button"
                          disabled={actionLoadingItemId === task.itemId}
                          onClick={() => handleStartTask(task)}
                          style={{
                            width: '100%',
                            height: 42,
                            borderRadius: 999,
                            backgroundColor: '#3d2d23',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            border: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            boxShadow: '0 4px 14px rgba(61,45,35,0.22)',
                            cursor: actionLoadingItemId === task.itemId ? 'not-allowed' : 'pointer',
                            opacity: actionLoadingItemId === task.itemId ? 0.7 : 1,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <PlayCircleFilled style={{ fontSize: 15 }} />
                          <span>{actionLoadingItemId === task.itemId ? 'Starting...' : 'Start Service'}</span>
                        </button>
                      )}

                      {isInProgress && (
                        <button
                          type="button"
                          onClick={() => handleOpenCompleteModal(task)}
                          style={{
                            width: '100%',
                            height: 42,
                            borderRadius: 999,
                            backgroundColor: '#047857',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            border: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            boxShadow: '0 4px 14px rgba(4,120,87,0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <CheckCircleFilled style={{ fontSize: 15 }} />
                          <span>Finish & Submit Result</span>
                        </button>
                      )}

                      {isCompleted && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '0.82rem',
                              color: '#047857',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <CheckCircleFilled /> Finished & Documented
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenCompleteModal(task)}
                            style={{
                              borderRadius: 999,
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              padding: '5px 12px',
                              backgroundColor: '#ffffff',
                              border: '1.5px solid #eeddc8',
                              color: '#785839',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              cursor: 'pointer',
                            }}
                          >
                            <EditOutlined style={{ fontSize: 12 }} />
                            <span>View / Edit Result</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </Spin>

      <CompleteGroomingTaskModal
        open={completeModalOpen}
        onClose={() => {
          setCompleteModalOpen(false);
          setCompletingTask(null);
        }}
        onSuccess={() => {
          fetchTasks();
        }}
        task={completingTask}
      />
    </div>
  );
};

export default GroomingTasksPage;
