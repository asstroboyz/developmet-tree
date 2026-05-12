import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';
import KanbanCard from './KanbanCard';

const KanbanColumn = ({ column, dragHandleProps, onAddCard, onCardClick, onDeleteColumn, onEditColumn }) => {
  return (
    <div className="flex flex-col w-[85vw] max-w-[320px] sm:max-w-none sm:w-72 sm:min-w-[18rem] shrink-0 h-full bg-slate-950/40 rounded-2xl p-3 border border-white/5">
      <div 
        {...dragHandleProps}
        className="flex items-center justify-between mb-4 px-1 cursor-grab active:cursor-grabbing group"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">
            {column.title}
          </h2>
          <span className="text-[10px] font-bold text-slate-600 bg-slate-900/50 px-1.5 py-0.5 rounded">
            {column.cards.length}
          </span>
        </div>
        <div className="flex items-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEditColumn(column)} className="text-slate-500 hover:text-blue-400 p-1.5 rounded-md hover:bg-slate-800 transition-all">
            <HiOutlinePencil size={14} />
          </button>
          <button onClick={() => onDeleteColumn(column.id)} className="text-slate-500 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800 transition-all">
            <HiOutlineTrash size={14} />
          </button>
        </div>
      </div>
      
      <Droppable droppableId={column.id} type="task">
        {(provided, snapshot) => (
          <div 
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar flex-grow min-h-[50px] transition-colors rounded-xl ${snapshot.isDraggingOver ? 'bg-white/5' : ''}`}
          >
            {column.cards.map((card, index) => (
              <KanbanCard 
                key={card.id} 
                card={card} 
                index={index} 
                onClick={() => onCardClick(card, column.id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <button 
        onClick={() => onAddCard(column.id)}
        className="mt-3 flex items-center gap-2 w-full p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all text-[11px] font-bold"
      >
        <HiOutlinePlus size={16} />
        <span>Add Card</span>
      </button>
    </div>
  );
};

export default KanbanColumn;
