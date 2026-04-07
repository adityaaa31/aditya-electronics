import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Send, User, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { LOGO_URL } from '../constants';

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get('id');
  const { user } = useAuthStore();
  const [chats, setChats] = React.useState([]);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [selectedChat, setSelectedChat] = React.useState<any>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    
    api.get('/chats').then(res => {
      setChats(res.data);
      if (chatId) {
        const current = res.data.find((c: any) => c.id === parseInt(chatId));
        if (current) setSelectedChat(current);
      }
    });

    return () => { newSocket.close(); };
  }, [chatId]);

  React.useEffect(() => {
    if (selectedChat && socket) {
      socket.emit('join_chat', selectedChat.id);
      api.get(`/chats/${selectedChat.id}/messages`).then(res => setMessages(res.data));

      socket.on('new_message', (msg) => {
        setMessages(prev => [...prev, msg]);
      });

      return () => { socket.off('new_message'); };
    }
  }, [selectedChat, socket]);

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !socket || !user) return;

    socket.emit('send_message', {
      chatId: selectedChat.id,
      senderId: user.id,
      message: newMessage
    });
    setNewMessage('');
  };

  return (
    <div className="h-[calc(100vh-120px)] bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
            <MessageSquare className="text-red-600 dark:text-red-500" />
            Messages
          </h2>
        </div>
        <div className="flex-grow overflow-y-auto">
          {chats.map((chat: any) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b dark:border-gray-800 ${
                selectedChat?.id === chat.id ? 'bg-red-50 dark:bg-red-900/20 border-r-4 border-r-red-600 dark:border-r-red-500' : ''
              }`}
            >
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src={LOGO_URL} 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm truncate w-48 dark:text-white">{chat.product_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? chat.user_name : 'Admin'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col bg-white dark:bg-gray-900">
        {selectedChat ? (
          <>
            <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={LOGO_URL} 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="font-bold dark:text-white">{selectedChat.product_name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Chatting with {user?.role === 'admin' ? selectedChat.user_name : 'Admin'}</p>
                </div>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-950">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${
                      msg.sender_id === user?.id 
                        ? 'bg-red-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 rounded-tl-none'
                    }`}>
                      <p className="text-sm font-bold mb-1 opacity-70">{msg.sender_name}</p>
                      <p className="leading-relaxed">{msg.message}</p>
                      <p className="text-[10px] mt-2 opacity-50 text-right">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="flex-grow p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white"
                />
                <button 
                  type="submit"
                  className="bg-red-600 text-white p-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none"
                >
                  <Send size={24} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-950">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="text-xl font-medium">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
