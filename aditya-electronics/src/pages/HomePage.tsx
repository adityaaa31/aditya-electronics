import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Wrench, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { LOGO_URL } from '../constants';

const HomePage = () => {
  const [products, setProducts] = React.useState([]);

  React.useEffect(() => {
    api.get('/products').then(res => setProducts(Array.isArray(res.data) ? res.data.slice(0, 4) : []));
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/herosection.png"
            alt="Switched off LCD TV"
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Expert <span className="text-red-600">LED/LCD</span> <br />
              Repair Solutions
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed">
              Premium spare parts, professional LCD, LED and Screen repairs, and home services in Sitamarhi. 
              We bring your electronics back to life.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/products" 
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 group"
              >
                Explore Parts
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/services" 
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-xl font-bold text-lg transition-all"
              >
                Book a Service
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Animated Floating Remote */}
        <div className="absolute right-[5%] top-1/2 -translate-y-1/2 hidden lg:block w-1/4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: -5 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative"
          >
            <motion.img
              animate={{ y: [0, -20, 0], rotate: [-5, 0, -5] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              src="https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400"
              alt="TV Remote Control"
              className="rounded-3xl shadow-2xl border border-white/10 backdrop-blur-sm bg-white/5 p-4"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to another remote image
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1595935736128-db1f0a261263?auto=format&fit=crop&q=80&w=1000';
              }}
            />
            <div className="absolute -inset-4 bg-red-600/20 blur-3xl -z-10 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: null, title: "Genuine Parts", desc: "Original motherboards & backlights", isLogo: true },
              { icon: Wrench, title: "Expert Repair", desc: "Certified technician for all brands" },
              { icon: ShieldCheck, title: "Warranty", desc: "Guaranteed service satisfaction" },
              { icon: Zap, title: "Fast Service", desc: "Quick turnaround for all repairs" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group border border-transparent dark:border-gray-700"
              >
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-600 transition-colors overflow-hidden">
                  {feature.isLogo ? (
                    <img 
                      src={LOGO_URL} 
                      alt="Logo" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    feature.icon && <feature.icon className="text-red-600 dark:text-red-500 group-hover:text-white transition-colors" size={28} />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="relative">
                <img 
                  src="/work.png" 
                  alt="Technician repairing TV motherboard" 
                  className="rounded-3xl shadow-2xl relative z-10"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-red-600 rounded-3xl -z-0" />
              </div>
            </div>
            <div className="lg:w-1/2">
              <span className="text-red-600 dark:text-red-500 font-bold tracking-widest uppercase mb-4 block">About Us</span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900 dark:text-white">Leading LCD, LED Electronics Store in Sitamarhi</h2>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg mb-8 leading-relaxed">
                Aditya Electronics has been serving the Sitamarhi electronics community for over a decade. 
                We specialize in high-end LED/LCD TV repairs, providing genuine spare parts including 
                motherboards, backlights, and universal remotes.
              </p>
              <div className="space-y-4">
                {['10+ Years Experience', '5000+ Happy Customers', 'Genuine Spare Parts', 'Doorstep Service'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-600 dark:bg-red-500 rounded-full" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Preview */}
      <section className="py-24 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-4 dark:text-white">Featured Products</h2>
              <p className="text-gray-600 dark:text-gray-400">High-quality spare parts for your electronics</p>
            </div>
            <Link to="/products" className="text-red-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
              View All <ArrowRight size={20} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product: any) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -10 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden group transition-colors duration-300"
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                  <img 
                    src={product.main_image || 'https://via.placeholder.com/400'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-red-600 dark:text-red-500">
                    {product.category_name}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors dark:text-white">{product.name}</h3>
                  <p className="text-red-600 dark:text-red-500 font-bold text-xl">₹{product.price}</p>
                  <Link 
                    to={`/products/${product.id}`}
                    className="mt-4 w-full block text-center py-2 rounded-lg border border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 font-medium hover:bg-red-600 dark:hover:bg-red-600 hover:text-white transition-all"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
