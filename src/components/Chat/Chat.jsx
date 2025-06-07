import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import classes from './chat.module.css';
import { ChatHeader } from './components/ChatHeader/ChatHeader';
import { ChatBody } from './components/ChatBody/ChatBody';
import { useAuth } from '../../context/AuthContext';
import { ChatFooter } from './components/ChatFooter/ChatFooter';

export default function Chat() {
  const { user, logout } = useAuth();
  const { chatId } = useParams();
  
  const [messages, setMessages] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [partner, setPartner] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [message, setMessage] = useState('');

  // Скролл вниз при обновлении сообщений
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => [...prev]); // перерендер для обновления времени
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={classes.chat}>
      {partner && (
        <ChatHeader partner={partner} setPartner={setPartner} />
      )}
      <ChatBody
        chatId={chatId}
        setMessages={setMessages}
        messages={messages}
        user={user}
        logout={logout}
        setEditingMessageId={setEditingMessageId}
        setMessage={setMessage}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
        partner={partner}
        setPartner={setPartner}
      />
      <ChatFooter
        chatId={chatId}
        user={user}
        messages={messages}
        setMessages={setMessages}
        message={message}
        setMessage={setMessage}
        editingMessageId={editingMessageId}
        setEditingMessageId={setEditingMessageId}
      />
    </div>
  );
}