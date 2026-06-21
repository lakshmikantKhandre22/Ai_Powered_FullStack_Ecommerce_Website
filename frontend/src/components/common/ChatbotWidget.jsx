import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles, AlertCircle, ShoppingBag, Star, RefreshCw } from 'lucide-react';
import { useSelector } from 'react-redux';
import API from '../../services/api.js';

const ChatbotWidget = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [isOpen, setIsOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Greetings! I am your **ShopSphere AI Concierge**. 🛍️\n\nI have real-time access to our database. Ask me to search products, suggest budget packages, compare items, or check stock availability!',
      createdAt: new Date(),
      products: [],
      suggestions: ['Show gaming laptops', 'Phone under ₹30,000', 'Organic skincare']
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState(['Show gaming laptops', 'Phone under ₹30,000', 'Organic skincare']);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of the feed
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Fetch user persisted chat history when authenticated user changes/logs in
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsTyping(true);
        const response = await API.get('/chat/history');
        if (response.data && response.data.messages) {
          if (response.data.messages.length > 0) {
            setMessages(response.data.messages);
            // Grab the last AI message to restore suggestions
            const lastAi = [...response.data.messages].reverse().find(m => m.sender === 'ai');
            if (lastAi && lastAi.suggestions && lastAi.suggestions.length > 0) {
              setActiveSuggestions(lastAi.suggestions);
            } else {
              setActiveSuggestions(['Show gaming laptops', 'Phone under ₹30,000', 'Organic skincare']);
            }
          } else {
            resetToWelcomeMessage();
          }
        }
        setIsTyping(false);
      } catch (err) {
        console.warn('Failed to load persisted chat history:', err);
        setIsTyping(false);
        resetToWelcomeMessage();
      }
    };

    if (isAuthenticated) {
      fetchHistory();
    } else {
      resetToWelcomeMessage();
    }
  }, [isAuthenticated, user]);

  const resetToWelcomeMessage = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: 'Greetings! I am your **ShopSphere AI Concierge**. 🛍️\n\nI have real-time access to our database. Ask me to search products, suggest budget packages, compare items, or check stock availability!',
        createdAt: new Date(),
        products: [],
        suggestions: ['Show gaming laptops', 'Phone under ₹30,000', 'Organic skincare']
      }
    ]);
    setActiveSuggestions(['Show gaming laptops', 'Phone under ₹30,000', 'Organic skincare']);
  };

  const handleClearHistory = async () => {
    if (isTyping) return;
    try {
      setIsTyping(true);
      await API.post('/chat/clear');
      resetToWelcomeMessage();
      setIsTyping(false);
    } catch (err) {
      console.error('Failed to clear chat history:', err);
      setIsTyping(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || isTyping) return;
    const text = messageInput;
    setMessageInput('');
    await sendMessage(text);
  };

  const handleSuggestionClick = async (suggestionText) => {
    if (isTyping) return;
    await sendMessage(suggestionText);
  };

  const sendMessage = async (userText) => {
    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userText,
      createdAt: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setActiveSuggestions([]); // Clear suggestions during query

    try {
      // Gather context of the last 10 messages
      const historyContext = messages
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text
        }));

      const response = await API.post('/chat', {
        message: userText,
        history: historyContext
      });

      if (response.data) {
        const { reply, products, suggestions } = response.data;

        // Add placeholder message for typewriter simulation
        const aiMsgId = `ai_${Date.now()}`;
        const finalAiMsg = {
          id: aiMsgId,
          sender: 'ai',
          text: '',
          fullText: reply,
          products: products || [],
          suggestions: suggestions || [],
          createdAt: new Date(),
          isTyping: true
        };

        setMessages((prev) => [...prev, finalAiMsg]);
        setIsTyping(false);

        // Run typewriter stream effect
        simulateTypewriter(aiMsgId, reply, suggestions);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'ai',
          text: 'Oops! I had trouble connecting to the catalog server. Please verify your connection and try again.',
          createdAt: new Date(),
          products: []
        }
      ]);
      setIsTyping(false);
      setActiveSuggestions(['Try again', 'Show electronics']);
    }
  };

  const simulateTypewriter = (messageId, fullText, suggestions) => {
    let currentIdx = 0;
    const words = fullText.split(' ');
    let currentText = '';
    
    const interval = setInterval(() => {
      if (currentIdx < words.length) {
        currentText += (currentIdx === 0 ? '' : ' ') + words[currentIdx];
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, text: currentText } : m
          )
        );
        currentIdx++;
      } else {
        clearInterval(interval);
        // Mark typing finished
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, isTyping: false } : m
          )
        );
        if (suggestions && suggestions.length > 0) {
          setActiveSuggestions(suggestions);
        }
      }
    }, 45); // Speed multiplier
  };

  // Convert custom bold markdown and inline details links
  const renderMessageText = (text) => {
    // Replace product detail routes: [anchor](/product/id)
    const parts = text.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, idx) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const [_, anchor, path] = match;
        const isProductPath = path.startsWith('/product/');
        if (isProductPath) {
          return (
            <Link
              key={idx}
              to={path}
              onClick={() => setIsOpen(false)}
              className="inline-block font-extrabold text-blue-600 hover:text-blue-800 underline bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-all text-xs my-0.5"
            >
              {anchor}
            </Link>
          );
        }
        return (
          <a
            key={idx}
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-bold"
          >
            {anchor}
          </a>
        );
      }

      // Convert standard markdown bold and lists
      const htmlText = part
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^•\s+(.*?)$/gm, '<li>$1</li>')
        .replace(/\n/g, '<br />');

      return (
        <span
          key={idx}
          dangerouslySetInnerHTML={{ __html: htmlText }}
          className="leading-relaxed whitespace-pre-line"
        />
      );
    });
  };

  return (
    <>
      {/* FLOAT BUTTON TRIGGER */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center border border-white/20 hover:shadow-indigo-500/30"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
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
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border border-white animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* CHAT WINDOW DIALOG */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.92 }}
            className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-2rem)] h-[580px] bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Top header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 p-2 rounded-lg border border-white/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm tracking-wide leading-none">ShopSphere Assistant</h3>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-ping" />
                    <span className="text-[10px] text-blue-100 uppercase tracking-wider font-bold">AI Concierge Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    title="Start new chat"
                    className="p-1 hover:bg-white/10 rounded-md transition text-blue-100 hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-md transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/10'
                        : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                    }`}
                  >
                    {renderMessageText(msg.text)}
                  </div>

                  {/* Inline product recommendations list */}
                  {msg.products && msg.products.length > 0 && !msg.isTyping && (
                    <div className="w-full mt-2 flex gap-3 overflow-x-auto py-1 scrollbar-thin">
                      {msg.products.map((prod) => (
                        <div
                          key={prod._id}
                          className="bg-white border border-slate-100 rounded-xl p-2.5 w-40 flex-shrink-0 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                        >
                          <div>
                            {prod.images && prod.images[0] && (
                              <img
                                src={prod.images[0]}
                                alt={prod.title}
                                className="w-full h-20 object-cover rounded-lg mb-2"
                              />
                            )}
                            <h4 className="font-bold text-[10px] text-slate-800 line-clamp-2 leading-tight">
                              {prod.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-500">
                              <span className="font-semibold text-slate-600">{prod.brand}</span>
                              <div className="flex items-center text-amber-500 gap-0.5">
                                <Star className="h-2.5 w-2.5 fill-current" />
                                <span>{prod.ratings || 0}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                            <span className="font-black text-xs text-slate-900">
                              ₹{(prod.discountPrice > 0 ? prod.discountPrice : prod.price).toLocaleString('en-IN')}
                            </span>
                            <Link
                              to={`/product/${prod._id}`}
                              onClick={() => setIsOpen(false)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-1.5 rounded-lg transition"
                            >
                              <ShoppingBag className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator shimmer */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-2xl p-3 text-xs text-slate-400 flex items-center space-x-1.5 shadow-xs">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                    <span className="font-semibold">Reviewing catalogs...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Chips Area */}
            {activeSuggestions.length > 0 && (
              <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-none whitespace-nowrap">
                {activeSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(sug)}
                    className="bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 rounded-full px-3 py-1.5 text-[10px] font-bold transition flex-shrink-0"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Input Submission Footer Form */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Ask me for recommendations..."
                disabled={isTyping}
                className="flex-1 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl flex items-center justify-center transition disabled:opacity-40 disabled:hover:bg-blue-600 shadow-md shadow-blue-500/10 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
