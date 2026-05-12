import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineTerminal, HiOutlineChartBar, HiOutlineClipboardList, HiOutlineGlobe } from 'react-icons/hi';

const iconMap = {
  terminal: HiOutlineTerminal,
  chart: HiOutlineChartBar,
  clipboard: HiOutlineClipboardList,
  globe: HiOutlineGlobe,
};

const BoardCard = ({ board }) => {
  const Icon = iconMap[board.icon] || HiOutlineTerminal;
  
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/5 hover:border-blue-500/50',
    emerald: 'from-emerald-500/20 to-emerald-600/5 hover:border-emerald-500/50',
    purple: 'from-purple-500/20 to-purple-600/5 hover:border-purple-500/50',
    rose: 'from-rose-500/20 to-rose-600/5 hover:border-rose-500/50',
  };

  const iconColorMap = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
    rose: 'text-rose-400',
  };

  return (
    <Link 
      to={`/board/${board.id}`}
      className={`glass group relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${colorMap[board.color] || colorMap.blue}`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-slate-800/50 ${iconColorMap[board.color] || iconColorMap.blue}`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-primary-300 transition-colors">
            {board.title}
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            {board.description}
          </p>
        </div>
      </div>
      
      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs font-medium px-2 py-1 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
          Static Config
        </span>
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] text-white">
              {String.fromCharCode(64 + i)}
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default BoardCard;
