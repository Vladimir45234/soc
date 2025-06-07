import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useChatSocket } from '../../../../context/useChatSocket'; // предположим, что хук отдельно
import classes from './ChatFooter.module.css'; // или твой CSS-модуль

export const ChatFooter = ({ user, chatId, setMessages, logout, message, setMessage, editingMessageId, setEditingMessageId }) => {
  const [isSending, setIsSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Если фокус НЕ в инпуте, переключаемся
      if (document.activeElement !== inputRef.current) {
        // Исключаем управляющие клавиши, чтобы не мешать (стрелки, ctrl, shift и т.п.)
        // Можно сделать фильтр на "печатаемые символы"
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // === socket handlers ===
  const onNewMessage = useCallback((data) => {
    setMessages(prev =>
      prev.some(m => m.messageId === data.messageId) ? prev : [...prev, data]
    );
  }, [setMessages]);

  const onUpdateMessage = useCallback(({ messageId, text }) => {
    setMessages(prev =>
      prev.map(msg => msg.messageId === messageId ? { ...msg, text } : msg)
    );
  }, [setMessages]);

  const onMessagesRead = useCallback(({ chatId: readChatId, readerId, lastReadMessageId }) => {
    if (!user?.id || readChatId !== chatId || readerId === user.id) return;

    setMessages(prev => {
      const lastReadMsg = prev.find(msg => msg.messageId === lastReadMessageId);
      if (!lastReadMsg) return prev;

      const lastReadTime = new Date(lastReadMsg.createdAt).getTime();
      return prev.map(msg =>
        new Date(msg.createdAt).getTime() <= lastReadTime
          ? { ...msg, readByPartner: true }
          : msg
      );
    });
  }, [chatId, user?.id, setMessages]);

  const onError = useCallback((msg) => {
    setErrorMessage(msg);
    if (msg.includes('401')) {
      logout();
      navigate('/login');
    }
  }, [logout, navigate]);

  const handleChatReadByPartner = useCallback(({ chatId: incomingChatId, lastReadMessageId, readerId }) => {
    if (incomingChatId !== chatId || readerId === user?.id) return;

    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.senderId === user.id && msg.messageId <= lastReadMessageId
          ? { ...msg, readByPartner: true }
          : msg
      )
    );
  }, [chatId, setMessages, user?.id]);

  const { sendMessage } = useChatSocket(chatId, user, {
    onNewMessage,
    onUpdateMessage,
    onMessagesRead,
    onChatReadByPartner: handleChatReadByPartner,
    onError,
  });

  // === handlers ===
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSending || !user) return;

    if (editingMessageId) {
      setIsSending(true);
      try {
        await axios.put(`/api/messages/${editingMessageId}`,
          { text: message }, { withCredentials: true });

        setMessages(prev =>
          prev.map(msg => msg.messageId === editingMessageId ? { ...msg, text: message } : msg)
        );
        setEditingMessageId(null);
        setMessage('');
      } catch {
        setErrorMessage('Не удалось обновить сообщение');
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Новое сообщение
    const messageId = uuidv4();
    const newMessage = {
      chatId,
      senderId: user.id,
      text: message.trim(),
      messageId,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsSending(true);

    try {
      await new Promise((resolve, reject) => {
        sendMessage(newMessage, (response) => {
          response.status === 'ok' ? resolve() : reject();
        });
      });
    } catch {
      setMessages(prev => prev.filter(msg => msg.messageId !== messageId));
      setErrorMessage('Не удалось отправить сообщение');
    } finally {
      setIsSending(false);
    }
  };

  // === render ===
  return (
    <div className={classes.chatFooter}>
        <input
        ref={inputRef}
        placeholder={isFocused ? '' : 'Сообщение'}
        className={classes.messages}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={isSending}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
        {editingMessageId && (
          <button type="button" onClick={handleCancelEdit} className={classes.cancelBtn}>
            ×
          </button>
        )}
        <button className={classes.sendBtn} type="submit" disabled={isSending} onClick={handleSubmit}>
          <img src="/images/Polygon 3(1).svg" alt="Send" />
        </button>
      {errorMessage && <div className={classes.error}>{errorMessage}</div>}
    </div>
  );
};
