import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import classes from './profile.module.css';
import Navbar from '../../components/Navbar/Navbar';
import axios from 'axios';

export default function Profile() {
  const { user, loading, logout, updateUser, uploadAvatar } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!uploading && user?.avatar) {
      setAvatarPreview(getAvatarUrl(user.avatar));
    }
  }, [user, uploading]);

  // Вот этот useEffect синхронизирует newUsername с user.username
  useEffect(() => {
    setNewUsername(user?.username || '');
  }, [user?.username]);

  const getAvatarUrl = useCallback((avatar) => {
    if (!avatar) return null;
    return avatar.startsWith('http') ? avatar : `http://localhost:5000${avatar}`;
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setUploading(true);

    try {
      const res = await uploadAvatar(file);
      if (res.user?.avatar) {
        setAvatarPreview(getAvatarUrl(res.user.avatar));
      } else {
        setAvatarPreview(null);
      }
      updateUser(res.user);
    } catch (error) {
      console.error('Ошибка при загрузке аватара:', error);
      setAvatarPreview(getAvatarUrl(user?.avatar));
    } finally {
      setUploading(false);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleUsernameClick = () => {
    setEditing(true);
    setNewUsername(user.username);
  };

  const handleUsernameChange = (e) => {
    setNewUsername(e.target.value);
  };

  const saveUsername = async () => {
    if (!newUsername.trim() || newUsername === user.username) {
      setEditing(false);
      return;
    }

    try {
      const res = await axios.put(
        'http://localhost:5000/api/user/update',
        { username: newUsername },
        { withCredentials: true }
      );

      if (res.data.user) {
        updateUser(res.data.user); // обновляем полный user
      }
    } catch (error) {
      console.error('Ошибка при обновлении ника:', error);
    } finally {
      setEditing(false);
    }
  };

  const handleUsernameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveUsername();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setNewUsername(user.username);
    }
  };

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  if (loading) return <div>Загрузка...</div>;
  if (!user) return null;

  return (
    <div className={classes.profile}>
      <button className={classes.buttonLogout} onClick={handleLogout}>
        Выйти
      </button>
        <div className={classes.profileImage}>
          {avatarPreview ? (
            <img src={avatarPreview} alt="Аватар" onClick={handleAvatarClick}/>
          ) : null}
        </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        disabled={uploading}
        className={classes.avatarInput}
        id="avatarInput"
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      
        {editing ? (
          <input
            ref={inputRef}
            value={newUsername}
            onChange={handleUsernameChange}
            onBlur={saveUsername}
            onKeyDown={handleUsernameKeyDown}
            className={classes.usernameInput}
          />
            ) : (
            <p className={classes.usernames} onClick={handleUsernameClick}>
              #{user.username}
            </p>
            )}
      
        

      </div>
      
  );
};
