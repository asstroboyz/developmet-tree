import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  HiOutlineArrowLeft, HiOutlineSearch, HiOutlineFilter, HiOutlineDotsHorizontal, 
  HiOutlineCalendar, HiOutlineClock, HiOutlinePlus, HiOutlineTrash, 
  HiOutlineCheckCircle, HiOutlineInbox, HiOutlineViewGrid, HiOutlineTag,
  HiOutlineUserGroup, HiOutlinePaperClip, HiOutlinePhotograph, HiOutlineChatAlt2,
  HiOutlineDocumentText, HiOutlineExclamation, HiMenuAlt2
} from 'react-icons/hi';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { developmentBoard } from '../data/development-board';
import KanbanColumn from '../components/board/KanbanColumn';
import Modal from '../components/common/Modal';

const BoardDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [isEditColumnModalOpen, setIsEditColumnModalOpen] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('border-blue-500');
  const [changeLog, setChangeLog] = useState([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [commitStatus, setCommitStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [deployCountdown, setDeployCountdown] = useState(0);
  const [commitError, setCommitError] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filterColumn, setFilterColumn] = useState('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const confirmAction = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };
  
  const [newCardData, setNewCardData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    storyPoints: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedCard) return;
    const readers = files.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve({ id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, type: file.type, url: reader.result, size: file.size });
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(attachments => {
      const updatedCards = board.columns.find(col => col.id === activeColumnId).cards.map(card => {
        if (card.id === selectedCard.id) {
          const updatedCard = { ...card, attachments: [...(card.attachments || []), ...attachments] };
          setSelectedCard(updatedCard);
          return updatedCard;
        }
        return card;
      });
      const newColumns = board.columns.map(col => col.id === activeColumnId ? { ...col, cards: updatedCards } : col);
      setBoard({ ...board, columns: newColumns });
      logChange('ADD_ATTACHMENT', `Added ${files.length} file(s) to "${selectedCard.title}"`);
    });
    e.target.value = '';
  };

  const exportBoardToCSV = () => {
    const headers = ['Task ID', 'Status Column', 'Title', 'Description', 'Priority', 'Story Points', 'Start Date', 'End Date'];
    let csvContent = headers.join(',') + '\n';

    board.columns.forEach(col => {
      col.cards.forEach(card => {
        const row = [
          card.id,
          `"${col.title}"`,
          `"${(card.title || '').replace(/"/g, '""')}"`,
          `"${(card.description || '').replace(/"/g, '""')}"`,
          card.priority || 'medium',
          card.storyPoints || '',
          card.startDate || '',
          card.endDate || ''
        ];
        csvContent += row.join(',') + '\n';
      });
    });

    return csvContent;
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      setCommitError('Commit message is required!');
      return;
    }
    setCommitStatus('loading');
    setCommitError('');
    try {
      const cleanBoard = JSON.parse(JSON.stringify(board));
      cleanBoard.columns.forEach(col => {
        col.cards.forEach(card => {
          if (card.attachments) {
            card.attachments = card.attachments.map(att => ({
              id: att.id, name: att.name, type: att.type, size: att.size
            }));
          }
        });
      });

      const res = await fetch('/api/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: board.id,
          data: cleanBoard,
          commitMessage: commitMessage
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Commit failed');

      setCommitStatus('success');
      setDeployCountdown(15);
      
      const interval = setInterval(() => {
        setDeployCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setChangeLog([]);
            setCommitStatus(null);
            setIsCommitModalOpen(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setCommitStatus('error');
      setCommitError(err.message);
    }
  };

  const logChange = (action, detail) => {
    setChangeLog(prev => [...prev, {
      id: Date.now(),
      action,
      detail,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const generateCommitMessage = (logs) => {
    if (!logs.length) return '';
    const actionMap = {
      ADD_CARD: 'add',
      ADD_COLUMN: 'add',
      ADD_COMMENT: 'comment',
      ADD_ATTACHMENT: 'attach',
      MOVE_CARD: 'move',
      MOVE_COLUMN: 'move',
      REORDER_CARD: 'reorder',
    };
    // Group by action type
    const counts = {};
    logs.forEach(log => {
      const prefix = actionMap[log.action] || 'update';
      counts[prefix] = (counts[prefix] || 0) + 1;
    });
    // Build message like: "add: 2 cards, move: 1 card"
    const parts = Object.entries(counts).map(([action, count]) => `${action}: ${count} change${count > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  const handleBack = () => {
    if (changeLog.length > 0) {
      setCommitMessage(generateCommitMessage(changeLog));
      setIsCommitModalOpen(true);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    if (id === 'development') {
      setBoard(JSON.parse(JSON.stringify(developmentBoard)));
    } else {
      setBoard({
        title: id.replace(/-/g, ' ').toUpperCase(),
        columns: [
          { id: 'todo', title: 'To Do', cards: [], color: 'border-blue-500' },
          { id: 'doing', title: 'In Progress', cards: [], color: 'border-amber-500' },
          { id: 'done', title: 'Done', cards: [], color: 'border-emerald-500' },
        ]
      });
    }
  }, [id]);

  const onDragEnd = (result) => {
    const { destination, source, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'column') {
      const newColumnOrder = Array.from(board.columns);
      const [removed] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, removed);
      setBoard({ ...board, columns: newColumnOrder });
      logChange('MOVE_COLUMN', `Moved column "${removed.title}" to position ${destination.index + 1}`);
      return;
    }

    const startColumn = board.columns.find(col => col.id === source.droppableId);
    const finishColumn = board.columns.find(col => col.id === destination.droppableId);

    if (startColumn === finishColumn) {
      const newCards = Array.from(startColumn.cards);
      const [removed] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, removed);
      const newColumns = board.columns.map(col => col.id === startColumn.id ? { ...col, cards: newCards } : col);
      setBoard({ ...board, columns: newColumns });
      logChange('REORDER_CARD', `Reordered "${removed.title}" in ${startColumn.title}`);
      return;
    }

    const startCards = Array.from(startColumn.cards);
    const [removed] = startCards.splice(source.index, 1);
    const finishCards = Array.from(finishColumn.cards);
    finishCards.splice(destination.index, 0, removed);
    const newColumns = board.columns.map(col => {
      if (col.id === startColumn.id) return { ...col, cards: startCards };
      if (col.id === finishColumn.id) return { ...col, cards: finishCards };
      return col;
    });
    setBoard({ ...board, columns: newColumns });
    logChange('MOVE_CARD', `Moved "${removed.title}" from ${startColumn.title} → ${finishColumn.title}`);
  };

  const updateCardDetail = (field, value) => {
    const updatedCards = board.columns.find(col => col.id === activeColumnId).cards.map(card => {
      if (card.id === selectedCard.id) {
        const updatedCard = { ...card, [field]: value };
        return updatedCard;
      }
      return card;
    });
    const newColumns = board.columns.map(col => col.id === activeColumnId ? { ...col, cards: updatedCards } : col);
    setBoard({ ...board, columns: newColumns });
    logChange('EDIT_CARD', `Updated ${field} for "${selectedCard.title}"`);
  };

  const deleteCard = () => {
    confirmAction(
      'Delete Card',
      `Are you sure you want to delete card "${selectedCard.title}"?`,
      () => {
        const column = board.columns.find(col => col.id === activeColumnId);
        const updatedCards = column.cards.filter(card => card.id !== selectedCard.id);
        const newColumns = board.columns.map(col => col.id === activeColumnId ? { ...col, cards: updatedCards } : col);
        setBoard({ ...board, columns: newColumns });
        logChange('DELETE_CARD', `Deleted card "${selectedCard.title}"`);
        setIsDetailModalOpen(false);
      }
    );
  };

  const handleEditColumn = (column) => {
    setEditingColumnId(column.id);
    setNewColumnTitle(column.title);
    setNewColumnColor(column.color);
    setIsEditColumnModalOpen(true);
  };

  const saveEditColumn = () => {
    if (!newColumnTitle.trim()) return;
    const newColumns = board.columns.map(col => {
      if (col.id === editingColumnId) {
        return { ...col, title: newColumnTitle, color: newColumnColor };
      }
      return col;
    });
    setBoard({ ...board, columns: newColumns });
    logChange('EDIT_COLUMN', `Updated column "${newColumnTitle}"`);
    setIsEditColumnModalOpen(false);
  };

  const handleDeleteColumn = (columnId) => {
    const colToDelete = board.columns.find(c => c.id === columnId);
    confirmAction(
      'Delete Column',
      `Are you sure you want to delete column "${colToDelete.title}" and all its cards?`,
      () => {
        const newColumns = board.columns.filter(col => col.id !== columnId);
        setBoard({ ...board, columns: newColumns });
        logChange('DELETE_COLUMN', `Deleted column "${colToDelete.title}"`);
      }
    );
  };

  const handleAddColumn = () => {
    setNewColumnTitle('');
    setNewColumnColor('border-blue-500');
    setIsAddColumnModalOpen(true);
  };

  const saveNewColumn = () => {
    if (!newColumnTitle.trim()) return;
    const newColumn = {
      id: newColumnTitle.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      title: newColumnTitle,
      cards: [],
      color: newColumnColor
    };
    setBoard({ ...board, columns: [...board.columns, newColumn] });
    logChange('ADD_COLUMN', `Added column "${newColumnTitle}"`);
    setIsAddColumnModalOpen(false);
  };

  const handleAddCard = (columnId) => {
    setActiveColumnId(columnId);
    setNewCardData({
      title: '',
      description: '',
      priority: 'medium',
      storyPoints: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });
    setIsAddModalOpen(true);
  };

  const saveNewCard = () => {
    if (!newCardData.title) return;
    const newCard = {
      ...newCardData,
      id: `task-${Date.now()}`,
      subtasks: [],
      comments: [],
      attachments: []
    };
    const newColumns = board.columns.map(col => col.id === activeColumnId ? { ...col, cards: [...col.cards, newCard] } : col);
    setBoard({ ...board, columns: newColumns });
    logChange('ADD_CARD', `Added card "${newCardData.title}" to ${activeColumnId}`);
    setIsAddModalOpen(false);
  };

  const handleCardClick = (card, columnId) => {
    setSelectedCard(card);
    setActiveColumnId(columnId);
    setIsDetailModalOpen(true);
  };

  const addComment = () => {
    if (!commentText) return;
    const newComment = {
      id: `c-${Date.now()}`,
      user: 'Ganda',
      text: commentText,
      time: 'just now'
    };
    const updatedCards = board.columns.find(col => col.id === activeColumnId).cards.map(card => {
      if (card.id === selectedCard.id) {
        const updatedCard = { ...card, comments: [newComment, ...(card.comments || [])] };
        setSelectedCard(updatedCard);
        return updatedCard;
      }
      return card;
    });
    const newColumns = board.columns.map(col => col.id === activeColumnId ? { ...col, cards: updatedCards } : col);
    setBoard({ ...board, columns: newColumns });
    logChange('ADD_COMMENT', `Comment on "${selectedCard.title}": ${commentText.substring(0, 40)}...`);
    setCommentText('');
  };

  const getFilteredBoard = () => {
    if (!board) return null;
    const newBoard = { ...board };

    let columnsToProcess = newBoard.columns;
    if (filterColumn !== 'all') {
      columnsToProcess = columnsToProcess.filter(col => col.id === filterColumn);
    }

    newBoard.columns = columnsToProcess.map(col => {
      let filteredCards = col.cards;
      if (searchQuery) {
        filteredCards = filteredCards.filter(card => 
          card.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (card.description && card.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      return { ...col, cards: filteredCards };
    });
    return newBoard;
  };

  if (!board) return <div className="h-[100dvh] bg-[#0f172a] flex items-center justify-center text-white">Loading...</div>;

  const filteredBoard = getFilteredBoard();

  return (
    <div className="h-[100dvh] flex flex-col bg-board text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"></div>

      {/* Header */}
      <header className="p-4 flex items-center justify-between sticky top-0 z-10 shrink-0 relative">
        <div className="flex items-center gap-2 sm:gap-6">
          <button onClick={handleBack} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-300 hover:text-white shrink-0">
            <HiOutlineArrowLeft size={20} />
          </button>
          <h1 className="text-sm sm:text-lg font-black tracking-tight uppercase truncate max-w-[100px] sm:max-w-none">{board.title}</h1>
          {changeLog.length > 0 && (
            <button
              onClick={() => { setCommitMessage(''); setIsCommitModalOpen(true); }}
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-bold animate-pulse shrink-0"
            >
              <HiOutlineDocumentText size={14} />
              <span className="hidden sm:inline">{changeLog.length} unsaved changes</span>
              <span className="sm:hidden">{changeLog.length}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {isSearchOpen ? (
            <div className="flex items-center bg-slate-800 sm:bg-slate-800/50 rounded-lg px-2 sm:px-3 py-1.5 border border-white/10 absolute right-4 z-50 sm:static shadow-2xl sm:shadow-none">
              <HiOutlineSearch size={16} className="text-slate-400 mr-2 shrink-0" />
              <input 
                type="text" 
                autoFocus
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white text-sm focus:outline-none w-32 sm:w-48"
              />
              <button onClick={() => {setIsSearchOpen(false); setSearchQuery('');}} className="text-slate-500 hover:text-white ml-2 shrink-0">✕</button>
            </div>
          ) : (
            <button onClick={() => setIsSearchOpen(true)} className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all shrink-0">
              <HiOutlineSearch size={20} />
            </button>
          )}

          <div className="relative">
            <button onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`p-2 rounded-lg transition-all ${filterColumn !== 'all' ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`}>
              <HiOutlineFilter size={20} />
            </button>
            {isFilterMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                <div className="text-xs font-bold text-slate-400 mb-2 px-2 uppercase tracking-wider">Filter Column</div>
                <button 
                  onClick={() => { setFilterColumn('all'); setIsFilterMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all ${filterColumn === 'all' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  All Columns
                </button>
                {board.columns.map(col => (
                  <button 
                    key={col.id}
                    onClick={() => { setFilterColumn(col.id); setIsFilterMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all ${filterColumn === col.id ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-white/5'}`}
                  >
                    {col.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => setIsBoardMenuOpen(!isBoardMenuOpen)} className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all">
              <HiOutlineDotsHorizontal size={20} />
            </button>
            {isBoardMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                <div className="text-xs font-bold text-slate-400 mb-2 px-2 uppercase tracking-wider">Board Options</div>
                <button 
                  onClick={() => {
                    const csv = exportBoardToCSV();
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${(board.title || 'board').replace(/\s+/g, '-')}-export.csv`;
                    a.click();
                    setIsBoardMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-all"
                >
                  <HiOutlineDocumentText size={16} /> Export to CSV (Excel)
                </button>
                <button 
                  onClick={() => {
                    confirmAction(
                      'Clear All Cards',
                      'Are you sure you want to clear all cards? This cannot be undone.',
                      () => {
                        const newColumns = board.columns.map(col => ({...col, cards: []}));
                        setBoard({...board, columns: newColumns});
                        logChange('CLEAR_BOARD', 'Cleared all cards from board');
                      }
                    );
                    setIsBoardMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  <HiOutlineTrash size={16} /> Clear All Cards
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Board Content */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="column">
          {(provided) => (
            <main 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex-grow overflow-x-auto p-4 flex gap-4 items-start custom-scrollbar h-full relative"
            >
              {filteredBoard.columns.map((column, index) => (
                <Draggable key={column.id} draggableId={column.id} index={index}>
                  {(provided) => (
                    <div {...provided.draggableProps} ref={provided.innerRef} className="h-full">
                      <KanbanColumn 
                        column={column} 
                        dragHandleProps={provided.dragHandleProps} 
                        onAddCard={handleAddCard}
                        onCardClick={handleCardClick}
                        onDeleteColumn={handleDeleteColumn}
                        onEditColumn={handleEditColumn}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <button 
                onClick={handleAddColumn}
                className="min-w-[18rem] h-12 border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all group shrink-0"
              >
                <span className="text-xs font-bold uppercase tracking-widest">+ Add Column</span>
              </button>
            </main>
          )}
        </Droppable>
      </DragDropContext>



      {/* Detail Modal (Trello Style) */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Task in ${activeColumnId?.replace('-', ' ')}`}>
        {selectedCard && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Content */}
            <div className="flex-grow space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-5 h-5 border-2 border-slate-500 rounded-full shrink-0"></div>
                  <input 
                    type="text"
                    value={selectedCard.title}
                    onChange={(e) => setSelectedCard({...selectedCard, title: e.target.value})}
                    onBlur={(e) => {
                      if (e.target.value && e.target.value !== board.columns.find(c => c.id === activeColumnId).cards.find(c => c.id === selectedCard.id).title) {
                        updateCardDetail('title', e.target.value);
                      }
                    }}
                    className="text-2xl font-bold text-white bg-transparent border border-transparent focus:border-white/20 focus:bg-white/5 hover:bg-white/5 rounded px-2 py-1 w-full transition-all"
                  />
                  <button onClick={deleteCard} className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-bold text-rose-400 transition-all ml-auto shrink-0">
                    <HiOutlineTrash size={14} /> Delete
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <button onClick={() => setShowAddMenu(!showAddMenu)} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-xs font-bold transition-all">
                      <HiOutlinePlus size={14} /> Add
                    </button>
                    {showAddMenu && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                        <div className="flex justify-between items-center px-3 py-2 mb-1">
                          <span className="text-xs font-bold text-slate-300">Add to card</span>
                          <button onClick={() => setShowAddMenu(false)} className="text-slate-500 hover:text-white">✕</button>
                        </div>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left">
                          <HiOutlineTag size={18} className="text-slate-400" />
                          <div><div className="text-sm font-bold">Labels</div><div className="text-[10px] text-slate-500">Organize, categorize, and prioritize</div></div>
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left">
                          <HiOutlineCalendar size={18} className="text-slate-400" />
                          <div><div className="text-sm font-bold">Dates</div><div className="text-[10px] text-slate-500">Start dates, due dates, and reminders</div></div>
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left">
                          <HiOutlineCheckCircle size={18} className="text-slate-400" />
                          <div><div className="text-sm font-bold">Checklist</div><div className="text-[10px] text-slate-500">Add subtasks</div></div>
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left">
                          <HiOutlineUserGroup size={18} className="text-slate-400" />
                          <div><div className="text-sm font-bold">Members</div><div className="text-[10px] text-slate-500">Assign members</div></div>
                        </button>
                        <button onClick={() => { fileInputRef.current?.click(); setShowAddMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left">
                          <HiOutlinePaperClip size={18} className="text-slate-400" />
                          <div><div className="text-sm font-bold">Attachment</div><div className="text-[10px] text-slate-500">Add links, photos, work items and more</div></div>
                        </button>
                      </div>
                    )}
                  </div>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold transition-all">
                    <HiOutlineTag size={14} /> Labels
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold transition-all">
                    <HiOutlineCalendar size={14} /> Dates
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold transition-all">
                    <HiOutlineCheckCircle size={14} /> Checklist
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold transition-all">
                    <HiOutlineUserGroup size={14} /> Members
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Story Points</h4>
                <div className="w-10 h-10 bg-white/5 border border-white/5 rounded-lg flex items-center justify-center font-bold text-slate-300">
                  {selectedCard.storyPoints || '-'}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-3 mb-4">
                  <HiMenuAlt2 className="text-slate-500" size={20} />
                  Description
                </h4>
                <textarea 
                  value={selectedCard.description || ''}
                  onChange={(e) => setSelectedCard({...selectedCard, description: e.target.value})}
                  onBlur={(e) => {
                    if (e.target.value !== board.columns.find(c => c.id === activeColumnId).cards.find(c => c.id === selectedCard.id).description) {
                      updateCardDetail('description', e.target.value);
                    }
                  }}
                  placeholder="Add a more detailed description..."
                  className="w-full bg-white/5 border border-transparent focus:border-white/10 rounded-xl p-4 text-sm text-slate-300 h-32 resize-none transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Attachments */}
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-3 mb-4">
                  <HiOutlinePaperClip className="text-slate-500" size={20} />
                  Attachments
                  <span className="text-[10px] text-slate-500 font-normal">({selectedCard.attachments?.length || 0})</span>
                </h4>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedCard.attachments?.map(att => (
                    <div key={att.id} className="relative group rounded-xl overflow-hidden border border-white/5">
                      {att.type?.startsWith('image/') ? (
                        <img src={att.url} alt={att.name} className="w-full aspect-video object-cover" />
                      ) : (
                        <div className="w-full aspect-video bg-white/5 flex items-center justify-center">
                          <HiOutlineDocumentText size={32} className="text-slate-500" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <span className="text-[10px] text-white font-bold truncate block">{att.name}</span>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-white/30 transition-all group">
                    <HiOutlinePhotograph size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold">Add File</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side (Comments & Activity) */}
            <div className="w-full lg:w-80 shrink-0 space-y-8 border-t lg:border-t-0 lg:border-l border-white/5 pt-8 lg:pt-0 lg:pl-8">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-3 mb-6">
                  <HiOutlineChatAlt2 className="text-slate-500" size={20} />
                  Comments and activity
                </h4>
                
                <div className="flex gap-3 mb-8">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center font-bold text-xs shrink-0">G</div>
                  <div className="flex-grow space-y-2">
                    <textarea 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white h-20 resize-none focus:outline-none focus:bg-white/10 transition-all"
                    />
                    {commentText && (
                      <button 
                        onClick={addComment}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-all"
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedCard.comments?.map(comment => (
                    <div key={comment.id} className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs shrink-0">{comment.user[0]}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white">{comment.user}</span>
                          <span className="text-[10px] text-slate-500">{comment.time}</span>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none text-xs text-slate-300">
                          {comment.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3 items-center text-[11px] text-slate-500 italic px-1">
                    <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-xs shrink-0">👤</div>
                    <span>Ganda added this card to {activeColumnId?.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Card Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Task">
        <div className="space-y-4">
          <input 
            type="text" 
            value={newCardData.title}
            onChange={(e) => setNewCardData({...newCardData, title: e.target.value})}
            placeholder="What needs to be done?"
            className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all text-sm"
          />
          <div className="grid grid-cols-2 gap-4">
            <select 
              value={newCardData.priority}
              onChange={(e) => setNewCardData({...newCardData, priority: e.target.value})}
              className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 px-4 text-white text-sm"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input 
              type="number" 
              value={newCardData.storyPoints}
              onChange={(e) => setNewCardData({...newCardData, storyPoints: e.target.value})}
              placeholder="Points"
              className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 px-4 text-white text-sm"
            />
          </div>
          <textarea 
            value={newCardData.description}
            onChange={(e) => setNewCardData({...newCardData, description: e.target.value})}
            placeholder="Add a description..."
            className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all h-32 resize-none text-sm"
          />
          <button onClick={saveNewCard} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/40">Create Card</button>
        </div>
      </Modal>

      {/* Add Column Modal */}
      <Modal isOpen={isAddColumnModalOpen} onClose={() => setIsAddColumnModalOpen(false)} title="Add New Column">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Column Title *</label>
            <input 
              type="text" 
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="e.g. Testing, Review, Backlog..."
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all text-sm"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveNewColumn()}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Column Color</label>
            <div className="flex flex-wrap gap-3">
              {[
                { color: 'border-blue-500', label: 'Blue', bg: 'bg-blue-500' },
                { color: 'border-amber-500', label: 'Amber', bg: 'bg-amber-500' },
                { color: 'border-purple-500', label: 'Purple', bg: 'bg-purple-500' },
                { color: 'border-emerald-500', label: 'Green', bg: 'bg-emerald-500' },
                { color: 'border-rose-500', label: 'Red', bg: 'bg-rose-500' },
                { color: 'border-indigo-500', label: 'Indigo', bg: 'bg-indigo-500' },
                { color: 'border-cyan-500', label: 'Cyan', bg: 'bg-cyan-500' },
                { color: 'border-pink-500', label: 'Pink', bg: 'bg-pink-500' },
              ].map(opt => (
                <button
                  key={opt.color}
                  onClick={() => setNewColumnColor(opt.color)}
                  className={`w-8 h-8 rounded-full ${opt.bg} transition-all ${
                    newColumnColor === opt.color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={opt.label}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setIsAddColumnModalOpen(false)} 
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all border border-white/5"
            >
              Cancel
            </button>
            <button 
              onClick={saveNewColumn} 
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/40"
            >
              Create Column
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Column Modal */}
      <Modal isOpen={isEditColumnModalOpen} onClose={() => setIsEditColumnModalOpen(false)} title="Edit Column">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Column Title *</label>
            <input 
              type="text" 
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="e.g. Testing, Review, Backlog..."
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all text-sm"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveEditColumn()}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Column Color</label>
            <div className="flex flex-wrap gap-3">
              {[
                { color: 'border-blue-500', label: 'Blue', bg: 'bg-blue-500' },
                { color: 'border-amber-500', label: 'Amber', bg: 'bg-amber-500' },
                { color: 'border-purple-500', label: 'Purple', bg: 'bg-purple-500' },
                { color: 'border-emerald-500', label: 'Green', bg: 'bg-emerald-500' },
                { color: 'border-rose-500', label: 'Red', bg: 'bg-rose-500' },
                { color: 'border-indigo-500', label: 'Indigo', bg: 'bg-indigo-500' },
                { color: 'border-cyan-500', label: 'Cyan', bg: 'bg-cyan-500' },
                { color: 'border-pink-500', label: 'Pink', bg: 'bg-pink-500' },
              ].map(opt => (
                <button
                  key={opt.color}
                  onClick={() => setNewColumnColor(opt.color)}
                  className={`w-8 h-8 rounded-full ${opt.bg} transition-all ${
                    newColumnColor === opt.color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={opt.label}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setIsEditColumnModalOpen(false)} 
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all border border-white/5"
            >
              Cancel
            </button>
            <button 
              onClick={saveEditColumn} 
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/40"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Commit Confirmation Modal */}
      <Modal isOpen={isCommitModalOpen} onClose={() => {}} title="Unsaved Changes">
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <HiOutlineExclamation size={24} className="text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200">You have <strong>{changeLog.length}</strong> unsaved change(s). Review and commit or discard before leaving.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Change Log</label>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              {changeLog.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-2 bg-white/5 rounded-lg text-xs">
                  <span className="text-slate-500 shrink-0 w-12">{log.time}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded shrink-0">{log.action}</span>
                  <span className="text-slate-300">{log.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Commit Message</label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="e.g. Added new tasks to Planning column"
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setChangeLog([]); setIsCommitModalOpen(false); setCommitStatus(null); navigate('/'); }}
              className="flex-1 py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 font-bold rounded-xl transition-all border border-rose-500/20"
              disabled={commitStatus === 'loading'}
            >
              Discard & Leave
            </button>
            <button
              onClick={() => { setIsCommitModalOpen(false); setCommitStatus(null); }}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all border border-white/5"
              disabled={commitStatus === 'loading'}
            >
              Continue Editing
            </button>
            <button
              onClick={handleCommit}
              disabled={commitStatus === 'loading' || commitStatus === 'success'}
              className={`flex-1 py-3 font-bold rounded-xl transition-all shadow-lg ${
                commitStatus === 'success' 
                  ? 'bg-emerald-500 text-white' 
                  : commitStatus === 'loading'
                    ? 'bg-slate-700 text-slate-400 cursor-wait'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
              }`}
            >
              {commitStatus === 'loading' 
                ? '⏳ Committing...' 
                : commitStatus === 'success' 
                  ? `✅ Deploying... (${deployCountdown}s)` 
                  : '🚀 Commit & Push'}
            </button>
          </div>

          {commitError && (
            <p className="text-xs text-rose-400 text-center bg-rose-500/10 p-2 rounded-lg">{commitError}</p>
          )}
          {commitStatus === 'success' && (
            <p className="text-xs text-emerald-400 text-center bg-emerald-500/10 p-2 rounded-lg">✅ File saved & pushed to <strong>origin/main</strong> successfully!</p>
          )}

          <p className="text-[10px] text-slate-600 text-center">Commits to <code className="text-slate-400">origin/main</code> at <code className="text-slate-400">github.com/asstroboyz/developmet-tree</code></p>
        </div>
      </Modal>

      {/* Unified Confirm Modal */}
      <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} title={confirmModal.title}>
        <div className="space-y-6">
          <p className="text-slate-300 text-sm">{confirmModal.message}</p>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all border border-white/5"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (confirmModal.onConfirm) confirmModal.onConfirm();
                setConfirmModal({ ...confirmModal, isOpen: false });
              }}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-900/40"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BoardDetailPage;
