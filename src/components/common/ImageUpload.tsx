import React, { useState, useRef } from 'react'
import { Upload, Button, message, Space, Typography, Image } from 'antd'
import {
  UploadOutlined,
  DeleteOutlined,
  LoadingOutlined,
  EyeOutlined,
  FileImageOutlined,
} from '@ant-design/icons'
import { mediaService } from '@/services/media.service'

const { Text } = Typography

interface ImageUploadProps {
  value?: string
  onChange?: (url: string) => void
  folder?: string
  shape?: 'square' | 'circle'
  width?: number | string
  height?: number | string
  title?: string
  helperText?: string
  disabled?: boolean
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  folder = 'general',
  shape = 'square',
  width = 160,
  height = 160,
  title = 'Upload Image',
  helperText = 'PNG, JPG, WEBP up to 5MB',
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('You can only upload image files (JPG, PNG, WEBP, etc.)!')
      return
    }

    // Validate size (5MB)
    const isLt5M = file.size / 1024 / 1024 < 5
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!')
      return
    }

    try {
      setUploading(true)
      const url = await mediaService.upload(file, folder)
      if (url) {
        onChange?.(url)
        message.success('Image uploaded successfully!')
      } else {
        message.error('Failed to get uploaded image URL.')
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Failed to upload image'
      message.error(errorMsg)
    } finally {
      setUploading(false)
      // Reset input value so user can upload the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange?.('')
  }

  const isCircle = shape === 'circle'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Preview / Placeholder container */}
        <div
          style={{
            width,
            height,
            minWidth: width,
            borderRadius: isCircle ? '50%' : '8px',
            border: '2px dashed #cbd5e1',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            cursor: disabled || uploading ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.2s',
          }}
          onClick={() => {
            if (!disabled && !uploading && !value) {
              fileInputRef.current?.click()
            }
          }}
        >
          {uploading ? (
            <div style={{ textAlign: 'center', padding: '4px' }}>
              <LoadingOutlined style={{ fontSize: typeof width === 'number' && width < 100 ? 20 : 26, color: '#059669' }} />
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                Uploading...
              </div>
            </div>
          ) : value ? (
            <>
              <img
                src={value}
                alt="Uploaded preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Overlay with preview & change button */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                className="img-overlay"
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined style={{ color: '#fff', fontSize: '13px' }} />}
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreviewVisible(true)
                  }}
                  title="View full image"
                />
                {!disabled && (
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined style={{ color: '#f87171', fontSize: '13px' }} />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove()
                    }}
                    title="Remove image"
                  />
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '4px' }}>
              <FileImageOutlined style={{ fontSize: typeof width === 'number' && width < 100 ? 20 : 26, color: '#94a3b8' }} />
              <div
                style={{
                  fontSize: typeof width === 'number' && width < 100 ? '0.72rem' : '0.8rem',
                  fontWeight: 600,
                  color: '#475569',
                  marginTop: 2,
                }}
              >
                {title}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Space orientation="horizontal" size="small">
            <Button
              size="small"
              icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
              loading={uploading}
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
            >
              {value ? 'Change' : 'Select Image'}
            </Button>
            {value && !disabled && (
              <Button size="small" danger icon={<DeleteOutlined />} onClick={handleRemove}>
                Remove
              </Button>
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: '0.75rem', margin: 0 }}>
            {helperText}
          </Text>
        </div>
      </div>

      {/* Hidden Image for Preview */}
      {value && (
        <div style={{ display: 'none' }}>
          <Image
            preview={{
              visible: previewVisible,
              src: value,
              onVisibleChange: (vis) => setPreviewVisible(vis),
            }}
          />
        </div>
      )}
    </div>
  )
}

export default ImageUpload
