import React from 'react'
import { Tag, Tooltip } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  CloseCircleOutlined,
  StopOutlined,
  ScissorOutlined,
  HomeOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { isCat } from '@/types/pet.types'

/**
 * Clean, professional vector line icon for Dogs (Lucide/Heroicons standard style).
 */
export const DogIcon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 16,
  width,
  height,
  className,
  style,
  ...props
}) => (
  <svg
    width={width || size}
    height={height || size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ display: 'inline-block', verticalAlign: '-0.15em', flexShrink: 0, ...style }}
    {...props}
  >
    <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.996 1 .012.35.034.708.067 1.077 1.157 1.45 2.825 2.453 4.937 2.453 2.112 0 3.78-.997 4.937-2.453.033-.369.055-.727.067-1.077 2.271.722 3.916-.297 3.996-1 .113-.994-1.177-6.53-4-7-1.923-.321-3.5.782-3.5 2.172" />
    <path d="M9 14v1a3 3 0 0 0 6 0v-1" />
    <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
  </svg>
)

/**
 * Clean, professional vector line icon for Cats (Lucide/Heroicons standard style).
 */
export const CatIcon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 16,
  width,
  height,
  className,
  style,
  ...props
}) => (
  <svg
    width={width || size}
    height={height || size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ display: 'inline-block', verticalAlign: '-0.15em', flexShrink: 0, ...style }}
    {...props}
  >
    <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3.1-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" />
    <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
    <path d="M11.25 15.5h1.5L12 16.5l-.75-1Z" fill="currentColor" stroke="none" />
  </svg>
)

/**
 * Professional vector paw print icon.
 */
export const PawIcon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 16,
  width,
  height,
  className,
  style,
  ...props
}) => (
  <svg
    width={width || size}
    height={height || size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ display: 'inline-block', verticalAlign: '-0.15em', flexShrink: 0, ...style }}
    {...props}
  >
    <ellipse cx="4.5" cy="10" rx="1.8" ry="2.6" />
    <ellipse cx="9" cy="5.5" rx="1.8" ry="2.6" />
    <ellipse cx="15" cy="5.5" rx="1.8" ry="2.6" />
    <ellipse cx="19.5" cy="10" rx="1.8" ry="2.6" />
    <path d="M12 11c-3.2 0-6 2-6 5 0 2 1.6 3.2 3.2 3.2 1.4 0 2-.7 2.8-.9.8.2 1.4.9 2.8.9 1.6 0 3.2-1.2 3.2-3.2 0-3-2.8-5-6-5z" />
  </svg>
)

export interface SpeciesBadgeProps {
  species: unknown
  size?: 'small' | 'middle' | 'large'
  showIconOnly?: boolean
  style?: React.CSSProperties
}

/**
 * Reusable, unified Species Badge for Dog / Cat.
 */
export const SpeciesBadge: React.FC<SpeciesBadgeProps> = ({
  species,
  size = 'small',
  showIconOnly = false,
  style,
}) => {
  const cat = isCat(species)
  const isSmall = size === 'small'

  if (cat) {
    return (
      <Tag
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          backgroundColor: '#faf5ff',
          borderColor: '#e9d5ff',
          color: '#7e22ce',
          fontWeight: 600,
          borderRadius: 6,
          padding: isSmall ? '1px 7px' : '3px 10px',
          fontSize: isSmall ? 11 : 12,
          margin: 0,
          ...style,
        }}
      >
        <CatIcon size={isSmall ? 13 : 15} />
        {!showIconOnly && 'Cat'}
      </Tag>
    )
  }

  return (
    <Tag
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
        color: '#1d4ed8',
        fontWeight: 600,
        borderRadius: 6,
        padding: isSmall ? '1px 7px' : '3px 10px',
        fontSize: isSmall ? 11 : 12,
        margin: 0,
        ...style,
      }}
    >
      <DogIcon size={isSmall ? 13 : 15} />
      {!showIconOnly && 'Dog'}
    </Tag>
  )
}

export interface BookingStatusBadgeProps {
  status: number | string
  reason?: string
  isNoShow?: boolean
  style?: React.CSSProperties
}

/**
 * Unified, professional Booking Status Badge with crisp SVG vector icons.
 */
