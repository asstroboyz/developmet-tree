import React from 'react';
import { boards } from '../data/boards';
import BoardCard from '../components/board/BoardCard';
import { HiOutlinePlusCircle } from 'react-icons/hi';

const BoardListPage = () => {
  return (
    <div className="h-screen flex flex-col bg-[#0f172a] text-white overflow-hidden">
      <header className="p-8 pb-4 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-indigo-500 inline-block pb-2">
              Development Boards
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Monitoring progress development TI internal projects
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 transition-all font-bold text-sm shadow-lg shadow-primary-900/20">
            <HiOutlinePlusCircle size={20} />
            <span>New Board</span>
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto custom-scrollbar px-8 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
          
          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-600 hover:text-slate-500 hover:border-slate-700 transition-all cursor-pointer group">
            <HiOutlinePlusCircle size={40} className="mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Add via src/data/boards.js</span>
          </div>
        </div>
      </main>
      
      <footer className="shrink-0 p-6 border-t border-slate-800 bg-slate-900/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs gap-4">
          <p>&copy; 2026 Development TI. Built with React & Git-driven data.</p>
          <div className="flex gap-4">
            <span>v1.0.0</span>
            <span>•</span>
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BoardListPage;
