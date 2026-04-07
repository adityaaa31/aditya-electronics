import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { 
  Home, 
  Tv, 
  Wrench, 
  MessageSquare, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Phone, 
  MapPin,
  LayoutDashboard,
  ShoppingBag,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { LOGO_URL } from './constants';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ServicesPage from './pages/ServicesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import ChatPage from './pages/ChatPage';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (pathname.startsWith('/admin')) return null;

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Products', path: '/products', icon: ShoppingBag },
    { name: 'Services', path: '/services', icon: Wrench },
    { name: 'Address', path: 'https://share.google/bsFViLkvYOpMhGCcm', icon: MapPin, isExternal: true },
  ];

  if (user) {
    navLinks.push({ name: 'My Chats', path: '/chats', icon: MessageSquare });
    if (user.role === 'admin') {
      navLinks.push({ name: 'Admin', path: '/admin', icon: LayoutDashboard });
    }
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-800/50 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 xl:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src={LOGO_URL} 
                  alt="Aditya Electronics Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[13px] xs:text-sm sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                ADITYA <span className="text-red-600">ELECTRONICS</span>
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-8">
            <button
              onClick={() => {
                console.log('Theme toggle button clicked');
                toggleTheme();
              }}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            {(Array.isArray(navLinks) ? navLinks : []).map((link) => (
              link.isExternal ? (
                <a
                  key={link.name}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 font-medium transition-colors flex items-center gap-2"
                >
                  <link.icon size={18} />
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 font-medium transition-colors flex items-center gap-2"
                >
                  <link.icon size={18} />
                  {link.name}
                </Link>
              )
            ))}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">Hi, {user.name}</span>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <User size={18} />
                Login
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => {
                console.log('Mobile theme toggle clicked');
                toggleTheme();
              }}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 transition-colors"
            >
              {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 dark:text-gray-300 hover:text-red-600 focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800 transition-colors duration-300"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {(Array.isArray(navLinks) ? navLinks : []).map((link) => (
                link.isExternal ? (
                  <a
                    key={link.name}
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-4 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-500 rounded-lg font-medium flex items-center gap-3"
                  >
                    <link.icon size={20} />
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-4 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-500 rounded-lg font-medium flex items-center gap-3"
                  >
                    <link.icon size={20} />
                    {link.name}
                  </Link>
                )
              ))}
              {user ? (
                <button
                  onClick={() => { logout(); setIsOpen(false); navigate('/'); }}
                  className="w-full text-left px-3 py-4 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-500 rounded-lg font-medium flex items-center gap-3"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-4 text-red-600 dark:text-red-500 font-bold flex items-center gap-3"
                >
                  <User size={20} />
                  Login / Register
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-600 rounded-lg overflow-hidden">
              <img 
                src={LOGO_URL} 
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="text-2xl font-bold">ADITYA <span className="text-red-500">ELECTRONICS</span></h3>
          </div>
          <p className="text-gray-400 leading-relaxed">
            Your trusted partner for LED/LCD repairs and premium electronic components in Sitamarhi. 
            Quality service since 2010.
          </p>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
          <ul className="space-y-4 text-gray-400">
            <li><Link to="/" className="hover:text-red-500 transition-colors">Home</Link></li>
            <li><Link to="/products" className="hover:text-red-500 transition-colors">Products</Link></li>
            <li><Link to="/services" className="hover:text-red-500 transition-colors">Services</Link></li>
            <li><Link to="/login" className="hover:text-red-500 transition-colors">Admin Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-6">Contact Us</h4>
          <ul className="space-y-4 text-gray-400">
            <li className="flex items-start gap-3">
              <MapPin className="text-red-500 shrink-0" size={20} />
              <span>Ganpati Market, Bata Chowk, Sitamarhi, Bihar, 843302</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="text-red-500 shrink-0" size={20} />
              <span>+91 9931003122, 9504144447</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Aditya Electronics. All rights reserved.</p>
      </div>
    </div>
  </footer>
  );
};

const AppContent = () => {
  const { pathname } = useLocation();
  const { theme } = useThemeStore();
  const isAdmin = pathname.startsWith('/admin');

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);


  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      {!isAdmin && (
        <div className="bg-red-600 text-white py-2 overflow-hidden relative">
          <motion.div 
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="text-xs sm:text-sm font-medium whitespace-nowrap inline-block"
          >
            Aditya Electronics - Address: Ganpati Market, Bata Chowk, Sitamarhi, Bihar, 843302 | Contact: 9931003122, 9504144447
          </motion.div>
        </div>
      )}
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/chats" element={<ChatPage />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </main>
      <Footer />
      <Toaster position="bottom-right" toastOptions={{
        className: theme === 'dark' ? 'bg-gray-800 text-white border border-gray-700' : '',
      }} />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
