import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Plus, Edit3, Trash2, X, PlusCircle, CheckCircle, Search, HelpCircle, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { fetchProducts, fetchCategories } from '../../redux/slices/productSlice.js';
import { createProductAdmin, updateProductAdmin, deleteProductAdmin, resetAdminSuccess } from '../../redux/slices/adminSlice.js';
import API from '../../services/api.js';

const ManageProducts = () => {
  const dispatch = useDispatch();
  
  const { products, categories } = useSelector((state) => state.products);
  const { loading, success, error } = useSelector((state) => state.admin);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      toast.loading('Uploading image to Cloudinary...', { id: 'imgUpload' });

      const formData = new FormData();
      formData.append('image', file);

      const response = await API.post('/products/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.status === 'success') {
        const imageUrl = response.data.url;
        setForm((prev) => ({
          ...prev,
          images: imageUrl
        }));
        toast.success('Image uploaded successfully! 📸', { id: 'imgUpload' });
      } else {
        toast.error('Image upload failed.', { id: 'imgUpload' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error occurred during image upload.', { id: 'imgUpload' });
    } finally {
      setIsUploading(false);
    }
  };

  // Form State
  const [form, setForm] = useState({
    title: '',
    brand: '',
    price: '',
    discountPrice: '',
    stock: '',
    categoryId: '',
    description: '',
    images: ''
  });

  useEffect(() => {
    dispatch(fetchProducts({ limit: 100 })); // Load a wide catalog for editing
    dispatch(fetchCategories());
  }, [dispatch]);

  // Handle successes/failures from Admin operations
  useEffect(() => {
    if (success) {
      toast.success(editingProduct ? 'Product details updated!' : 'New product successfully cataloged! 📦');
      setIsModalOpen(false);
      setEditingProduct(null);
      dispatch(resetAdminSuccess());
      dispatch(fetchProducts({ limit: 100 })); // Reload
    }
    if (error) {
      toast.error(error);
    }
  }, [success, error, dispatch, editingProduct]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setForm({
      title: '',
      brand: '',
      price: '',
      discountPrice: '0',
      stock: '10',
      categoryId: categories[0]?._id || '',
      description: '',
      images: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setForm({
      title: prod.title,
      brand: prod.brand,
      price: prod.price.toString(),
      discountPrice: prod.discountPrice?.toString() || '0',
      stock: prod.stock.toString(),
      categoryId: prod.categoryId?._id || categories[0]?._id || '',
      description: prod.description,
      images: prod.images?.[0] || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this product?')) {
      dispatch(deleteProductAdmin(id));
      toast.success('Product removed successfully.');
      dispatch(fetchProducts({ limit: 100 }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.brand || !form.price || !form.categoryId || !form.description) {
      toast.error('Please enter all required specifications!');
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      discountPrice: Number(form.discountPrice) || 0,
      stock: Number(form.stock),
      images: [form.images]
    };

    if (editingProduct) {
      dispatch(updateProductAdmin({ id: editingProduct._id, productData: payload }));
    } else {
      dispatch(createProductAdmin(payload));
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/50">
      <Sidebar />

      <main className="flex-grow p-6 md:p-10 space-y-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-3xl font-display font-black text-darkSlate-900 tracking-tight">Manage Products</h1>
            <p className="text-slate-400 text-sm mt-1">Review active inventory, draft descriptions, or catalog new arrivals.</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary flex items-center space-x-2 py-3 px-6 shadow-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Inventory Spread Table */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-500">
              <thead className="bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Base Price</th>
                  <th className="px-4 py-3.5">Stock Level</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-slate-50/20 transition">
                    <td className="px-4 py-4 flex items-center space-x-4 max-w-sm">
                      <img
                        src={prod.images?.[0] || 'https://via.placeholder.com/64'}
                        alt={prod.title}
                        className="w-12 h-12 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                      />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{prod.brand}</span>
                        <h4 className="font-semibold text-sm text-darkSlate-900 leading-snug line-clamp-1 mt-0.5">{prod.title}</h4>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        {prod.categoryId?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-darkSlate-900">
                      ₹{prod.price.toFixed(2)}
                      {prod.discountPrice > 0 && (
                        <span className="text-[10px] text-danger block font-medium mt-0.5">Promo: ₹{prod.discountPrice.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        prod.stock > 10
                          ? 'text-success'
                          : prod.stock > 0
                          ? 'text-amber-500 bg-amber-50'
                          : 'text-danger bg-red-50 font-black'
                      }`}>
                        {prod.stock > 0 ? `${prod.stock} units` : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2.5">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-2 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 text-slate-400 hover:text-primary rounded-xl transition"
                          title="Edit Details"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod._id)}
                          className="p-2 hover:bg-red-50 border border-slate-100 hover:border-red-100 text-slate-400 hover:text-danger rounded-xl transition"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal edit overlay sheet */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-8 shadow-2xl space-y-6 relative border border-slate-100"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-6 top-6 p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-display font-black text-lg text-darkSlate-900">
                  {editingProduct ? 'Edit Product Details' : 'Catalog New Product'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                {/* Title */}
                <div className="flex flex-col space-y-1.5 sm:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="input-field"
                    placeholder="SoundPro Wireless Headphones"
                  />
                </div>

                {/* Brand */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="input-field"
                    placeholder="Acoustic Labs"
                  />
                </div>

                {/* Category dropdown */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="input-field"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input-field"
                    placeholder="199.99"
                  />
                </div>

                {/* Discount */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Discounted Promo Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.discountPrice}
                    onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                    className="input-field"
                    placeholder="0"
                  />
                </div>

                {/* Stock */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stock Units Quantity *</label>
                  <input
                    type="number"
                    required
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="input-field"
                  />
                </div>

                {/* Image Upload / URL Selector */}
                <div className="flex flex-col space-y-2 sm:col-span-2 bg-slate-50/50 border border-slate-100 p-5 rounded-2xl">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Product Photography *</label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                    {/* Upload File Box */}
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-4 transition duration-300 relative bg-white h-28">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        id="image-file-input"
                      />
                      <div className="text-center space-y-2 pointer-events-none">
                        <Upload className="h-5 w-5 text-slate-400 mx-auto" />
                        <span className="text-[10px] font-bold text-slate-700 block">
                          {isUploading ? 'Uploading to Cloudinary...' : 'Select local photography'}
                        </span>
                        <span className="text-[8px] text-slate-400 uppercase block">PNG, JPG, WEBP up to 5MB</span>
                      </div>
                    </div>

                    {/* Fallback URL Input & Preview */}
                    <div className="space-y-3">
                      <div className="flex flex-col space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Or provide URL link</span>
                        <input
                          type="text"
                          required
                          value={form.images}
                          onChange={(e) => setForm({ ...form, images: e.target.value })}
                          className="input-field bg-white focus:ring-blue-100"
                          placeholder="https://example.com/image.jpg"
                          disabled={isUploading}
                        />
                      </div>
                      
                      {form.images && (
                        <div className="flex items-center space-x-3 bg-white border border-slate-100 p-2 rounded-xl">
                          <img
                            src={form.images}
                            alt="Preview"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-100"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] font-bold text-success uppercase block">Live Preview Active</span>
                            <span className="text-[9px] text-slate-400 truncate block mt-0.5">{form.images}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col space-y-1.5 sm:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Description *</label>
                  <textarea
                    rows="4"
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-field resize-none"
                    placeholder="Enter thorough specifications..."
                  />
                </div>

                <div className="sm:col-span-2 pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-outline !py-3 !px-6"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary !py-3 !px-6 shadow-sm"
                  >
                    <span>{loading ? 'Saving...' : 'Save Product'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageProducts;
