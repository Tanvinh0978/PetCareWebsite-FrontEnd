import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/auth/AuthContext';
import { ROLE_BASE, type Role } from '../shared/auth/roles';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const enter = (role: Role) => { signIn(role); navigate(ROLE_BASE[role]); };
  return (
    <section className="page narrow">
      <h1>Sign in</h1>
      <p>Demo sign-in: the backend has no login API yet, so pick a role to preview its screens.</p>
      <p className="actions">
        <button className="btn" onClick={() => enter('customer')}>Continue as Customer</button>
        <button className="btn" onClick={() => enter('admin')}>Continue as Admin</button>
      </p>
    </section>
  );
}
