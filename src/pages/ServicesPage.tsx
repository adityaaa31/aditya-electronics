import React from 'react';
import { motion } from 'motion/react';
import { Wrench, ShieldCheck, MapPin } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const ServicesPage = () => {
  const [services, setServices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [bookingForm, setBookingForm] = React.useState({
    service_id: '',
    full_name: '',
    phone_number: '',
    email: '',
    address: '',
    locality: '',
    details: ''
  });

  React.useEffect(() => {
    api.get('/services').then(res => {
      setServices(Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(res.data) && res.data.length > 0) setBookingForm(prev => ({ ...prev, service_id: res.data[0].id }));
    }).finally(() => setLoading(false));

  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/bookings', bookingForm);
      toast.success('Service booked successfully! We will contact you soon.');
      setBookingForm(prev => ({
        service_id: prev.service_id,
        full_name: '',
        phone_number: '',
        email: '',
        address: '',
        locality: '',
        details: ''
      }));
    } catch (e: any) {
      const msg = e.response?.data?.error;
      toast.error(typeof msg === 'string' ? msg : 'Failed to book service');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Professional Repair Services</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            From screen replacements to complex motherboard repairs, our experts handle it all with precision and care.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service: any) => (
                <motion.div 
                  key={service.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden group transition-colors duration-300"
                >
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                    <img 
                      src={service.image_url || 'https://picsum.photos/seed/repair/600/400'} 
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-xl flex items-center justify-center shadow-sm">
                      <Wrench className="text-red-600 dark:text-red-500" size={20} />
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-xl font-bold mb-2 dark:text-white">{service.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">{service.description}</p>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-sm font-bold mb-4">
                      <ShieldCheck size={16} />
                      {service.warranty || 'No Warranty'}
                    </div>
                    <p className="text-red-600 dark:text-red-500 font-bold text-2xl">Starting ₹{service.price}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-red-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Need Urgent Repair?</h3>
                <p className="text-red-100">Call our emergency support line for immediate assistance in Sitamarhi.</p>
              </div>
              <a href="tel:9931003122" className="bg-white text-red-600 px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all">
                Call 9931003122
              </a>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 h-fit sticky top-24 transition-colors duration-300">
            <h3 className="text-2xl font-bold mb-6 dark:text-white">Book Home Service</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Service</label>
                <select 
                  value={bookingForm.service_id}
                  onChange={e => setBookingForm({...bookingForm, service_id: e.target.value})}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                  required
                >
                  {services.map((s: any) => <option key={s.id} value={s.id} className="dark:bg-gray-900">{s.name}</option>)}
                </select>
              </div>
              <input 
                type="text" placeholder="Full Name" 
                value={bookingForm.full_name} onChange={e => setBookingForm({...bookingForm, full_name: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" required 
              />
              <input 
                type="tel" placeholder="Phone Number" 
                value={bookingForm.phone_number} onChange={e => setBookingForm({...bookingForm, phone_number: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" required 
              />
              <input 
                type="email" placeholder="Email Address" 
                value={bookingForm.email} onChange={e => setBookingForm({...bookingForm, email: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
              />
              <input 
                type="text" placeholder="Address" 
                value={bookingForm.address} onChange={e => setBookingForm({...bookingForm, address: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
              />
              <input 
                type="text" placeholder="Locality" 
                value={bookingForm.locality} onChange={e => setBookingForm({...bookingForm, locality: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" required 
              />
              <textarea 
                placeholder="Problem Description" 
                value={bookingForm.details} onChange={e => setBookingForm({...bookingForm, details: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 h-24 dark:text-white" required
              />
              <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none">
                Submit Booking
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
