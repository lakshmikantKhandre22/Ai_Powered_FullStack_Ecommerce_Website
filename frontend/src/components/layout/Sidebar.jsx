import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, FolderTree, ClipboardList, Users, ArrowLeft } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      name: 'Analytics Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Manage Products',
      path: '/admin/products',
      icon: ShoppingBag
    },
    {
      name: 'Manage Categories',
      path: '/admin/categories',
      icon: FolderTree
    },
    {
      name: 'Fulfill Orders',
      path: '/admin/orders',
      icon: ClipboardList
    },
    {
      name: 'Config Users',
      path: '/admin/users',
      icon: Users
    }
  ];

  return (
    <aside className="w-full md:w-64 bg-darkSlate-900 text-slate-400 flex flex-col border-r border-darkSlate-800 md:h-screen sticky top-0">
      {/* Brand & Return anchor */}
      <div className="p-6 border-b border-darkSlate-800 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-white font-display font-extrabold text-xl">
          <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            AdminSphere
          </span>
        </Link>
        
        <Link
          to="/"
          className="p-1.5 hover:bg-darkSlate-800 hover:text-white rounded-lg border border-darkSlate-800 transition"
          title="Return to Shop Storefront"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      {/* Admin Privilege tag */}
      <div className="px-6 py-4 border-b border-darkSlate-800/50 bg-darkSlate-950/20">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Privilege Tier</span>
        <span className="text-amber-500 text-xs font-bold font-display mt-0.5 block">Store Administrator</span>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-blue-500/20 font-semibold'
                  : 'hover:bg-darkSlate-800 hover:text-white text-slate-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Technical versioning details */}
      <div className="p-6 border-t border-darkSlate-800 text-[10px] text-darkSlate-600">
        <span>ShopSphere System v1.0.0</span>
      </div>
    </aside>
  );
};

export default Sidebar;