export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({
  status,
  reason,
  isNoShow: explicitNoShow,
  style,
}) => {
  const s = Number(status)
  const isNoShow =
    explicitNoShow ||
    s === 4 ||
    status === 'No_Show' ||
    status === 'No-Show' ||
    status === 'noshow' ||
    (reason && reason.toLowerCase().includes('no-show'))

  if (isNoShow) {
    return (
      <Tooltip title={reason || 'Customer did not show up (No-Show)'}>
        <Tag
          icon={<StopOutlined />}
          style={{
            backgroundColor: '#f5f3ff',
            borderColor: '#ddd6fe',
            color: '#6d28d9',
            fontWeight: 600,
            borderRadius: 6,
            padding: '2px 8px',
            ...style,
          }}
        >
          No-Show
        </Tag>
      </Tooltip>
    )
  }

  if (s === 0 || status === 'Pending' || status === 'pending') {
    return (
      <Tag
        icon={<ClockCircleOutlined />}
        style={{
          backgroundColor: '#fffbeb',
          borderColor: '#fde68a',
          color: '#b45309',
          fontWeight: 600,
          borderRadius: 6,
          padding: '2px 8px',
          ...style,
        }}
      >
        Pending
      </Tag>
    )
  }

  if (s === 1 || status === 'Confirmed' || status === 'confirmed') {
    return (
      <Tag
        icon={<CheckCircleOutlined />}
        style={{
          backgroundColor: '#eff6ff',
          borderColor: '#bfdbfe',
          color: '#1d4ed8',
          fontWeight: 600,
          borderRadius: 6,
          padding: '2px 8px',
          ...style,
        }}
      >
        Confirmed
      </Tag>
    )
  }

  if (s === 2 || status === 'Completed' || status === 'completed') {
    return (
      <Tag
        icon={<CheckCircleFilled />}
        style={{
          backgroundColor: '#f0fdf4',
          borderColor: '#bbf7d0',
          color: '#15803d',
          fontWeight: 600,
          borderRadius: 6,
          padding: '2px 8px',
          ...style,
        }}
      >
        Completed
      </Tag>
    )
  }

  if (s === 3 || status === 'Cancelled' || status === 'cancelled') {
    return (
      <Tooltip title={reason || undefined}>
        <Tag
          icon={<CloseCircleOutlined />}
          style={{
            backgroundColor: '#fef2f2',
            borderColor: '#fecaca',
            color: '#b91c1c',
            fontWeight: 600,
            borderRadius: 6,
            padding: '2px 8px',
            ...style,
          }}
        >
          Cancelled
        </Tag>
      </Tooltip>
    )
  }

  return <Tag style={{ borderRadius: 6, ...style }}>{status}</Tag>
}

export interface ServiceTypeBadgeProps {
  type: 'Boarding' | 'Grooming' | 'Daycare' | string
  style?: React.CSSProperties
}

/**
 * Unified Service Type Badge with vector icons.
 */
export const ServiceTypeBadge: React.FC<ServiceTypeBadgeProps> = ({ type, style }) => {
  const isBoarding = type.toLowerCase().includes('boarding')
  const isDaycare = type.toLowerCase().includes('daycare')

  if (isBoarding) {
    return (
      <Tag
        icon={<HomeOutlined />}
        style={{
          backgroundColor: '#ecfeff',
          borderColor: '#a5f3fc',
          color: '#0e7490',
          fontWeight: 600,
          borderRadius: 6,
          padding: '2px 8px',
          fontSize: 11,
          ...style,
        }}
      >
        Boarding Stay
      </Tag>
    )
  }

  if (isDaycare) {
    return (
      <Tag
        icon={<ShopOutlined />}
        style={{
          backgroundColor: '#fffbeb',
          borderColor: '#fde68a',
          color: '#b45309',
          fontWeight: 600,
          borderRadius: 6,
          padding: '2px 8px',
          fontSize: 11,
          ...style,
        }}
      >
        Daycare Stay
      </Tag>
    )
  }

  return (
    <Tag
      icon={<ScissorOutlined />}
      style={{
        backgroundColor: '#f5f3ff',
        borderColor: '#ddd6fe',
        color: '#6d28d9',
        fontWeight: 600,
        borderRadius: 6,
        padding: '2px 8px',
        fontSize: 11,
        ...style,
      }}
    >
      Grooming Appointment
    </Tag>
  )
}
