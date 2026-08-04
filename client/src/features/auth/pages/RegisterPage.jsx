import { Link } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm.jsx';

// RegisterPage: public page hosting the account creation form.
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
