import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { IndianRupee, ShoppingBag, Users, ClipboardCheck, ArrowUpRight } from 'lucide-react';
import { fetchDashboardStats } from '../../redux/slices/adminSlice.js';
import Sidebar from '../../components/layout/Sidebar.jsx';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { stats, monthlySales, categorySales, recentOrders, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
    } else {
      dispatch(fetchDashboardStats());
    }
  }, [dispatch, isAuthenticated, user, navigate]);

  // Premium Custom Colors for Recharts Pie slices
  const COLORS = ['#2563EB', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'Processing': return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'Shipped': return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'Delivered': return 'bg-green-50 text-green-600 border border-green-100';
      default: return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/50">
      {/* 1) Sidebar Left Nav Rail */}
      <Sidebar />

      {/* 2) Main Administrative Control panel */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        {/* Upper title */}
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2">
          <div>
            <h1 className="text-3xl font-display font-black tracking-tight text-darkSlate-900">Analytics Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Real-time indicators of transactions, customer segments, and products sold.</p>
          </div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-4 py-2 rounded-xl">
            Live Feed: Active
          </div>
        </div>

        {loading || !stats ? (
          /* Shimmer Statistics Loader */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {Array(4)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl" />
              ))}
          </div>
        ) : (
          <>
            {/* 3) METRICS STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Revenue */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Revenue</span>
                  <h3 className="font-display font-bold text-2xl text-darkSlate-900">₹{stats.totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl text-primary">
                  <IndianRupee className="h-6 w-6" />
                </div>
              </div>

              {/* Orders */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Orders Placed</span>
                  <h3 className="font-display font-bold text-2xl text-darkSlate-900">{stats.totalOrders}</h3>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl text-secondary">
                  <ShoppingBag className="h-6 w-6" />
                </div>
              </div>

              {/* Users */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Customers</span>
                  <h3 className="font-display font-bold text-2xl text-darkSlate-900">{stats.totalUsers}</h3>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-success">
                  <Users className="h-6 w-6" />
                </div>
              </div>

              {/* Products */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Product Catalog</span>
                  <h3 className="font-display font-bold text-2xl text-darkSlate-900">{stats.totalProducts}</h3>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl text-purple-600">
                  <ClipboardCheck className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* 4) RECHARTS DYNAMIC CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Sales Area Chart (2/3 columns wide) */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-base text-darkSlate-900 uppercase tracking-wide">Monthly Sales Performance</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Aggregated paid transaction volume over the current calendar cycle.</p>
                </div>

                <div className="h-80 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlySales}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          borderRadius: '12px',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px'
                        }}
                        formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Sales']}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" name="Monthly Sales (₹)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Categorical sales distribution Pie chart */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-darkSlate-900 uppercase tracking-wide">Department Share</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Distribution of revenue generated across product departments.</p>
                </div>

                <div className="h-60 w-full relative flex items-center justify-center">
                  {categorySales.length === 0 ? (
                    <div className="text-xs text-slate-400">No category transactions logged.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySales}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="revenue"
                          nameKey="category"
                        >
                          {categorySales.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Categories Custom Legend */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider pt-2">
                  {categorySales.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-1.5 truncate">
                      <span className="h-2 w-2 rounded-full block flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate">{entry.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5) RECENT CUSTOMER ORDERS TABLE */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-base text-darkSlate-900 uppercase tracking-wide">Recent Transactions</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Monitoring logs of latest purchase invoices logged.</p>
                </div>
                <button
                  onClick={() => navigate('/admin/orders')}
                  className="flex items-center space-x-1 text-xs text-primary hover:text-primary-dark font-semibold transition"
                >
                  <span>Go to Fulfill Orders</span>
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-500">
                  <thead className="bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3.5">Invoice ID</th>
                      <th className="px-4 py-3.5">Customer</th>
                      <th className="px-4 py-3.5">Total paid</th>
                      <th className="px-4 py-3.5">Fulfillment Status</th>
                      <th className="px-4 py-3.5">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentOrders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-slate-50/30 transition">
                        <td className="px-4 py-4 font-mono text-darkSlate-800 font-semibold">{ord._id}</td>
                        <td className="px-4 py-4 truncate max-w-[150px]">
                          <span className="text-darkSlate-900 font-bold block leading-none">{ord.userId?.name}</span>
                          <span className="text-slate-400 text-[10px] block mt-1.5">{ord.userId?.email}</span>
                        </td>
                        <td className="px-4 py-4 font-bold text-darkSlate-950">₹{ord.totalAmount.toFixed(2)}</td>
                        <td className="px-4 py-4">
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${getStatusBadge(ord.orderStatus)}`}>
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                            ord.paymentStatus === 'Paid'
                              ? 'bg-green-50 text-success border border-green-100'
                              : 'bg-red-50 text-danger border border-red-100'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;


