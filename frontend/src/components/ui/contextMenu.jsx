import React from "react";

export function ContextMenu({ children, items, onSelect }) {
  return (
    <div className="relative group">
      {children}
      <div className="hidden group-hover:block absolute right-0 top-0 bg-white shadow-lg rounded-md py-1 min-w-[160px] z-50">
        {items.map((item, index) => (
          <button
            key={index}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            onClick={() => onSelect(item.action)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
