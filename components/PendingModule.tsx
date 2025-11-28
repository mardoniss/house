import React, { useState, useEffect } from 'react';
import { PendingItem, Priority, PendingStatus, ViewState } from '../types';
import { Camera, MapPin, Calendar, User, Filter, AlertTriangle, CheckCircle, Clock, XCircle, Plus, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { analyzeConstructionImage } from '../services/geminiService';

interface PendingModuleProps {
  items: PendingItem[];
  setItems: React.Dispatch<React.SetStateAction<PendingItem[]>>;
  setView: React.Dispatch<React.SetStateAction<ViewState>>;
  view: ViewState;
  prefillFromDelivery?: { description: string };
}

export const PendingModule: React.FC<PendingModuleProps> = ({ items, setItems, setView, view, prefillFromDelivery }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loadingAI, setLoadingAI] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<PendingItem>>({
    priority: Priority.MEDIUM,
    status: PendingStatus.OPEN,
    photos: []
  });

  useEffect(() => {
    if (prefillFromDelivery) {
      setFormData(prev => ({
        ...prev,
        title: "Problema na Entrega",
        description: prefillFromDelivery.description,
        priority: Priority.HIGH
      }));
    }
  }, [prefillFromDelivery]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, photos: [base64] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIAnalysis = async () => {
    if (formData.photos && formData.photos.length > 0) {
      setLoadingAI(true);
      try {
        const result = await analyzeConstructionImage(formData.photos[0]);
        if (result) {
          setFormData(prev => ({
            ...prev,
            title: result.title,
            description: result.description,
            priority: result.priority as Priority
          }));
        }
      } catch (error) {
        alert("Não foi possível analisar a imagem. Verifique sua conexão.");
      } finally {
        setLoadingAI(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: PendingItem = {
      id: Date.now().toString(),
      title: formData.title!,
      description: formData.description!,
      priority: formData.priority as Priority,
      responsible: formData.responsible || 'Não atribuído',
      deadline: formData.deadline || new Date().toISOString().split('T')[0],
      location: formData.location || 'Geral',
      photos: formData.photos || [],
      status: PendingStatus.OPEN,
      createdAt: Date.now()
    };
    setItems(prev => [newItem, ...prev]);
    setView('PENDING_LIST');
    setFormData({ priority: Priority.MEDIUM, status: PendingStatus.OPEN, photos: [] });
  };

  const updateStatus = (id: string, newStatus: PendingStatus) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.HIGH: return 'text-red-600 bg-red-100 border-red-200';
      case Priority.MEDIUM: return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case Priority.LOW: return 'text-green-600 bg-green-100 border-green-200';
    }
  };

  const getStatusColor = (s: PendingStatus) => {
    switch (s) {
      case PendingStatus.OPEN: return 'bg-gray-100 text-gray-700';
      case PendingStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700';
      case PendingStatus.WAITING_APPROVAL: return 'bg-purple-100 text-purple-700';
      case PendingStatus.RESOLVED: return 'bg-green-100 text-green-700';
      case PendingStatus.REJECTED: return 'bg-red-100 text-red-700';
    }
  };

  // List View
  if (view === 'PENDING_LIST') {
    const filteredItems = items
      .filter(i => filterStatus === 'ALL' || i.status === filterStatus)
      .sort((a, b) => {
        // Sort by Priority (High first) then Date
        const priorityOrder = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });

    return (
      <div className="space-y-4 pb-20">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-gray-800">Pendências</h2>
          <Button onClick={() => setView('PENDING_FORM')} className="!py-2 !px-3 text-sm">
            <Plus size={18} className="mr-1" /> Nova
          </Button>
        </div>

        {/* Filters */}
        <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
          {['ALL', ...Object.values(PendingStatus)].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                filterStatus === status 
                ? 'bg-brand-600 text-white border-brand-600' 
                : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {status === 'ALL' ? 'Todos' : status}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>Nenhuma pendência encontrada.</p>
            </div>
          ) : filteredItems.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getPriorityColor(item.priority)}`}>
                  {item.priority}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>
              
              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
              
              <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500 mb-3">
                <div className="flex items-center"><User size={12} className="mr-1"/> {item.responsible}</div>
                <div className="flex items-center"><Calendar size={12} className="mr-1"/> {new Date(item.deadline).toLocaleDateString()}</div>
                <div className="flex items-center col-span-2"><MapPin size={12} className="mr-1"/> {item.location}</div>
              </div>

              {/* Action Buttons based on status */}
              <div className="flex gap-2 pt-2 border-t border-gray-50 mt-2">
                {item.status === PendingStatus.OPEN && (
                  <button onClick={() => updateStatus(item.id, PendingStatus.IN_PROGRESS)} className="flex-1 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded hover:bg-blue-100">
                    Iniciar
                  </button>
                )}
                {item.status === PendingStatus.IN_PROGRESS && (
                  <button onClick={() => updateStatus(item.id, PendingStatus.WAITING_APPROVAL)} className="flex-1 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 rounded hover:bg-purple-100">
                    Concluir
                  </button>
                )}
                {item.status === PendingStatus.WAITING_APPROVAL && (
                  <>
                    <button onClick={() => updateStatus(item.id, PendingStatus.RESOLVED)} className="flex-1 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded hover:bg-green-100">
                      Aprovar
                    </button>
                    <button onClick={() => updateStatus(item.id, PendingStatus.REJECTED)} className="flex-1 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded hover:bg-red-100">
                      Rejeitar
                    </button>
                  </>
                )}
                {item.status === PendingStatus.REJECTED && (
                  <button onClick={() => updateStatus(item.id, PendingStatus.IN_PROGRESS)} className="flex-1 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded hover:bg-blue-100">
                    Reiniciar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div className="pb-20">
      <div className="flex items-center mb-4">
        <button onClick={() => setView('PENDING_LIST')} className="mr-2 text-gray-500">
          <XCircle />
        </button>
        <h2 className="text-xl font-bold">Nova Pendência</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Photo Upload First - for AI */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Evidência (Foto)</label>
          <div className="flex gap-2 items-center">
            <label className="flex-1 cursor-pointer flex flex-col items-center justify-center h-32 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 bg-white">
              {formData.photos && formData.photos.length > 0 ? (
                <img src={formData.photos[0]} alt="Preview" className="h-full w-full object-cover rounded-lg" />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">Tirar foto ou upload</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            
            {formData.photos && formData.photos.length > 0 && (
              <button
                type="button"
                onClick={handleAIAnalysis}
                disabled={loadingAI}
                className="h-32 w-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex flex-col items-center justify-center text-white p-2 shadow-lg"
              >
                {loadingAI ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2"></div>
                ) : (
                  <Sparkles className="w-6 h-6 mb-2" />
                )}
                <span className="text-[10px] text-center leading-tight">
                  {loadingAI ? 'Analisando...' : 'Preencher com IA'}
                </span>
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Título</label>
          <input
            required
            type="text"
            value={formData.title || ''}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
            placeholder="Ex: Falta selante no banheiro"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            rows={3}
            value={formData.description || ''}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
            placeholder="Detalhes do problema..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Prioridade</label>
            <select
              value={formData.priority}
              onChange={e => setFormData({...formData, priority: e.target.value as Priority})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-white"
            >
              {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Prazo</label>
            <input
              required
              type="date"
              value={formData.deadline || ''}
              onChange={e => setFormData({...formData, deadline: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Responsável</label>
          <input
            required
            type="text"
            value={formData.responsible || ''}
            onChange={e => setFormData({...formData, responsible: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
            placeholder="Nome ou Empreiteira"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Localização</label>
          <input
            required
            type="text"
            value={formData.location || ''}
            onChange={e => setFormData({...formData, location: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
            placeholder="Ex: Térreo, Bloco A"
          />
        </div>

        <div className="pt-4">
          <Button type="submit" fullWidth>Salvar Pendência</Button>
        </div>
      </form>
    </div>
  );
};
