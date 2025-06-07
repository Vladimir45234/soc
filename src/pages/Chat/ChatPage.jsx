import Chat from '../../components/Chat/Chat';
import ErrorBoundary from '../../context/ErrorBoundary';
import Navbar from '../../components/Navbar/Navbar';

export default function ChatPage() {
  
  return (
    <ErrorBoundary >
      <Chat />
      <Navbar />
    </ErrorBoundary>
    
  );
}
