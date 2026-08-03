import { Link } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm.jsx';

export function RegisterPage() {
  return (
    <main className="page">
      <RegisterForm />
      <p className="muted">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </main>
  );
}
