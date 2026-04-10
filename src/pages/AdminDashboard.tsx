import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Wrench, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle,
  BarChart3,
  List,
  Menu,
  X,
  Settings,
  Home
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { LOGO_URL } from '../constants';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col lg:flex-row transition-colors duration-300">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gray-900 dark:bg-black text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
            <Home size={20} />
          </Link>
          <div className="w-8 h-8 bg-red-600 rounded-lg overflow-hidden">
            <img 
              src={LOGO_URL} 
              alt="logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-xl font-bold">Admin</h2>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-800 rounded-lg">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-0 z-[60] lg:relative lg:z-auto
        w-64 bg-gray-900 dark:bg-gray-900 text-white flex flex-col
        transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg overflow-hidden">
              <img 
                src={LOGO_URL} 
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-xl font-bold">Admin</h2>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-800 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          {[
            { to: "/admin", icon: BarChart3, label: "Overview" },
            { to: "/admin/products", icon: ShoppingBag, label: "Products" },
            { to: "/admin/bookings", icon: Wrench, label: "Bookings" },
            { to: "/admin/services", icon: Edit, label: "Services" },
            { to: "/admin/categories", icon: List, label: "Categories" },
            { to: "/admin/settings", icon: Settings, label: "Settings" },
            { to: "/chats", icon: MessageSquare, label: "Chats" },
          ].map((item) => (
            <Link 
              key={item.to}
              to={item.to} 
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <item.icon size={20} /> {item.label}
            </Link>
          ))}
          
          <div className="pt-4 mt-4 border-t border-gray-800">
            <Link 
              to="/" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            >
              <Home size={20} /> Back to Website
            </Link>
          </div>
        </nav>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[55] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-grow p-4 sm:p-8 w-full overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/products" element={<ManageProducts />} />
          <Route path="/bookings" element={<ManageBookings />} />
          <Route path="/services" element={<ManageServices />} />
          <Route path="/categories" element={<ManageCategories />} />
          <Route path="/settings" element={<AdminSettings />} />
        </Routes>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      await api.patch('/admin/change-password', { newPassword });
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 dark:text-white">Admin Settings</h2>
      
      <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800">
        <h3 className="text-xl font-bold mb-6 dark:text-white">Change Admin Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" 
              placeholder="Enter new password"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" 
              placeholder="Confirm new password"
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

