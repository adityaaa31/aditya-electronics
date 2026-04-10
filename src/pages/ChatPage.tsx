import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { LOGO_URL } from '../constants';

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get('id');
  const { user } = useAuthStore();
  const [chats, setChats] = React.useState<any[]>([]);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [selectedChat, setSelectedChat] = React.useState<any>(null);
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const pollRef = React.useRef<any>(null);

  // Load chats
  React.useEffect(() => {
    if (!user) return;
    api.get('/chats').then(res => {
      const list = Array.isArray(res.data) ? res.data : [];
      setChats(list);
      if (chatId) {
        const current = list.find((c: any) => c.id === parseInt(chatId));
        if (current) setSelectedChat(current);
      }
    }).catch(() => {});
  }, [chatId, user]);

  // Load messages + poll every 3s
  React.useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = () => {
      api.get(`/chats/${selectedChat.id}/messages`)
        .then(res => setMessages(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    };

    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [selectedChat]);

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user || sending) return;
    setSending(true);
    try {
      await api.post(`/chats/${selectedChat.id}/messages`, { message: newMessage });
      setNewMessage('');
      // immediately fetch new messages
      const res = await api.get(`/chats/${selectedChat.id}/messages`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch {
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex-col hidden md:flex">
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
                selectedChat?.id === chat.id ? 'bg-red-50 dark:bg-red-900/20 border-r-4 border-r-red-600' : ''
              }`}
            >
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
            <div className="p-4 border-b dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900 sticky top-0 z-10">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h3 className="font-bold dark:text-white">{selectedChat.product_name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role === 'admin' ? selectedChat.user_name : 'Admin'}
                </p>
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
                  className="flex-grow p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-red-600 text-white p-4 rounded-2xl hover:bg-red-700 transition-all disabled:opacity-50"
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
