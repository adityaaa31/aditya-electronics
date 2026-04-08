import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Mail, Lock, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { LOGO_URL } from '../constants';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    identifier: '',
    password: '',
    otp: ''
  });
  const [step, setStep] = React.useState(1); // 1: Info, 2: OTP (email only)
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const isEmail = formData.identifier.includes('@');

  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier || !formData.name || !formData.password) {
      return toast.error('Please fill all fields');
    }
    setLoading(true);
    try {
      if (isEmail) {
        // Email: request OTP first
        await api.post('/auth/request-otp', { identifier: formData.identifier });
        toast.success('OTP sent to your email!');
        setStep(2);
      } else {
        // Phone: register directly without OTP
        const res = await api.post('/auth/register', {
          name: formData.name,
          phone: formData.identifier,
          password: formData.password,
          otp: null
        });
        setAuth(res.data.user, res.data.token);
        toast.success('Account created successfully!');
        navigate('/');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: formData.name,
        email: formData.identifier,
        password: formData.password,
        otp: formData.otp
      });
      setAuth(res.data.user, res.data.token);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800 transition-colors duration-300"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200 dark:shadow-none overflow-hidden">
            <img
              src={LOGO_URL}
              alt="logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Join Aditya Electronics today</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmitStep1} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white"
                required
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Email or Phone Number"
                value={formData.identifier}
                onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {loading
                ? isEmail ? 'Sending OTP...' : 'Creating Account...'
                : isEmail ? 'Get OTP' : 'Create Account'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl mb-6 border border-red-100 dark:border-red-900/30">
              <p className="text-sm text-red-800 dark:text-red-400">
                We've sent a 6-digit verification code to your email:
                <strong className="block mt-1">{formData.identifier}</strong>
              </p>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={formData.otp}
                onChange={e => setFormData({ ...formData, otp: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {loading ? 'Verifying...' : 'Verify & Register'}
              {!loading && <CheckCircle size={20} />}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Change Details
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-red-600 dark:text-red-500 font-bold hover:underline">
            Login here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
