import React from 'react';

export const Card = ({ children }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">{children}</div>
);

export const Button = ({ children, className = '', ...props }) => (
  <button {...props} className={`bg-blue-600 text-white rounded-md px-3 py-2 hover:bg-blue-700 disabled:opacity-50 ${className}`}>{children}</button>
);

export const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
  </svg>
);

export const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-4">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        {children}
      </div>
    </div>
  );
};



