import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit3, Trash2, X, FolderPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { fetchCategories } from '../../redux/slices/productSlice.js';
import { createCategoryAdmin, updateCategoryAdmin, deleteCategoryAdmin, resetAdminSuccess } from '../../redux/slices/adminSlice.js';

const ManageCategories = () => {
  const dispatch = useDispatch();

  const { categories } = useSelector((state) => state.products);
  const { loading, success, error } = useSelector((state) => state.admin);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    image: ''
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toast.success(editingCategory ? 'Category successfully updated!' : 'New shopping department added! 🏷️');
      setIsModalOpen(false);
      setEditingCategory(null);
      dispatch(resetAdminSuccess());
      dispatch(fetchCategories());
    }
    if (error) {
      toast.error(error);
    }
  }, [success, error, dispatch, editingCategory]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setForm({ name: '', image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setForm({ name: cat.name, image: cat.image });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this category? All associated products may lose their category link.')) {
      dispatch(deleteCategoryAdmin(id));
      toast.success('Category removed successfully.');
      dispatch(fetchCategories());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.image) {
      toast.error('Please fill in all category fields!');
      return;
    }

    if (editingCategory) {
      dispatch(updateCategoryAdmin({ id: editingCategory._id, categoryData: form }));
    } else {
      dispatch(createCategoryAdmin(form));
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/50">
      <Sidebar />

      <main className="flex-grow p-6 md:p-10 space-y-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-3xl font-display font-black text-darkSlate-900 tracking-tight">Manage Departments</h1>
            <p className="text-slate-400 text-sm mt-1">Configure active customer categories and departments.</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary flex items-center space-x-2 py-3 px-6 shadow-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Department</span>
          </button>
        </div>

        {/* Categories Grid Table */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-500">
              <thead className="bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Slug URL Assignment</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/20 transition">
                    <td className="px-4 py-4 flex items-center space-x-4">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-14 h-14 object-cover rounded-2xl border border-slate-100 flex-shrink-0"
                      />
                      <h4 className="font-semibold text-sm text-darkSlate-900">{cat.name}</h4>
                    </td>
                    <td className="px-4 py-4 font-mono text-darkSlate-600">
                      /catalog?category={cat.slug}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2.5">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-2 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 text-slate-400 hover:text-primary rounded-xl transition"
                          title="Edit Category"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id)}
                          className="p-2 hover:bg-red-50 border border-slate-100 hover:border-red-100 text-slate-400 hover:text-danger rounded-xl transition"
                          title="Delete Category"
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

        {/* Modal Overlay Form Sheet */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl space-y-6 relative border border-slate-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-6 top-6 p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-display font-black text-lg text-darkSlate-900">
                  {editingCategory ? 'Edit Department details' : 'Add New Department'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Name */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="Electronics"
                  />
                </div>

                {/* Cover Image URL */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department Cover URL *</label>
                  <input
                    type="text"
                    required
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
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
                    <span>{loading ? 'Saving...' : 'Save Department'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageCategories;
