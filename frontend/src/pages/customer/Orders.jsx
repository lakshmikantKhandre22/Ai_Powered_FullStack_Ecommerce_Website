import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, ChevronRight, Clock, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { fetchMyOrders } from '../../redux/slices/orderSlice.js';

const Orders = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { orders, ordersLoading } = useSelector((state) => state.orders);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      dispatch(fetchMyOrders());
    }
  }, [dispatch, isAuthenticated, navigate]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'Processing':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'Shipped':
        return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'Delivered':
        return 'bg-green-50 text-green-600 border border-green-100';
      case 'Cancelled':
        return 'bg-red-50 text-red-600 border border-red-100';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight text-darkSlate-900">Your Shipments</h1>
        <p className="text-slate-400 text-sm mt-1">Track and monitor your active purchase orders</p>
      </div>

      {ordersLoading ? (
        <div className="space-y-6 animate-pulse">
          {Array(3)
            .fill(null)
            .map((_, i) => (
              <div key={i} className="h-40 bg-white border border-slate-100 rounded-3xl" />
            ))}
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white rounded-3xl p-16 text-center space-y-4 shadow-sm">
          <div className="bg-slate-50 p-6 rounded-full text-slate-300">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h3 className="font-display font-bold text-slate-800 text-lg">No Orders Placed Yet</h3>
          <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
            Looks like you haven't placed any purchases yet. Your active shipments history will show up right here.
          </p>
          <Link to="/catalog" className="btn-primary text-xs flex items-center space-x-2">
            <span>Explore Products</span>
          </Link>
        </div>
      ) : (
        /* Active Orders list */
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:border-slate-200 transition-all duration-300"
            >
              {/* Order Header bar */}
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold text-slate-500">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Date Placed</span>
                    <span className="text-darkSlate-800 mt-1 block">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Amount</span>
                    <span className="text-primary font-bold text-sm mt-0.5 block">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Invoice Code</span>
                    <span className="text-darkSlate-600 font-mono mt-1 block">{order._id}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${getStatusBadgeClass(order.orderStatus)}`}>
                    Fulfillment: {order.orderStatus}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                    order.paymentStatus === 'Paid'
                      ? 'bg-green-50 text-success border border-green-100'
                      : 'bg-red-50 text-danger border border-red-100'
                  }`}>
                    Payment: {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Order Items list */}
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  {order.products.map((item, idx) => {
                    const prod = item.productId;
                    if (!prod) return null;
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs font-semibold py-3 border-b border-slate-55 last:border-0 last:pb-0">
                        {/* Thumbnail & Title */}
                        <div className="flex items-center space-x-4 max-w-md">
                          <img
                            src={prod.images?.[0]}
                            alt={prod.title}
                            className="w-14 h-14 object-cover rounded-xl border border-slate-100"
                          />
                          <div>
                            <h4 className="font-semibold text-sm text-darkSlate-900 leading-snug line-clamp-1">{prod.title}</h4>
                            <span className="text-slate-400 text-[10px] block mt-1">Single Unit Price: ₹{item.price?.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Quantity */}
                        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                          Quantity: <span className="font-bold text-darkSlate-800">{item.quantity}</span>
                        </span>

                        {/* Item total */}
                        <span className="font-bold text-sm text-darkSlate-950">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Shipping summary detail block */}
                <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-500 font-semibold bg-slate-50/30 -mx-6 -mb-6 p-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 text-darkSlate-800">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="uppercase text-[10px] font-bold tracking-wider">Shipping Address</span>
                    </div>
                    <div className="text-darkSlate-600 pl-5 leading-relaxed font-normal">
                      <p className="font-semibold text-darkSlate-900">{order.shippingAddress.fullName}</p>
                      <p>{order.shippingAddress.phone}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.pincode}</p>
                      <p>{order.shippingAddress.country}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 text-darkSlate-800">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="uppercase text-[10px] font-bold tracking-wider">Payment Details</span>
                    </div>
                    <div className="text-darkSlate-600 pl-5 space-y-1 font-normal leading-relaxed">
                      <p>Processor: <span className="font-semibold text-darkSlate-800">{order.paymentMethod}</span></p>
                      <p>Fulfillment status: <span className="font-semibold text-darkSlate-800">{order.paymentStatus}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
