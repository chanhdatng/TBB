import React from 'react';
import { X, FileText, Trash2, ArrowRight, Calendar } from 'lucide-react';

const DraftListModal = ({ isOpen, onClose, drafts, onSelectDraft, onDeleteDraft }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-300 ease-out max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Saved Drafts</h2>
                            <p className="text-sm text-gray-500">{drafts.length} drafts available</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* List */}
                <div className="p-6 overflow-y-auto flex-1">
                    {drafts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="font-medium">No drafts saved</p>
                            <p className="text-sm mt-1">Save a draft while creating an order to see it here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {drafts.map((draft) => (
                                <div key={draft.id} className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-primary/30 hover:shadow-md transition-all">
                                    <div className="min-w-0 flex-1 mr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 truncate">
                                                {draft.customer.name || 'Unknown Customer'}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                {draft.items.length} items
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500 truncate mb-1">
                                            {draft.customer.phone || 'No phone'} • {draft.customer.address || 'No address'}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <Calendar size={12} />
                                            Saved: {new Date(draft.savedAt).toLocaleString('vi-VN')}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onDeleteDraft(draft.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Draft"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => onSelectDraft(draft)}
                                            className="flex items-center gap-1 px-3 py-2 bg-primary hover:bg-primary-light text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                                        >
                                            Continue <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DraftListModal;
