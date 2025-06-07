import {useCallback, useMemo, useState, useEffect, useRef, useLayoutEffect} from 'react'
import classes from './chatBody.module.css'
import { useChatSocket } from '../../../../context/useChatSocket';
import axios from 'axios';

import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const ChatBody = ({chatId, setMessages, messages, setEditingMessageId, setMessage, errorMessage, setErrorMessage, setPartner, user, logout}) => {
    const [loading, setLoading] = useState(true);
    

    const onDeleteMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(msg => msg.messageId !== messageId));
  }, []);

    const {deleteMessage} = useChatSocket(chatId, user, {
        onDeleteMessage,
      });

    const handleContextMenu = (e, messageId) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY, messageId });
      };

    const handleEditMessage = (messageId) => {
    const msg = messages.find(m => m.messageId === messageId);
    if (msg) {
      setEditingMessageId(messageId);
      setMessage(msg.text);
      setContextMenu(null);
    }
  };

    const handleDeleteMessage = (messageId) => {
    deleteMessage(chatId, messageId);
    setContextMenu(null);
  };

  const [contextMenu, setContextMenu] = useState(null);
  const { markAsRead } = useChatSocket(chatId, user, {});

  const [lastReadMessageId, setLastReadMessageId] = useState(null);

  useEffect(() => {
    if (!contextMenu) return;

    const closeMenu = () => setContextMenu(null);
    document.addEventListener('click', closeMenu);

    return () => document.removeEventListener('click', closeMenu);
  }, [contextMenu]);


  useEffect(() => {
    if (!user?.id || !chatId || !messages.length) return;
  
    const lastPartnerMessage = [...messages].reverse().find(msg => msg.senderId !== user.id);
    if (!lastPartnerMessage) return;
  
    const lastMsgId = lastPartnerMessage.messageId;
  
    if (lastMsgId !== lastReadMessageId) {
      markAsRead(chatId, lastMsgId)
        .then(() => {
          setLastReadMessageId(lastMsgId);
          setMessages(prev =>
            prev.map(msg =>
              msg.senderId === user.id &&
              new Date(msg.createdAt) <= new Date(lastPartnerMessage.createdAt)
                ? { ...msg, readByPartner: true }
                : msg
            )
          );
        })
        .catch(console.error);
    }
  }, [chatId, messages, lastReadMessageId, markAsRead, user?.id]);

  
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
  if (!user?.id) return;

  let isMounted = true;
  setLoading(true);
  setErrorMessage(null);

  
    

  const fetchData = async () => {
    try {
      const [messagesRes, partnerRes] = await Promise.all([
        axios.get(`/api/messages/${chatId}`, { withCredentials: true }),
        axios.get(`/api/chats/${chatId}/info`, { withCredentials: true }),
      ]);

      if (!isMounted) return;

      const loadedMessages = messagesRes.data.messages;
      setPartner(partnerRes.data.partner);

      // Определяем последнее сообщение партнёра
      const lastPartnerMessage = [...loadedMessages].reverse().find(msg => msg.senderId !== user.id);

      // Локально отмечаем прочитанные сообщения
      let updatedMessages = loadedMessages;
      if (lastPartnerMessage) {
        updatedMessages = loadedMessages.map(msg =>
          msg.senderId === user.id &&
          new Date(msg.createdAt).getTime() <= new Date(lastPartnerMessage.createdAt).getTime()
            ? { ...msg, readByPartner: true }
            : msg
        );

        // Отправляем на сервер отметку о прочтении
        await markAsRead(chatId, lastPartnerMessage.messageId);

        setLastReadMessageId(lastPartnerMessage.messageId);
      }

      setMessages(updatedMessages);

    } catch (err) {
      if (!isMounted) return;
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setErrorMessage('Не удалось загрузить данные');
      }
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  fetchData();
  return () => {
    isMounted = false;
  };
}, [chatId, user?.id, logout, navigate, markAsRead]);

  const renderedMessages = useMemo(() => messages.map(msg => {
      const isMine = msg.senderId === user?.id;
      return (
        <div
          key={msg.messageId}
          className={`${classes.messageBubble} ${isMine ? classes.myMessage : classes.theirMessage}`}
          onContextMenu={isMine ? (e) => handleContextMenu(e, msg.messageId) : undefined}
          title={msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
        >
          <div className={classes.msges}>
  <span>{msg.text}</span>
  <div className={classes.perf}>
    <span className={classes.messageTime}>{formatTime(msg.createdAt)}</span>
    {isMine && (
      <span className={classes.readReceipt}>{msg.readByPartner ? '✓✓' : '✓'}</span>
    )}
  </div>
</div>
          
        </div>
      );
    }), [messages, user?.id]);
  if (!user) return <p>Загрузка пользователя... Пожалуйста, войдите.</p>;
  return (
    <div className={classes.chatBody}>
                {loading ? (
              <p style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</p>
            ) : (
              <div className={classes.messagesList}>
                {renderedMessages}
                <div ref={messagesEndRef} />
              </div>
            )}

            {contextMenu &&
  createPortal(
    <div
      className={classes.contextMenu}
      style={{ top: contextMenu.y, left: contextMenu.x, position: 'absolute', zIndex: 1000 }}
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={() => handleDeleteMessage(contextMenu.messageId)}>Удалить</button>
      <button onClick={() => handleEditMessage(contextMenu.messageId)}>Редактировать</button>
    </div>,
    document.body
  )
}


            
            {errorMessage && <p className={classes.errorMessage}>{errorMessage}</p>}
          </div>
  )
}
