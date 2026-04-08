import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { LOGO_URL } from '../constants';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { identifier, password });
      setAuth(res.data.user, res.data.token);
      toast.success('Welcome back!');
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800 transition-colors duration-300"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200 dark:shadow-none overflow-hidden">
            <img 
              src={LOGO_URL} 
              alt="Aditya Electronics Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Login to your Aditya Electronics account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Email or Phone Number"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login Now'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-red-600 dark:text-red-500 font-bold hover:underline">
            Register here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
