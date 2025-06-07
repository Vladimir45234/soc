import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  // Создаем/подключаем сокет, только если он еще не создан
  const connectSocket = useCallback(() => {
    if (socketRef.current) return;

    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      newSocket.emit('user_connected');
    });

    socketRef.current = newSocket;
  }, []);

  // Отключаем сокет
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('user_disconnected');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // Проверка авторизации при загрузке
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/user/profile', {
          withCredentials: true,
        });

        if (isMounted && res.data.user) {
          setUser(res.data.user);
          connectSocket();
        } else {
          setUser(null);
        }
      } catch (err) {
        if (isMounted) setUser(null);
        console.error('Ошибка проверки авторизации:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
      disconnectSocket();
    };
  }, [connectSocket, disconnectSocket]);

  // Логин — просто устанавливаем пользователя и подключаем сокет
  const login = useCallback((userData) => {
    setUser(userData);
    connectSocket();
  }, [connectSocket]);

  // Логаут — отключаем сокет, делаем запрос выхода и сбрасываем user
  const logout = useCallback(async () => {
    try {
      disconnectSocket();
      await axios.post('http://localhost:5000/api/logout', {}, { withCredentials: true });
      setUser(null);
    } catch (error) {
      console.error('Ошибка при выходе из аккаунта:', error);
    }
  }, [disconnectSocket]);

  // Обновление данных пользователя
  const updateUser = useCallback((newUserData) => {
  // Для гарантии создаём новый объект
  setUser({ ...newUserData });
}, []);


  // Загрузка аватара
  const uploadAvatar = useCallback(
    async (file) => {
      try {
        const formData = new FormData();
        formData.append('avatar', file);

        const res = await axios.post('http://localhost:5000/api/user/upload-avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });

        if (res.data.user) {
          setUser(res.data.user);
          socketRef.current?.emit('avatarUpdated', {
            avatarUrl: res.data.user.avatar,
          });
        }

        return res.data;
      } catch (error) {
        console.error('Ошибка загрузки аватара:', error);
        throw error;
      }
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        uploadAvatar,
        updateUser,
        socket: socketRef.current,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
