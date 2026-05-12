import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineClipboardCheck, HiOutlinePaperClip, HiMenuAlt2, HiOutlinePencil } from 'react-icons/hi';

const KanbanCard = ({ card, index, onClick }) => {
  const priorityColors = {
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  const completedSubtasks = card.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = card.subtasks?.length || 0;
  const progressPercent = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  const attachmentsCount = card.attachments?.length || 0;

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div 
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          onClick={onClick}
          className={`glass p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing group ${
            snapshot.isDragging 
              ? 'shadow-2xl border-primary-500 ring-1 ring-primary-500 scale-105 z-50' 
              : 'border-slate-800 hover:border-slate-600'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-bold text-slate-100 leading-tight group-hover:text-white transition-colors">
              {card.title}
            </h4>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <HiOutlinePencil size={14} className="text-slate-500 hover:text-primary-400" />
            </div>
          </div>
          
          <p className="text-xs text-slate-400 mb-4 line-clamp-1">
            {card.description}
          </p>

          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            {card.description && (
              <div className="flex items-center gap-1">
                <HiMenuAlt2 size={14} />
              </div>
            )}
            
            {attachmentsCount > 0 && (
              <div className="flex items-center gap-1">
                <HiOutlinePaperClip size={14} />
                <span>{attachmentsCount}</span>
              </div>
            )}

            {totalSubtasks > 0 && (
              <div className="flex items-center gap-1">
                <HiOutlineClipboardCheck size={14} className={progressPercent === 100 ? 'text-emerald-400' : ''} />
                <span>{completedSubtasks}/{totalSubtasks}</span>
              </div>
            )}
          </div>

          {totalSubtasks > 0 && (
            <div className="mt-3 h-1 w-full bg-slate-800/50 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
