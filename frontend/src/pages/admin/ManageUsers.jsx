import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserCheck, ShieldAlert, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { fetchAdminUsers, updateUserRoleAdmin, deleteUserAdmin } from '../../redux/slices/adminSlice.js';

const ManageUsers = () => {
  const dispatch = useDispatch();

  const { users, usersLoading } = useSelector((state) => state.admin);
  const { user: currentUser } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchAdminUsers());
  }, [dispatch]);

  const handleRoleChange = (id, newRole) => {
    if (id === currentUser._id) {
      toast.error('You cannot change your own administrative privileges!');
      return;
    }
    dispatch(updateUserRoleAdmin({ id, role: newRole }));
    toast.success(`User role elevated to ${newRole}`);
  };

  const handleDeleteUser = (id) => {
    if (id === currentUser._id) {
      toast.error('You cannot delete your own administrative account!');
      return;
    }
    if (window.confirm('Are you sure you want to permanently delete this user account? All prior carts and addresses linked to this account will be purged.')) {
      dispatch(deleteUserAdmin(id));
      toast.success('User account removed successfully.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/50">
      <Sidebar />

      <main className="flex-grow p-6 md:p-10 space-y-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-3xl font-display font-black text-darkSlate-900 tracking-tight">Manage Accounts</h1>
            <p className="text-slate-400 text-sm mt-1">Configure client logins, assign management tiers, or oversee shopper profiles.</p>
          </div>
        </div>

        {usersLoading ? (
          <div className="space-y-6 animate-pulse">
            {Array(3)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="h-24 bg-white border border-slate-100 rounded-3xl" />
              ))}
          </div>
        ) : (
          /* Users spreadsheet */
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-500">
                <thead className="bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3.5">User</th>
                    <th className="px-4 py-3.5">Registered Date</th>
                    <th className="px-4 py-3.5">Privilege Tier</th>
                    <th className="px-4 py-3.5 text-center">Terminate Account</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/20 transition">
                      <td className="px-4 py-4 flex items-center space-x-4">
                        <img
                          src={u.avatar}
                          alt="avatar"
                          className="w-10 h-10 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                        />
                        <div>
                          <h4 className="font-semibold text-sm text-darkSlate-900 leading-none">{u.name}</h4>
                          <span className="text-slate-400 text-[10px] block mt-1.5">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          disabled={u._id === currentUser._id}
                          className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                          <option value="customer">Customer Shopper</option>
                          <option value="admin">Store Administrator</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          disabled={u._id === currentUser._id}
                          className="p-2 hover:bg-red-50 border border-slate-100 hover:border-red-100 text-slate-400 hover:text-danger rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Terminate Account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageUsers;
