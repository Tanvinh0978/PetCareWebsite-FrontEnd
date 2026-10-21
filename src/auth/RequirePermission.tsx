import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission } from './permissionHelper';
import { Result, Button } from 'antd';

interface RequirePermissionProps {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RequirePermission({ permission, children, fallback }: RequirePermissionProps) {
  const user = useAuthStore((s) => s.user);

  if (hasPermission(user, permission)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <Result
        status="403"
        title="403 - Quyền truy cập bị từ chối"
        subTitle="Tài khoản của bạn chưa được cấp quyền để truy cập trang này. Vui lòng liên hệ Quản trị viên hệ thống."
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Quay lại trang trước
          </Button>
        }
      />
    </div>
  );
}

