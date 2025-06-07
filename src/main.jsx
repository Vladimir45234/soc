import { createRoot } from 'react-dom/client';
import { BrowserRouter as Routers } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext'; // ✅ Импортируем
import App from './App';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider> 
        <Routers>
          <App />
        </Routers>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);
