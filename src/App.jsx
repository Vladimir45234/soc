import { Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/Register/RegisterPage';
import LoginPage from './pages/Login/LoginPage';
import ProfilePage from './pages/Profile/ProfilePage';
import ChatPage from './pages/Chat/ChatPage';
import ChatsPage from './pages/Chats/ChatsPage';
import SearchPage from './pages/Search/SearchPage';

export default function App() {
  return (
    <Routes>
      <Route path='/' element={<RegisterPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/profile' element={<ProfilePage />} />
      <Route path='/chat/:chatId' element={<ChatPage />} />
      <Route path='/chats' element={<ChatsPage />} />
      <Route path='/search' element={<SearchPage />} />
    </Routes>
  );
}




