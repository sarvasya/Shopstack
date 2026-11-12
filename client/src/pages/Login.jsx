import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { authenticate } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await authenticate(mode, form);
      nav('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="panel narrow" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Log in' : 'Create account'}</h2>
      {mode === 'register' && <input placeholder="Name" value={form.name} onChange={set('name')} required />}
      <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
      <input type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={set('password')} required />
      {error && <p className="error">{error}</p>}
      <button className="btn">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
      <button type="button" className="ghost" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
      </button>
    </form>
  );
}
