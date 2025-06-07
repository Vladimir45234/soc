// hooks/useChatSocket.js
import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

export function useChatSocket(chatId, user, {
  onNewMessage,
  onDeleteMessage,
  onUpdateMessage,
  onMessagesRead,
  onChatReadByPartner, // 🔹 новый колбэк
  onError,
}) {
  const socket = useSocket();

  useEffect(() => {
    if (!chatId || !user?.id || !socket) return;

    const handlers = {
      receiveMessage: (data) => onNewMessage?.(data),
      deleteMessage: ({ messageId }) => onDeleteMessage?.(messageId),
      updateMessage: ({ messageId, text }) => onUpdateMessage?.({ messageId, text }),
      messagesRead: (data) => onMessagesRead?.(data),
      unreadCountUpdated: ({ chatId: updatedChatId, unreadCount }) => {
        // Колбэк можно добавить при необходимости
      },
      chatReadByPartner: ({ chatId, readerId, lastReadMessageId }) => {
        onChatReadByPartner?.({ chatId, readerId, lastReadMessageId });
      },
    };

    socket.emit('joinRoom', chatId);

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      socket.emit('leaveRoom', chatId);
    };
  }, [
    chatId,
    user?.id,
    socket,
    onNewMessage,
    onDeleteMessage,
    onUpdateMessage,
    onMessagesRead,
    onChatReadByPartner, // 🔹 не забудь про зависимость
  ]);

  const emitWithAck = useCallback((event, payload, onSuccess) => {
    if (socket?.connected) {
      socket.emit(event, payload, (response) => {
        if (response?.success !== false) {
          onSuccess?.(response);
        } else {
          onError?.(response?.error || `Ошибка при выполнении события "${event}"`);
        }
      });
    } else {
      onError?.('Соединение с сервером отсутствует');
    }
  }, [socket, onError]);

  const sendMessage = useCallback((message, ackCallback) => {
    emitWithAck('sendMessage', message, ackCallback);
  }, [emitWithAck]);

  const deleteMessage = useCallback((chatId, messageId) => {
    emitWithAck('deleteMessage', { chatId, messageId });
  }, [emitWithAck]);

  const updateMessage = useCallback((chatId, messageId, text) => {
    emitWithAck('updateMessage', { chatId, messageId, text });
  }, [emitWithAck]);

  const markAsRead = useCallback((chatId, lastReadMessageId) => {
    return new Promise((resolve, reject) => {
      if (socket?.connected) {
        socket.emit('markChatRead', { chatId, lastReadMessageId }, () => {
          onMessagesRead?.({ chatId, lastReadMessageId });
          resolve();
        });
      } else {
        const errMsg = 'Соединение с сервером отсутствует';
        onError?.(errMsg);
        reject(new Error(errMsg));
      }
    });
  }, [socket, onMessagesRead, onError]);

  return {
    sendMessage,
    deleteMessage,
    updateMessage,
    markAsRead,
  };
}
