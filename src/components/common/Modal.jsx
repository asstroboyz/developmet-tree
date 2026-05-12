import React from 'react';
import { HiOutlineX } from 'react-icons/hi';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative glass w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col">
        <header className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/50 backdrop-blur-md z-10">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <HiOutlineX size={20} />
          </button>
        </header>
        <div className="p-6 flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
