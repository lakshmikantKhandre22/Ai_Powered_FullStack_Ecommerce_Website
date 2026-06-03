import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, CheckCircle, ArrowLeft, ArrowRight, ShieldCheck, Mail, MapPin, Truck, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { createRazorpayOrderThunk, verifyRazorpayPaymentThunk, placeOrder, savePaymentRecord, clearCheckoutSession } from '../../redux/slices/orderSlice.js';
import { fetchCartDB } from '../../redux/slices/cartSlice.js';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);
  const { loading, success, currentOrder } = useSelector((state) => state.orders);

  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Shipping, 2: Payment, 3: Success
  const [paymentMode, setPaymentMode] = useState('online'); // 'online' or 'cod'

  // 1. Shipping Address form state
  const [shippingForm, setShippingForm] = useState({
    fullName: user?.name || '',
    phone: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });

  // Mock UPI state
  const [upiForm, setUpiForm] = useState({
    vpa: `${user?.name?.toLowerCase().replace(/\s+/g, '') || 'user'}@okhdfcbank`
  });

  // Redirect to login if unauthenticated, or catalog if cart is empty (unless order is placed)
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to proceed to checkout!');
      navigate('/login');
    } else if (cartItems.length === 0 && checkoutStep !== 3) {
      toast.error('Your shopping cart is empty.');
      navigate('/catalog');
    }
  }, [isAuthenticated, cartItems, checkoutStep, navigate]);

  // Load cart on checkout mount & dynamically inject Razorpay SDK script
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCartDB());
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      dispatch(clearCheckoutSession());
      document.body.removeChild(script);
    };
  }, [dispatch, isAuthenticated]);

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    const { fullName, phone, city, state, pincode, country } = shippingForm;
    
    if (!fullName || !phone || !city || !state || !pincode || !country) {
      toast.error('Please fill in all shipping details!');
      return;
    }
    setCheckoutStep(2);
  };

  // Pricing calculations (Indian Rupee Scale)
  const itemsTotal = cartItems.reduce((acc, item) => {
    if (!item.productId) return acc;
    const price = item.productId.discountPrice > 0 ? item.productId.discountPrice : item.productId.price;
    return acc + price * item.quantity;
  }, 0);

  const shippingCost = itemsTotal > 1000 ? 0 : 99.00;
  const tax = itemsTotal * 0.18; // 18% standard GST rate in India
  const grandTotal = itemsTotal + shippingCost + tax;

  const executeCodCheckoutFlow = async () => {
    try {
      toast.loading('Processing your cash on delivery selection...', { id: 'checkout' });

      const productsPayload = cartItems
        .filter((item) => item.productId)
        .map((item) => ({
          productId: item.productId._id,
          quantity: item.quantity,
          price: item.productId.discountPrice > 0 ? item.productId.discountPrice : item.productId.price
        }));

      if (productsPayload.length === 0) {
        toast.error('Your cart contains stale or invalid items. Please clear your cart and re-add products.', { id: 'checkout' });
        return;
      }

      const orderRes = await dispatch(
        placeOrder({
          products: productsPayload,
          shippingAddress: shippingForm,
          paymentMethod: 'COD',
          paymentStatus: 'Pending',
          totalAmount: grandTotal
        })
      ).unwrap();

      toast.success('Pay on Delivery Order registered successfully! 📦', { id: 'checkout' });
      setCheckoutStep(3);
    } catch (err) {
      toast.error(err || 'Failed to place cash on delivery order.', { id: 'checkout' });
    }
  };

  const handleCompletePayment = async () => {
    if (paymentMode === 'cod') {
      await executeCodCheckoutFlow();
      return;
    }

    try {
      toast.loading('Initializing secure Razorpay order...', { id: 'checkout' });
      
      const productsPayload = cartItems
        .filter((item) => item.productId)
        .map((item) => ({
          productId: item.productId._id,
          quantity: item.quantity,
          price: item.productId.discountPrice > 0 ? item.productId.discountPrice : item.productId.price
        }));

      if (productsPayload.length === 0) {
        toast.error('Your cart contains stale or invalid items. Please clear your cart and re-add products.', { id: 'checkout' });
        return;
      }

      // 1. Initialize Razorpay order on backend
      const orderRes = await dispatch(
        createRazorpayOrderThunk({ amount: grandTotal, currency: 'INR' })
      ).unwrap();

      const rzpOrder = orderRes.order;

      // 2. Create the pending MongoDB order record
      toast.loading('Registering pending invoice...', { id: 'checkout' });
      const placeOrderRes = await dispatch(
        placeOrder({
          products: productsPayload,
          shippingAddress: shippingForm,
          paymentMethod: 'Razorpay',
          paymentStatus: 'Pending',
          totalAmount: grandTotal
        })
      ).unwrap();

      const newOrder = placeOrderRes.order;

      // 3. Handle mock fallback when no real Razorpay credentials are set in .env
      if (rzpOrder.id.startsWith('mock_')) {
        setTimeout(async () => {
          try {
            toast.loading('Simulating payment verification...', { id: 'checkout' });
            
            // Dispatch verification to backend with simulated parameters
            await dispatch(
              verifyRazorpayPaymentThunk({
                razorpay_order_id: rzpOrder.id,
                razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(4).toUpperCase()}`,
                razorpay_signature: 'mock_signature_approved',
                orderId: newOrder._id,
                amount: grandTotal
              })
            ).unwrap();

            toast.success('Secure Payment Verified successfully! 🎉', { id: 'checkout' });
            setCheckoutStep(3);
          } catch (err) {
            toast.error(err || 'Failed to complete mock verification.');
          }
        }, 1500);
        return;
      }

      // Check if Razorpay library loaded successfully
      if (!window.Razorpay) {
        toast.error('Razorpay SDK failed to load. Initiating sandbox simulation...', { id: 'checkout' });
        setTimeout(async () => {
          try {
            await dispatch(
              verifyRazorpayPaymentThunk({
                razorpay_order_id: rzpOrder.id,
                razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(4).toUpperCase()}`,
                razorpay_signature: 'mock_signature_approved',
                orderId: newOrder._id,
                amount: grandTotal
              })
            ).unwrap();
            toast.success('Simulated Payment Verified! 🎉', { id: 'checkout' });
            setCheckoutStep(3);
          } catch (err) {
            toast.error(err || 'Failed to complete verification.');
          }
        }, 1000);
        return;
      }

      // 4. Open Razorpay secure overlay
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        toast.error('Razorpay key is not configured.');
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || 'INR',
        name: 'ShopSphere',
        description: 'Elite Purchase Transaction',
        order_id: rzpOrder.id,
        handler: async function (response) {
          try {
            toast.loading('Cryptographically verifying signature...', { id: 'checkout' });
            
            // Send transaction credentials to backend for secure verification
            await dispatch(
              verifyRazorpayPaymentThunk({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: newOrder._id,
                amount: grandTotal
              })
            ).unwrap();

            toast.success('Payment verified & order marked as paid! 🎉', { id: 'checkout' });
            setCheckoutStep(3);
          } catch (err) {
            toast.error(err || 'Order finalizing encountered an issue.', { id: 'checkout' });
          }
        },
        prefill: {
          name: shippingForm.fullName,
          contact: shippingForm.phone,
          email: user?.email || ''
        },
        theme: {
          color: '#2563EB' // Brand premium blue
        },
        modal: {
          ondismiss: function () {
            toast.error('Payment cancelled by user.', { id: 'checkout' });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err || 'Checkout processing encountered an issue.', { id: 'checkout' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-12">
      {/* Page Header & Progress Stepper */}
      <div className="flex flex-col items-center space-y-6">
        <h1 className="text-3xl font-display font-black text-darkSlate-900 tracking-tight">Checkout Wizard</h1>
        
        {/* Stepper Progress Bar */}
        <div className="flex items-center space-x-4 text-xs font-semibold text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-6 py-3 rounded-2xl shadow-sm">
          <span className={checkoutStep >= 1 ? 'text-primary font-bold' : ''}>1. Shipping</span>
          <span className="text-slate-200">/</span>
          <span className={checkoutStep >= 2 ? 'text-primary font-bold' : ''}>2. Payment</span>
          <span className="text-slate-200">/</span>
          <span className={checkoutStep === 3 ? 'text-primary font-bold' : ''}>3. Confirmation</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ================= STEP 1: SHIPPING DETAILS ================= */}
        {checkoutStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-12"
          >
            {/* Form */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="flex items-center space-x-2 text-darkSlate-900 border-b border-slate-100 pb-3">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-display font-bold text-lg">Shipping Address</h3>
              </div>

              <form onSubmit={handleShippingSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient Full Name</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.fullName}
                    onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                    className="input-field"
                    placeholder="John Doe"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    className="input-field"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">City</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.city}
                    onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                    className="input-field"
                    placeholder="New Delhi"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">State / Province</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.state}
                    onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                    className="input-field"
                    placeholder="Delhi"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Postal / Pincode</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.pincode}
                    onChange={(e) => setShippingForm({ ...shippingForm, pincode: e.target.value })}
                    className="input-field"
                    placeholder="110001"
                  />
                </div>

                <div className="flex flex-col space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Country</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.country}
                    onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                    className="input-field"
                    placeholder="India"
                  />
                </div>

                <div className="sm:col-span-2 pt-4 border-t border-slate-100 flex justify-end">
                  <button type="submit" className="btn-primary flex items-center space-x-2 py-3 px-8 shadow-sm">
                    <span>Continue to Payment</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar Pricing Breakdown */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                <h4 className="font-display font-bold text-sm uppercase tracking-wide border-b border-slate-100 pb-3 text-darkSlate-900">
                  Order Summary
                </h4>
                <div className="max-h-56 overflow-y-auto space-y-3.5 pr-1">
                  {cartItems.map((item) => {
                    const prod = item.productId;
                    if (!prod) return null;
                    const finalItemPrice = prod.discountPrice > 0 ? prod.discountPrice : prod.price;

                    return (
                      <div key={prod._id} className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center space-x-3 max-w-[200px]">
                          <img
                            src={prod.images?.[0]}
                            alt={prod.title}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-100"
                          />
                          <span className="truncate block text-slate-700">{prod.title}</span>
                        </div>
                        <span className="text-slate-400">x{item.quantity}</span>
                        <span className="text-darkSlate-950">₹{(finalItemPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotals */}
                <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-500 font-semibold">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="text-darkSlate-800">₹{itemsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Charges</span>
                    <span className="text-darkSlate-800">{shippingCost === 0 ? 'Complimentary' : `₹${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated GST (18%)</span>
                    <span className="text-darkSlate-800">₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-3.5 text-sm font-bold text-darkSlate-900">
                    <span>Grand Total</span>
                    <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 2: SUMMARY & DUAL PAYMENT SELECTOR ================= */}
        {checkoutStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-12"
          >
            {/* Payment Details */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-8">
              <div className="flex items-center space-x-2 text-darkSlate-900 border-b border-slate-100 pb-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="font-display font-bold text-lg">Select Payment Method</h3>
              </div>

              {/* Payment Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Online Payment Option Card */}
                <div
                  onClick={() => setPaymentMode('online')}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all duration-300 relative flex flex-col justify-between h-44 ${
                    paymentMode === 'online'
                      ? 'border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-600/10'
                      : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm'
                  }`}
                >
                  <span className="absolute top-3 right-3 bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                    Recommended
                  </span>
                  <div className="space-y-3">
                    <div className={`p-2.5 rounded-xl w-fit ${paymentMode === 'online' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-darkSlate-900">Secure Online Checkout</h4>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        Pay securely using Cards, UPI, NetBanking, or Wallet via Razorpay.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-blue-600 mt-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Instant Signature Verified</span>
                  </div>
                </div>

                {/* Cash on Delivery Option Card */}
                <div
                  onClick={() => setPaymentMode('cod')}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all duration-300 relative flex flex-col justify-between h-44 ${
                    paymentMode === 'cod'
                      ? 'border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-600/10'
                      : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    <div className={`p-2.5 rounded-xl w-fit ${paymentMode === 'cod' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-darkSlate-900">Pay on Delivery (COD)</h4>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        Complete your purchase and pay by Cash/UPI upon parcel arrival.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-2">₹99 Delivery Fee under ₹1,000</span>
                </div>
              </div>

              {/* Selection Summary Details Card */}
              {paymentMode === 'online' ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-700">Razorpay Payment Information</span>
                    <ShieldCheck className="h-4.5 w-4.5 text-success" />
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    By confirming, a secure payment overlay will retrieve your order. Sandbox mock checkouts will run dynamically if no live keys are configured in `.env`.
                  </p>
                  <p className="text-[10px] text-slate-400 italic">
                    Prefilled contact information will be securely synchronized to prefill the checkout dialog.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-700">Cash on Delivery Terms</span>
                    <Truck className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed font-medium">
                    Please prepare precisely <span className="text-darkSlate-900 font-extrabold text-sm">₹{grandTotal.toFixed(2)}</span> in cash or have your UPI application ready to scan when the courier agent arrives at your address.
                  </p>
                  <p className="text-[10px] text-slate-400 italic">
                    The delivery representative will present the verified package. No hidden or extra surcharges apply beyond this amount.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 gap-4">
                <button
                  onClick={() => setCheckoutStep(1)}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-700 font-semibold transition py-3"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Shipping</span>
                </button>

                <button
                  onClick={handleCompletePayment}
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2 py-3.5 px-8 shadow-sm disabled:opacity-50"
                >
                  <span>
                    {loading 
                      ? 'Processing...' 
                      : paymentMode === 'cod' 
                        ? 'Confirm COD Purchase' 
                        : `Pay ₹${grandTotal.toFixed(2)}`
                    }
                  </span>
                  <ShieldCheck className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sidebar Shipping Destination Summary */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 text-xs font-semibold text-slate-500">
                <h4 className="font-display font-bold text-sm uppercase tracking-wide border-b border-slate-100 pb-3 text-darkSlate-900">
                  Shipping Destination
                </h4>
                <div className="space-y-2 mt-2 text-darkSlate-800">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="font-bold text-darkSlate-900">{shippingForm.fullName}</span>
                  </div>
                  <p className="pl-5">{shippingForm.phone}</p>
                  <p className="pl-5 text-slate-500">{shippingForm.city}, {shippingForm.state}</p>
                  <p className="pl-5 text-slate-500">{shippingForm.pincode}, {shippingForm.country}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 3: SUCCESS CONFIRMATION ================= */}
        {checkoutStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-10 shadow-lg text-center space-y-6"
          >
            <div className="bg-green-50 p-6 rounded-full text-success inline-block">
              <CheckCircle className="h-16 w-16 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-black text-darkSlate-900 tracking-tight">
                Order Placed Successfully!
              </h2>
              <p className="text-slate-500 text-sm">
                {currentOrder?.paymentMethod === 'COD' 
                  ? 'Thank you for your purchase. Please keep cash or UPI ready upon delivery.'
                  : 'Thank you for your purchase. Your payment was processed securely.'
                }
              </p>
            </div>

            {currentOrder && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-left space-y-4 max-w-md mx-auto text-xs font-semibold text-slate-500">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span>Order Invoice Number</span>
                  <span className="text-primary font-mono">{currentOrder._id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="text-darkSlate-900 font-bold uppercase">{currentOrder.paymentMethod || 'Online'}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {currentOrder?.paymentMethod === 'COD' ? 'Amount to Pay (COD)' : 'Total Amount Paid'}
                  </span>
                  <span className="text-primary font-bold">₹{currentOrder.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Recipient</span>
                  <span className="text-darkSlate-800 text-right">{currentOrder.shippingAddress?.fullName}</span>
                </div>
              </div>
            )}

            <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
              We've dispatched tracking credentials and shipment logs. Visit your personal dashboard to track delivery progress.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/orders" className="btn-primary w-full sm:w-auto text-center py-3">
                Track My Shipments
              </Link>
              <Link to="/" className="btn-outline w-full sm:w-auto text-center py-3">
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
