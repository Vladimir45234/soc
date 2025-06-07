import React, { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueries } from '@tanstack/react-query';
import axios from 'axios';
import classes from './chats.module.css';
import { socket } from '../../socket';
import getTimeAgo from '../Chat/components/ChatHeader/ChatHeader'


function normalizeChat(chat) {
  return {
    ...chat,
    lastMessage: chat.lastMessage ?? chat.last_message ?? '', // текст последнего сообщения
    lastMessageTime: chat.lastMessageTime ?? chat.last_message_time ?? null,
    lastMessageUserId: chat.lastMessageUserId ?? chat.last_message_user_id ?? null, // <- обрати внимание здесь! Добавил last_message_user_id
    unreadCount: typeof chat.unreadCount === 'number' ? chat.unreadCount : 0,
  };
}


const fetchChats = async () => {
   const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/chats/my-chats`, {
    withCredentials: true,
  });
  return data.chats.map(normalizeChat);
};

const fetchPartnerInfo = async (chatId) => {
  try {
    const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}/info`, {
      withCredentials: true,
    });
    return data.partner;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};


function ContextMenu({ x, y, onClose, onDelete }) {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className={classes.contextMenu}
      style={{ top: y, left: x, position: 'absolute', zIndex: 1000 }}
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={onDelete}>Удалить</button>
    </div>,
    document.body
  );
}


export default function Chats() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [searchChatTerm, setSearchChatTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, chatId: null });

  const {
    data: chats,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['my-chats'],
    queryFn: fetchChats,
    enabled: !!user,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: true,
  });

  // Переход на логин если неавторизован
  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  // Сокет: обновлять список чатов при создании
  useEffect(() => {
    if (!user) return;

    socket.on('chat-created', () => refetch());

    return () => socket.off('chat-created');
  }, [user, refetch]);

  // Сокет: обновлять список чатов при новых сообщениях или обновлениях
  useEffect(() => {
    if (!user) return;

    const handleNewMessage = () => refetch();
    const handleChatUpdated = () => refetch();

    socket.on('receiveMessage', handleNewMessage);
    socket.on('updateLastMessage', handleChatUpdated);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
      socket.off('updateLastMessage', handleChatUpdated);
    };
  }, [user, refetch]);

  // Получить партнеров по чатам
  const partnerQueries = useQueries({
    queries:
      chats?.map((chat) => ({
        queryKey: ['partner', chat.id],
        queryFn: () => fetchPartnerInfo(chat.id),
        enabled: !!chat,
        staleTime: 0,
        cacheTime: 0,
        refetchOnWindowFocus: true,
      })) || [],
  });

  const chatsWithPartner = useMemo(() => {
    if (!chats) return [];
    if (partnerQueries.some((q) => q.isLoading)) return [];
    return chats.map((chat, i) => ({ ...chat, partner: partnerQueries[i]?.data ?? null }));
  }, [chats, partnerQueries]);

  const filteredChats = useMemo(() => {
    const term = searchChatTerm.toLowerCase();
    return chatsWithPartner.filter(({ partner }) => {
      const name = `${partner?.username || ''}`.toLowerCase();
      return name.includes(term);
    });
  }, [chatsWithPartner, searchChatTerm]);

  // Метка прочитанности
  const markChatAsRead = (chatId) => {
    socket.emit('markAsRead', { chatId });
    refetch();
  };

  const handleChatClick = (chatId) => markChatAsRead(chatId);

  const handleCloseContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, chatId: null });

  const deleteChat = async (chatId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, { withCredentials: true });
      handleCloseContextMenu();
      // Обновить список чатов после удаления
      refetch();
    } catch (err) {
      console.error('Ошибка при удалении чата:', err);
    }
  };

  if (authLoading || isLoading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка загрузки чатов.</p>;

  return (
      <div className={classes.chats}>
        <input
          placeholder={isFocused ? '' : 'Чаты'}
          type="text"
          value={searchChatTerm}
          onChange={(e) => setSearchChatTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

          <div className={classes.allChats}>
            {filteredChats.length === 0 ? (
                <p className={classes.none}>Чаты не найдены.</p>
            ) : (
              filteredChats.map((chat) => (
                
                  <Link
                  
                    to={`/chat/${chat.id}`}
                    key={chat.id}
                    className={classes.chat}
                    onClick={() => handleChatClick(chat.id)}
                  >
                    <div className={classes.chatAvatar}>
                      {chat.partner.avatar && (
                        
                        <div className={classes.avatarWrapper}>
                          
                          <img
                            src={`${import.meta.env.VITE_API_URL}${chat.partner.avatar}`}
                            alt="Avatar"
                            className={classes.avatarImage}
                          />
                          {Number(chat.partner?.is_online) === 1 && !chat.partner.blockedByPartner && <span className={classes.onlineCircle}/>}
                      </div>
                      
                      )}
                      
                      
                  
                    </div>     
                    
                    <div className={classes.partner}>
                                    <p className={classes.partnerFname}>{chat.partner.username}</p>
                                    {chat.partner.blockedByPartner ? (
                                      <span className={classes.blockedStatus}>Был(а) давно</span>
                                        ) : Number(chat.partner.is_online) === 1 ? (
                                          <span className={classes.st}>В сети</span>
                                        ) : chat.partner.last_seen ? (
                                          <span className={classes.lastSeen}>Был(а) в сети: {getTimeAgo(chat.partner.last_seen)}</span>
                                        ) : null}
                                  </div>
                      <img 
                        className={classes.more}
                        src='/images/Group 58.svg'
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setContextMenu({
                            visible: true,
                            x: e.pageX,
                            y: e.pageY,
                            chatId: chat.id
                          });
                        }}
                      />
                      {chat.unreadCount > 0 && (
                      <span className={classes.unreadCount}>{chat.unreadCount}</span>
                    )}
                </Link>
              ))
            )}
          </div>

          {contextMenu.visible && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={handleCloseContextMenu}
              onDelete={() => deleteChat(contextMenu.chatId)}
            />
          )}
        </div>
  );
};