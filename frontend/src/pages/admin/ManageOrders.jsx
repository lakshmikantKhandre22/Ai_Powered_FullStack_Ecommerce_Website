import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, Edit3, X, MapPin, CreditCard, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { fetchAdminOrders, updateOrderStatusAdmin, resetAdminSuccess } from '../../redux/slices/adminSlice.js';

const ManageOrders = () => {
  const dispatch = useDispatch();

  const { orders, ordersLoading, success } = useSelector((state) => state.admin);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({
    orderStatus: '',
    paymentStatus: ''
  });

  useEffect(() => {
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toast.success('Shipping and payment statuses updated! 📦');
      setIsModalOpen(false);
      setSelectedOrder(null);
      dispatch(resetAdminSuccess());
    }
  }, [success, dispatch]);

  const handleOpenDetailsModal = (ord) => {
    setSelectedOrder(ord);
    setStatusForm({
      orderStatus: ord.orderStatus,
      paymentStatus: ord.paymentStatus
    });
    setIsModalOpen(true);
  };

  const handleUpdateStatus = (e) => {
    e.preventDefault();
    dispatch(
      updateOrderStatusAdmin({
        id: selectedOrder._id,
        orderStatus: statusForm.orderStatus,
        paymentStatus: statusForm.paymentStatus
      })
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'Processing': return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'Shipped': return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'Delivered': return 'bg-green-50 text-green-600 border border-green-100';
      case 'Cancelled': return 'bg-red-50 text-red-600 border border-red-100';
      default: return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/50">
      <Sidebar />

      <main className="flex-grow p-6 md:p-10 space-y-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-3xl font-display font-black text-darkSlate-900 tracking-tight">Fulfill Orders</h1>
            <p className="text-slate-400 text-sm mt-1">Audit transactions, manage logistics, and coordinate ship routes.</p>
          </div>
        </div>

        {ordersLoading ? (
          <div className="space-y-6 animate-pulse">
            {Array(3)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="h-28 bg-white border border-slate-100 rounded-3xl" />
              ))}
          </div>
        ) : (
          /* Orders spreadsheet */
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-500">
                <thead className="bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3.5">Invoice ID</th>
                    <th className="px-4 py-3.5">Customer details</th>
                    <th className="px-4 py-3.5">Placed Date</th>
                    <th className="px-4 py-3.5">Paid Total</th>
                    <th className="px-4 py-3.5">Fulfillment Status</th>
                    <th className="px-4 py-3.5 text-center">Fulfill Dec</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50/20 transition">
                      <td className="px-4 py-4 font-mono text-darkSlate-800 font-semibold">{ord._id}</td>
                      <td className="px-4 py-4">
                        <span className="text-darkSlate-900 font-bold block leading-none">{ord.userId?.name || 'Customer'}</span>
                        <span className="text-slate-400 text-[10px] block mt-1.5">{ord.userId?.email}</span>
                      </td>
                      <td className="px-4 py-4">
                        {new Date(ord.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-4 font-bold text-darkSlate-950">₹{ord.totalAmount.toFixed(2)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col space-y-1">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider text-center w-28 ${getStatusBadge(ord.orderStatus)}`}>
                            {ord.orderStatus}
                          </span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider text-center w-28 ${
                            ord.paymentStatus === 'Paid' ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleOpenDetailsModal(ord)}
                          className="p-2 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 text-slate-400 hover:text-primary rounded-xl transition"
                          title="Fulfill Shipment"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Details and Edit Status Modal Sheet */}
        {isModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-8 shadow-2xl space-y-6 relative border border-slate-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-6 top-6 p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-display font-black text-lg text-darkSlate-900">
                  Fulfill Invoice #{selectedOrder._id}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-500 font-semibold">
                
                {/* Left Half: address, products list */}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5">
                    <div className="flex items-center space-x-1.5 text-darkSlate-950 font-bold uppercase tracking-wider text-[10px]">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>Shipping Address</span>
                    </div>
                    <div className="text-darkSlate-600 pl-5 space-y-0.5 leading-relaxed font-normal">
                      <p className="font-bold text-darkSlate-900">{selectedOrder.shippingAddress.fullName}</p>
                      <p>{selectedOrder.shippingAddress.phone}</p>
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}, {selectedOrder.shippingAddress.pincode}</p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-1.5 text-darkSlate-950 font-bold uppercase tracking-wider text-[10px]">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      <span>Purchased Items</span>
                    </div>
                    <div className="space-y-2 divide-y divide-slate-50 pr-1 max-h-48 overflow-y-auto">
                      {selectedOrder.products.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 text-[11px] leading-tight">
                          <span className="truncate max-w-[200px] text-darkSlate-800">{item.productId?.title || 'Unknown item'}</span>
                          <span className="text-slate-400">x{item.quantity}</span>
                          <span className="font-bold text-darkSlate-950">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Half: Quick Edit statuses dropdown */}
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-1.5 text-darkSlate-950 font-bold uppercase tracking-wider text-[10px]">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span>Fulfillment Status Adjuster</span>
                  </div>

                  <form onSubmit={handleUpdateStatus} className="space-y-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Status</label>
                      <select
                        value={statusForm.orderStatus}
                        onChange={(e) => setStatusForm({ ...statusForm, orderStatus: e.target.value })}
                        className="input-field bg-white"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Status</label>
                      <select
                        value={statusForm.paymentStatus}
                        onChange={(e) => setStatusForm({ ...statusForm, paymentStatus: e.target.value })}
                        className="input-field bg-white"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary w-full py-3.5 shadow-sm"
                    >
                      Save Status Updates
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageOrders;
