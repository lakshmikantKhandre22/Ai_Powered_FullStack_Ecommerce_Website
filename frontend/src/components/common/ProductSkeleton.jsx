import React from 'react';

const ProductSkeleton = () => {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden flex flex-col h-full shadow-sm">
      {/* Thumbnail shimmer */}
      <div className="pt-[100%] shimmer-bg relative" />
      
      {/* Body details shimmer */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Brand line */}
          <div className="h-3 w-16 rounded shimmer-bg" />
          {/* Title block */}
          <div className="h-4.5 w-full rounded shimmer-bg" />
          <div className="h-4.5 w-3/4 rounded shimmer-bg" />
          {/* Stars line */}
          <div className="h-3.5 w-24 rounded shimmer-bg mt-2" />
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-2">
          <div className="space-y-1">
            <div className="h-5 w-16 rounded shimmer-bg" />
          </div>
          <div className="h-10 w-10 rounded-xl shimmer-bg" />
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;
