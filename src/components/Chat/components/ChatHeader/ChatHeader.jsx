import {useRef, useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom';
import classes from './header.module.css'
import axios from 'axios';
import { createPortal } from 'react-dom';

export default function getTimeAgo(dateString) {
  const now = Date.now();
  const past = new Date(dateString).getTime();
  if (isNaN(past)) return '';

  const seconds = Math.floor((now - past) / 1000);
  if (seconds < 60) return `${seconds} сек. назад`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн. назад`;
}

export const ChatHeader = ({partner, setPartner}) => {
  
    const headerBtnRef = useRef(null);
    const [headerMenu, setHeaderMenu] = useState(null);
      // Функция открытия/закрытия меню в шапке
      const toggleHeaderMenu = () => {
        if (headerMenu) {
          setHeaderMenu(null);
        } else if (headerBtnRef.current) {
          const rect = headerBtnRef.current.getBoundingClientRect();
          setHeaderMenu({
            x: rect.left,
            y: rect.bottom + window.scrollY, // чуть ниже кнопки
          });
        }
      };
    const navigate = useNavigate();

    useEffect(() => {
    if (!headerMenu) return;
    const closeMenu = () => setHeaderMenu(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [headerMenu]);

  const unblockUser = async (userId) => {
    try {
      const response = await axios.post('/api/users/unblock', 
        { userId }, 
        { withCredentials: true }
      );
      if (response.status === 200) {
        alert('Пользователь успешно разблокирован');
        setPartner(prev => ({ ...prev, blockedByMe: false }));
      } else {
        alert('Не удалось разблокировать пользователя');
      }
    } catch (error) {
      alert('Ошибка при разблокировке пользователя');
      console.error(error);
    }
  };

  const blockUser = async (userId) => {
    try {
      const response = await axios.post('/api/users/block', 
        { userId }, 
        { withCredentials: true }
      );
      if (response.status === 200) {
        alert('Пользователь успешно заблокирован');
        setPartner(prev => ({ ...prev, blockedByMe: true }));
        navigate('/chats'); // Можно убрать, если не нужно сразу выходить
      } else {
        alert('Не удалось заблокировать пользователя');
      }
    } catch (error) {
      alert('Ошибка при блокировке пользователя');
      console.error(error);
    }
  };

  const handleHeaderMenuOption = (option) => {
    if (option === 'block') {
      if (!partner) {
        alert('Партнер не загружен');
        return;
      }
      if (partner.blockedByMe) {
        unblockUser(partner.id);
      } else {
        blockUser(partner.id);
      }
    } else {
      alert(`Вы выбрали: ${option}`);
    }
    setHeaderMenu(null);
  };
  if (!partner) return null;
  return (
    <div className={classes.chatHeader}>
              <img
                src="/images/Group 57(1).svg"
                className={classes.arrow}
                onClick={() => navigate('/chats')}
                alt="Back"
              />
              <div className={classes.avatarWrapper}>
                {partner.avatar && (
                  <img
                    src={`http://localhost:5000${partner.avatar}`}
                    alt="Avatar"
                    className={classes.avatar}
                  />
                )}
                {Number(partner?.is_online) === 1 && !partner.blockedByPartner && <span className={classes.onlineCircle}/>}

              </div>
              <div className={classes.partner}>
                <p className={classes.partnerFname}>{partner.username}</p>
                {partner.blockedByPartner ? (
                  <span className={classes.blockedStatus}>Был(а) давно</span>
                    ) : Number(partner.is_online) === 1 ? (
                      <span className={classes.st}>В сети</span>
                    ) : partner.last_seen ? (
                      <span className={classes.lastSeen}>Был(а) в сети: {getTimeAgo(partner.last_seen)}</span>
                    ) : null}
              </div>
                  <img src='/images/Group 58.svg' alt="Menu" className={classes.more}
                  ref={headerBtnRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleHeaderMenu();
                  }}/>  
                  {headerMenu && (
                    createPortal(
                      <div
                        className={classes.contextMenu}
                        style={{ top: headerMenu.y, left: headerMenu.x, position: 'absolute', zIndex: 1000 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={() => handleHeaderMenuOption('block')}>
                          {partner?.blockedByMe ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                        {/* Другие опции меню */}
                      </div>,
                      document.body
                    )
                  )}      
    </div>
    
  )
}