const ManageCategories = () => {
  const [categories, setCategories] = React.useState([]);
  const [newCategory, setNewCategory] = React.useState('');

  const fetchCategories = () => api.get('/categories').then(res => setCategories(Array.isArray(res.data) ? res.data : []));
  React.useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await api.post('/admin/categories', { name: newCategory });
      toast.success('Category added');
      setNewCategory('');
      fetchCategories();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to add category');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 dark:text-white">Manage Categories</h2>
      
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 mb-8">
        <h3 className="text-xl font-bold mb-6 dark:text-white">Add New Category</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" placeholder="Category Name" 
            value={newCategory} onChange={e => setNewCategory(e.target.value)}
            className="flex-grow p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" required 
          />
          <button type="submit" className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all">
            <Plus size={20} /> Add
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-left min-w-[400px]">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Category Name</th>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c: any) => (
              <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="p-6 font-medium dark:text-white">{c.name}</td>
                <td className="p-6">
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Overview = () => {
  const [stats, setStats] = React.useState({ products: 0, bookings: 0 });
  const [dbInfo, setDbInfo] = React.useState<any[]>([]);

  React.useEffect(() => {
    api.get('/products').then(res => setStats(prev => ({ ...prev, products: Array.isArray(res.data) ? res.data.length : 0 })));
    api.get('/admin/bookings').then(res => setStats(prev => ({ ...prev, bookings: Array.isArray(res.data) ? res.data.length : 0 })));
    api.get('/admin/db-info').then(res => setDbInfo(Array.isArray(res.data) ? res.data : []));
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 dark:text-white">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 mb-2">Total Products</p>
          <p className="text-4xl font-bold text-red-600 dark:text-red-500">{stats.products}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 mb-2">Service Bookings</p>
          <p className="text-4xl font-bold text-red-600 dark:text-red-500">{stats.bookings}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-6 dark:text-white">Database Status (Integrated)</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {dbInfo.map(info => (
          <div key={info.table} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">{info.table}</p>
            <p className="text-xl font-bold dark:text-white">{info.count} rows</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ManageProducts = () => {
  const [products, setProducts] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<any>(null);
  const [newProduct, setNewProduct] = React.useState({ name: '', price: '', description: '', category_id: '', warranty: '', image_url: '' });

  const fetchProducts = () => api.get('/products').then(res => setProducts(Array.isArray(res.data) ? res.data : []));
  const fetchCategories = () => api.get('/categories').then(res => {
    const data = Array.isArray(res.data) ? res.data : [];
    setCategories(data);
    if (data.length > 0) setNewProduct(prev => ({ ...prev, category_id: data[0].id.toString() }));
  });

  React.useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        name: newProduct.name,
        price: newProduct.price,
        description: newProduct.description,
        category_id: newProduct.category_id,
        warranty: newProduct.warranty,
        images: newProduct.image_url ? [newProduct.image_url] : []
      });
      toast.success('Product added');
      setShowAdd(false);
      setNewProduct({ name: '', price: '', description: '', category_id: categories.length > 0 ? (categories[0] as any).id.toString() : '', warranty: '', image_url: '' });
      fetchProducts();
    } catch (e) { toast.error('Failed to add product'); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/admin/products/${editingProduct.id}`, {
        name: editingProduct.name,
        price: editingProduct.price,
        description: editingProduct.description,
        category_id: editingProduct.category_id,
        warranty: editingProduct.warranty,
        images: editingProduct.new_image_url ? [editingProduct.new_image_url] : []
      });
      toast.success('Product updated');
      setEditingProduct(null);
      fetchProducts();
    } catch (e) { toast.error('Update failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (e) { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold dark:text-white">Manage Products</h2>
        <button 
          onClick={() => setShowAdd(true)}
          className="w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      {showAdd && (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 mb-8">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input 
              type="text" placeholder="Product Name" 
              value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" required 
            />
            <input 
              type="number" placeholder="Price" 
              value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" required 
            />
            <select 
              value={newProduct.category_id} onChange={e => setNewProduct({...newProduct, category_id: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 md:col-span-2 dark:text-white" required
            >
              <option value="" disabled className="dark:bg-gray-800">Select Category</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id} className="dark:bg-gray-800">{c.name}</option>
              ))}
            </select>
            <textarea 
              placeholder="Description" 
              value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 md:col-span-2 h-32 dark:text-white" required 
            />
            <input 
              type="text" placeholder="Warranty (e.g. 6 Months Warranty)" 
              value={newProduct.warranty} onChange={e => setNewProduct({...newProduct, warranty: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 md:col-span-2 dark:text-white" required 
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Product Image URL</label>
              <input
                type="url" placeholder="https://example.com/image.jpg"
                value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Paste a Cloudinary or any public image URL.</p>
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all">Save Product</button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-gray-100 dark:bg-gray-800 dark:text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingProduct && (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 mb-8">
          <h3 className="text-xl font-bold mb-6 dark:text-white">Edit Product: {editingProduct.name}</h3>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input 
              type="text" placeholder="Product Name" 
              value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" required 
            />
            <input 
              type="number" placeholder="Price" 
              value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" required 
            />
            <select 
              value={editingProduct.category_id} onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 md:col-span-2 dark:text-white" required
            >
              <option value="" disabled className="dark:bg-gray-800">Select Category</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id} className="dark:bg-gray-800">{c.name}</option>
              ))}
            </select>
            <textarea 
              placeholder="Description" 
              value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 md:col-span-2 h-32 dark:text-white" required 
            />
            <input 
              type="text" placeholder="Warranty (e.g. 6 Months Warranty)" 
              value={editingProduct.warranty} onChange={e => setEditingProduct({...editingProduct, warranty: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 md:col-span-2 dark:text-white" required 
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Add Image URL</label>
              <input
                type="url" placeholder="https://example.com/image.jpg"
                value={editingProduct.new_image_url || ''} onChange={e => setEditingProduct({...editingProduct, new_image_url: e.target.value})}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
              />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all">Update Product</button>
              <button type="button" onClick={() => setEditingProduct(null)} className="bg-gray-100 dark:bg-gray-800 dark:text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Product</th>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Category</th>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Price</th>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="p-6 font-medium dark:text-white">{p.name}</td>
                <td className="p-6 text-gray-500 dark:text-gray-400">{p.category_name}</td>
                <td className="p-6 font-bold text-red-600 dark:text-red-500">₹{p.price}</td>
                <td className="p-6 flex gap-3">
                  <button onClick={() => setEditingProduct(p)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ManageBookings = () => {
  const [bookings, setBookings] = React.useState([]);

  const fetchBookings = () => api.get('/admin/bookings').then(res => setBookings(Array.isArray(res.data) ? res.data : []));
  React.useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/admin/bookings/${id}`, { status });
      toast.success('Status updated');
      fetchBookings();
    } catch (e) { toast.error('Update failed'); }
  };

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 dark:text-white">Service Bookings</h2>
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Customer</th>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Service</th>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Status</th>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b: any) => (
              <tr key={b.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="p-6">
                  <p className="font-bold dark:text-white">{b.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{b.phone_number}</p>
                </td>
                <td className="p-6 dark:text-gray-300">{b.service_name}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    b.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                    b.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {b.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-6 flex gap-3">
                  <button onClick={() => updateStatus(b.id, 'completed')} className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"><CheckCircle size={20} /></button>
                  <button onClick={() => updateStatus(b.id, 'rejected')} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><XCircle size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ManageServices = () => {
  const [services, setServices] = React.useState([]);
  const [editingService, setEditingService] = React.useState<any>(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const [newService, setNewService] = React.useState({ name: '', price: '', description: '', warranty: '', image_url: '' });

  const fetchServices = () => api.get('/services').then(res => setServices(Array.isArray(res.data) ? res.data : []));
  React.useEffect(() => { fetchServices(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/services', {
        name: newService.name, price: newService.price,
        description: newService.description, warranty: newService.warranty,
        image_url: newService.image_url || null
      });
      toast.success('Service added');
      setShowAdd(false);
      setNewService({ name: '', price: '', description: '', warranty: '', image_url: '' });
      fetchServices();
    } catch (e) { toast.error('Failed to add service'); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/admin/services/${editingService.id}`, {
        name: editingService.name, price: editingService.price,
        description: editingService.description, warranty: editingService.warranty,
        image_url: editingService.image_url || null
      });
      toast.success('Service updated');
      setEditingService(null);
      fetchServices();
    } catch (e) { toast.error('Update failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/admin/services/${id}`);
      toast.success('Service deleted');
      fetchServices();
    } catch (e) { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold dark:text-white">Manage Services & Warranty</h2>
        <button 
          onClick={() => setShowAdd(true)}
          className="w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none"
        >
          <Plus size={20} /> Add Service
        </button>
      </div>
      
      {showAdd && (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 mb-8">
          <h3 className="text-xl font-bold mb-6 dark:text-white">Add New Service</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input 
              type="text" placeholder="Service Name" 
              value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" required 
            />
            <input 
              type="number" placeholder="Price" 
              value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" required 
            />
            <textarea 
              placeholder="Description" 
              value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 md:col-span-2 h-24 dark:text-white" required 
            />
            <input 
              type="text" placeholder="Repairing Warranty (e.g. 3 Months Warranty)" 
              value={newService.warranty} onChange={e => setNewService({...newService, warranty: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 md:col-span-2 dark:text-white" required 
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Service Image URL</label>
              <input
                type="url" placeholder="https://example.com/image.jpg"
                value={newService.image_url} onChange={e => setNewService({...newService, image_url: e.target.value})}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
              />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all">Save Service</button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-gray-100 dark:bg-gray-800 dark:text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingService && (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 mb-8">
          <h3 className="text-xl font-bold mb-6 dark:text-white">Edit Service: {editingService.name}</h3>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input 
              type="text" placeholder="Service Name" 
              value={editingService.name} onChange={e => setEditingService({...editingService, name: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" required 
            />
            <input 
              type="number" placeholder="Price" 
              value={editingService.price} onChange={e => setEditingService({...editingService, price: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white" required 
            />
            <textarea 
              placeholder="Description" 
              value={editingService.description} onChange={e => setEditingService({...editingService, description: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 md:col-span-2 h-24 dark:text-white" required 
            />
            <input 
              type="text" placeholder="Repairing Warranty (e.g. 3 Months Warranty)" 
              value={editingService.warranty} onChange={e => setEditingService({...editingService, warranty: e.target.value})}
              className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 md:col-span-2 dark:text-white" required 
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Update Service Image URL</label>
              <input
                type="url" placeholder="https://example.com/image.jpg"
                value={editingService.image_url || ''} onChange={e => setEditingService({...editingService, image_url: e.target.value})}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
              />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all">Update Service</button>
              <button type="button" onClick={() => setEditingService(null)} className="bg-gray-100 dark:bg-gray-800 dark:text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Service</th>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Warranty</th>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Price</th>
              <th className="p-6 font-bold text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s: any) => (
              <tr key={s.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="p-6">
                  <p className="font-bold dark:text-white">{s.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.description}</p>
                </td>
                <td className="p-6">
                  <span className="text-green-600 dark:text-green-400 font-bold text-sm">{s.warranty || 'No Warranty'}</span>
                </td>
                <td className="p-6 font-bold text-red-600 dark:text-red-500">₹{s.price}</td>
                <td className="p-6 flex gap-2">
                  <button onClick={() => setEditingService(s)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit size={20} /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
