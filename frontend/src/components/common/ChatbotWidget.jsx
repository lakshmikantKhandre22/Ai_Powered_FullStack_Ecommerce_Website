import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles, AlertCircle } from 'lucide-react';
import API from '../../services/api.js';

const ChatbotWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Greetings! I am your **ShopSphere AI Concierge**. 🛍️\n\nI have real-time access to our active product database! Ask me to recommend products, find devices under specific budgets, or search by departments.',
      createdAt: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [dbProducts, setDbProducts] = useState([]);

  // Fetch active products list on mount for database verification
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await API.get('/products?limit=100');
        if (response.data?.products) {
          setDbProducts(response.data.products);
        }
      } catch (err) {
        console.warn('Failed to pre-cache products list for validation:', err);
      }
    };
    loadProducts();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Handle Quick Chip Queries
  const handleQuickQuery = async (queryText) => {
    if (isTyping) return;
    await sendMessageFlow(queryText);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || isTyping) return;
    const textToSend = messageInput;
    setMessageInput('');
    await sendMessageFlow(textToSend);
  };

  const sendMessageFlow = async (userText) => {
    const newUserMsg = {
      id: `user_${Math.random().toString(36).substring(4)}`,
      sender: 'user',
      text: userText,
      createdAt: new Date()
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      // Package conversation context history
      const activeHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6) // Include up to last 6 messages to keep context focused
        .map(m => ({
          sender: m.sender,
          text: m.text
        }));

      const response = await API.post('/ai/chat', {
        message: userText,
        history: activeHistory
      });

      if (response.data?.status === 'success') {
        const replyText = response.data.reply;
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Math.random().toString(36).substring(4)}`,
            sender: 'ai',
            text: replyText,
            createdAt: new Date()
          }
        ]);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Math.random().toString(36).substring(4)}`,
          sender: 'ai',
          text: 'Apologies! I encountered an authentication or network block while retrieving our inventory data. Please try again in a moment. 🌐',
          createdAt: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Custom high-fidelity inline Markdown Link and Text formatter
  const renderMessageText = (msgText) => {
    // Regex splits text into plain blocks vs Markdown links "[anchor](path)"
    const parts = msgText.split(/(\[.*?\]\(.*?\))/g);

    return parts.map((part, idx) => {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const [_, anchorText, path] = linkMatch;
        
        // Match internal product links: singular (/product/:id) or plural (/products/:id) or slugs (/product/samsung-galaxy-m35)
        const productPathMatch = path.match(/^\/product[s]?\/(.+)/);
        
        if (productPathMatch) {
          const productIdOrSlug = productPathMatch[1].split('?')[0].replace(/\/$/, '').trim();
          
          // 1. Direct ID matching in pre-cached catalog
          let matchedProduct = dbProducts.find(p => p._id === productIdOrSlug);

          // 2. Fuzzy slug, title, or brand matching fallback to heal hallucinated links
          if (!matchedProduct) {
            const cleanSlug = productIdOrSlug.toLowerCase().replace(/[-_/]/g, ' ').trim();
            const cleanAnchor = anchorText.toLowerCase().trim();

            matchedProduct = dbProducts.find(p => {
              const titleLower = p.title.toLowerCase();
              const brandLower = p.brand.toLowerCase();
              
              // Clean out punctuation or stop-words from title/brand to compare
              const cleanTitle = titleLower.replace(/[^a-z0-9\s]/g, '');
              const cleanBrand = brandLower.replace(/[^a-z0-9\s]/g, '');

              // Check if cleanSlug matches title/brand or cleanAnchor matches title/brand
              return (
                (cleanSlug.length > 2 && (titleLower.includes(cleanSlug) || cleanSlug.includes(titleLower) || brandLower.includes(cleanSlug) || cleanTitle.includes(cleanSlug) || cleanSlug.includes(cleanTitle))) ||
                (cleanAnchor.length > 2 && (titleLower.includes(cleanAnchor) || cleanAnchor.includes(titleLower) || brandLower.includes(cleanAnchor) || cleanTitle.includes(cleanAnchor) || cleanAnchor.includes(cleanTitle)))
              );
            });
          }

          if (matchedProduct) {
            // Render beautiful React Router SPA Link to singular details page: /product/:id
            return (
              <Link
                key={idx}
                to={`/product/${matchedProduct._id}`}
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center space-x-1 font-bold text-blue-600 hover:text-blue-800 underline bg-blue-50 hover:bg-blue-100/80 px-2 py-0.5 rounded-lg border border-blue-100 transition-all text-[11px] my-1 mr-1"
              >
                <span>{anchorText}</span>
              </Link>
            );
          } else {
            // Render custom unavailable text badge
            return (
              <span
                key={idx}
                className="inline-flex items-center space-x-1 font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[11px] my-1 mr-1 cursor-not-allowed"
                title="This product was cataloged but is currently out of stock or unavailable."
              >
                <span>[Product Unavailable]</span>
              </span>
            );
          }
        }

        // Internal SPA links (e.g. /login, /register, /orders)
        const isInternalPath = path.startsWith('/');
        if (isInternalPath) {
          return (
            <Link
              key={idx}
              to={path}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center font-bold text-indigo-600 hover:text-indigo-800 underline bg-indigo-50 hover:bg-indigo-100/80 px-2 py-0.5 rounded-lg border border-indigo-100 transition-all text-[11px] my-1 mr-1"
            >
              {anchorText}
            </Link>
          );
        }

        // Standard External URLs
        return (
          <a
            key={idx}
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-bold"
          >
            {anchorText}
          </a>
        );
      }

      // ── Order Status Badge Renderer ──────────────────────────────────────────
      // Detect inline status tokens like "🚚 **Shipped**" and render colored badges
      const orderStatusPatterns = [
        { regex: /(✅\s*\*\*Delivered\*\*|\*\*Delivered\*\*)/g, label: 'Delivered', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '✅' },
        { regex: /(🚚\s*\*\*Shipped\*\*|\*\*Shipped\*\*)/g,   label: 'Shipped',   cls: 'bg-blue-100 text-blue-700 border-blue-200',     icon: '🚚' },
        { regex: /(⚙️\s*\*\*Processing\*\*|\*\*Processing\*\*)/g, label: 'Processing', cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: '⚙️' },
        { regex: /(🕐\s*\*\*Pending\*\*|\*\*Pending\*\*)/g,   label: 'Pending',   cls: 'bg-slate-100 text-slate-600 border-slate-200',   icon: '🕐' },
        { regex: /(❌\s*\*\*Cancelled\*\*|\*\*Cancelled\*\*)/g, label: 'Cancelled', cls: 'bg-red-100 text-red-600 border-red-200',       icon: '❌' },
      ];

      // Check if this text block contains any order status markers
      let hasStatusBadge = orderStatusPatterns.some(({ regex }) => { regex.lastIndex = 0; return regex.test(part); });

      if (hasStatusBadge) {
        // Tokenize and replace status patterns with React badge elements
        const statusSegments = [];
        let remaining = part;
        let segKey = 0;

        for (const { regex, label, cls, icon } of orderStatusPatterns) {
          regex.lastIndex = 0;
          if (regex.test(remaining)) {
            regex.lastIndex = 0;
            const splitParts = remaining.split(regex);
            const newRemaining = [];
            splitParts.forEach((seg, si) => {
              regex.lastIndex = 0;
              if (regex.test(seg)) {
                statusSegments.push(
                  <span key={`${idx}-badge-${segKey++}`}
                    className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full border text-[10px] mx-0.5 my-0.5 ${cls}`}
                  >
                    {icon} {label}
                  </span>
                );
              } else {
                newRemaining.push(seg);
              }
            });
            // Reconstruct remaining text (non-badge parts)
            remaining = newRemaining.join('');
          }
        }

        // Render the remaining text normally alongside the badges
        const formattedRemaining = remaining
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/^---$/gm, '<hr class="border-slate-200 my-2" />')
          .replace(/^\s*-\s+(.*?)$/gm, '• $1');

        return (
          <span key={idx} className="inline">
            <span dangerouslySetInnerHTML={{ __html: formattedRemaining }} className="whitespace-pre-line leading-relaxed text-[12px]" />
            {statusSegments}
          </span>
        );
      }

      // Format markdown bold (**text**) and bullet points
      let formattedHtml = part
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^---$/gm, '<hr class="border-slate-200 my-2" />')
        .replace(/^\s*-\s+(.*?)$/gm, '• $1');

      return (
        <span
          key={idx}
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
          className="whitespace-pre-line leading-relaxed text-[12px]"
        />
      );
    });
  };


  return (
    <>
      {/* 1) FLOATING TOGGLE TRIGGER BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center relative hover:shadow-blue-500/20 hover:shadow-xl transition-all border border-blue-500/30"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative"
              >
                <MessageSquare className="h-6 w-6" />
                <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-success rounded-full border-2 border-white flex items-center justify-center animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* 2) CONCIERGE GLASSMORPHIC DIALOG WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[540px] bg-white/95 backdrop-blur-md border border-slate-100 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 p-2 rounded-xl border border-white/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm tracking-wide leading-none">ShopSphere Assistant</h3>
                  <div className="flex items-center space-x-1.5 mt-1.5">
                    <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-ping" />
                    <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">AI Concierge Live</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conversation message feed */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[82%] rounded-2xl p-4 text-xs font-medium leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/10'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-xs'
                  }`}>
                    {renderMessageText(msg.text)}
                  </div>
                </div>
              ))}

              {/* Loader Shimmer Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 text-xs font-semibold rounded-bl-none shadow-xs text-slate-400 flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                    <span>Searching catalog...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick response chip queries */}
            <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap">
              <button
                onClick={() => handleQuickQuery('Where is my order?')}
                className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 hover:text-indigo-700 rounded-full px-3 py-1.5 text-[10px] font-bold transition flex-shrink-0"
              >
                📦 Track My Order
              </button>
              <button
                onClick={() => handleQuickQuery('Does the Vanguard Gaming Laptop support React development?')}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 hover:text-emerald-700 rounded-full px-3 py-1.5 text-[10px] font-bold transition flex-shrink-0"
              >
                🔍 Product Q&amp;A
              </button>
              <button
                onClick={() => handleQuickQuery('I need a phone under ₹20,000')}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 rounded-full px-3 py-1.5 text-[10px] font-bold transition flex-shrink-0"
              >
                📱 Phones under ₹20K
              </button>
              <button
                onClick={() => handleQuickQuery('I have ₹50,000 for a gaming setup')}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 rounded-full px-3 py-1.5 text-[10px] font-bold transition flex-shrink-0"
              >
                🎮 Gaming Budget
              </button>
              <button
                onClick={() => handleQuickQuery('Show me premium headphones')}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 rounded-full px-3 py-1.5 text-[10px] font-bold transition flex-shrink-0"
              >
                🎧 Headphones
              </button>
            </div>

            {/* Footer input form */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Ask me for product recommendations..."
                disabled={isTyping}
                className="flex-1 input-field !py-3 !px-4 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs"
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl flex items-center justify-center transition disabled:opacity-40 disabled:hover:bg-blue-600 shadow-md shadow-blue-500/10 flex-shrink-0"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
