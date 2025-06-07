import { useState } from 'react';
import classes from './register.module.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // импортируем хук аутентификации

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [key, setKey] = useState('');
  const [username, setUsername] = useState('');
  const [focused, setFocused] = useState({
    key: false,
    username: false,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/register`,
        {
          key,
          username
        },
        {
          withCredentials: true,
        }
      );
      if (response.status === 201) {
        login(response.data.user);
        navigate('/profile');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <form className={classes.registerForm} onSubmit={handleSubmit}>
      <input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        onFocus={() => setFocused((f) => ({ ...f, key: true }))}
        onBlur={() => setFocused((f) => ({ ...f, key: false }))}
        placeholder={focused.key ? '' : 'Ключ'}
        type='text'
        required
      />

      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onFocus={() => setFocused((f) => ({ ...f, username: true}))}
        onBlur={() => setFocused((f) => ({ ...f, username: false }))}
        placeholder={focused.username ? '' : 'Логин'}
        type='text'
        required 
      />

      {errorMessage && (
        <div className={classes.errorMessage}>{errorMessage}</div>
      )}

      <button type="submit">
        Регистрация
      </button>

      <Link to='/login' className={classes.registerLink}>Вход</Link>
        
    </form>
  );
};