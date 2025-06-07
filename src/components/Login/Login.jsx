import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import classes from './login.module.css';

export default function Login() {
  const [key, setKey] = useState('');

  const [focused, setFocused] = useState({ key: false });

  const navigate = useNavigate();
  const { user, loading, login } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/profile');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post(
      'http://localhost:5000/api/login',
      { key },
      { withCredentials: true }
    );
    if (res.status === 200 && res.data.user) {
      login(res.data.user);
      navigate('/profile');
    }
  } catch (err) {
    if (err.response && err.response.data && err.response.data.error) {
      alert('Ошибка входа: ' + err.response.data.error);
    } else {
      alert('Ошибка входа: неизвестная ошибка');
    }
    console.error('Login error:', err);
  }
};

  if (loading) return <div>Загрузка...</div>;

  return (
    <form className={classes.loginForm} onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={focused.key ? '' : 'Ключ'}
        value={key}
        onChange={e => setKey(e.target.value)}
        onFocus={() => setFocused(f => ({ ...f, key: true }))}
        onBlur={() => setFocused(f => ({ ...f, key: false }))}
        required
      />

      <button type="submit">Войти</button>

      <Link to="/" className={classes.loginLink}>Регистрация</Link>
    </form>
  );
};
