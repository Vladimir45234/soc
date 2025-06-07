import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Navbar from '../../components/Navbar/Navbar';
import classes from './search.module.css';

const fetchUsers = () =>
  axios
    .get('http://localhost:5000/api/users/all', { withCredentials: true })
    .then(res => res.data.users);

export default function Search() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const socket = useSocket();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: !!user,
  });

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter(
      u =>
        u.id !== user?.id &&
        (`${u.username} `.toLowerCase().includes(term))
    );
  }, [users, searchTerm, user]);

  const handleCreateChat = async (otherUserId) => {
    if (!user?.id) return console.error('Пользователь не авторизован');

    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/chats/create',
        { user1_id: user.id, user2_id: otherUserId },
        { withCredentials: true }
      );

      const chat = data.chat;

      socket?.emit('chat-created', {
        chat,
        to: otherUserId,
      });

      await queryClient.invalidateQueries(['my-chats']);

      navigate(`/chat/${chat.id}`);
    } catch (err) {
      console.error('Ошибка при создании чата:', err);
    }
  };

  const closeModal = () => setSelectedUser(null);

  if (authLoading || isLoading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка при загрузке пользователей.</p>;

  return (
    <div className={classes.search}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isFocused ? '' : 'Пользователи'}
      />

        <div className={classes.chats}>
            {filteredUsers.length === 0 ? (
              <p className={classes.users}>Пользователи не найдены.</p>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.id} className={classes.chat} onClick={() => setSelectedUser(u)}>
                  <h2>{u.username}</h2>
                  <button onClick={() => handleCreateChat(u.id)}>Создать</button>
                </div>
              ))
            )}
          </div>
            
      

      {selectedUser && (
        <div className={classes.modalOverlay} onClick={closeModal}>
          <div className={classes.modal} onClick={(e) => e.stopPropagation()}>
            <button className={classes.closeButton} onClick={closeModal}>×</button>
            <div className={classes.use}>{selectedUser.username}</div>
            <div className={classes.avatarka}>
              <img
                src={`http://localhost:5000${selectedUser.avatar}`}
                alt="Avatar"
                className={classes.avatar}
              />
            </div>
            

            {/* Можете добавить другую информацию здесь */}
          </div>
        </div>
      )}
    </div>
        
  );
}
