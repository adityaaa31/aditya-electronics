import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MessageSquare, Phone, MapPin, ShieldCheck, ArrowLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [product, setProduct] = React.useState<any>(null);
  const [activeImage, setActiveImage] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => {
        setProduct(res.data);
        setActiveImage(res.data.images?.[0]?.image_url || 'https://via.placeholder.com/600');
      })
      .catch(() => {
        toast.error('Product not found');
        navigate('/products');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleChat = async () => {
    if (!user) {
      toast.error('Please login to chat with admin');
      navigate('/login');
      return;
    }
    try {
      const res = await api.post('/chats', { product_id: Number(id) });
      navigate(`/chats?id=${res.data.id}`);
    } catch (e) {
      toast.error('Failed to start chat');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>;
  if (!product) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Products
        </button>

        <div className="flex flex-col lg:flex-row gap-16">
          <div className="lg:w-1/2">
            <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-3xl overflow-hidden mb-6 border border-gray-100 dark:border-gray-800">
              <img src={activeImage} alt={product.name} className="w-full h-full object-contain p-8" referrerPolicy="no-referrer" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images?.map((img: any) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.image_url)}
                  className={`w-24 h-24 rounded-xl border-2 flex-shrink-0 overflow-hidden transition-all ${activeImage === img.image_url ? 'border-red-600' : 'border-transparent dark:border-gray-800'}`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="mb-8">
              <span className="text-red-600 dark:text-red-500 font-bold tracking-widest uppercase text-sm mb-2 block">{product.category_name}</span>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">{product.name}</h1>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-500">₹{product.price}</span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500 text-sm font-bold rounded-full">In Stock</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed mb-8">{product.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center gap-4 border border-transparent dark:border-gray-800">
                <ShieldCheck className="text-red-600 dark:text-red-500" size={24} />
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Warranty</p><p className="font-bold dark:text-white">{product.warranty || 'No Warranty'}</p></div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center gap-4 border border-transparent dark:border-gray-800">
                <MapPin className="text-red-600 dark:text-red-500" size={24} />
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Pickup</p><p className="font-bold dark:text-white">Sitamarhi Store</p></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleChat} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all flex items-center justify-center gap-3">
                <MessageSquare size={24} /> Chat with Expert
              </button>
              <a href="tel:9931003122" className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-3">
                <Phone size={24} /> Call Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
