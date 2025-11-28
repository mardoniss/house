import React, { useState } from 'react';
import { DeliveryItem, DeliveryStatus, ViewState } from '../types';
import { Truck, Package, Calendar, FileText, CheckCircle, AlertTriangle, Plus, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';
import { SignaturePad } from './SignaturePad';

interface DeliveryModuleProps {
  items: DeliveryItem[];
  setItems: React.Dispatch<React.SetStateAction<DeliveryItem[]>>;
  setView: React.Dispatch<React.SetStateAction<ViewState>>;
  view: ViewState;
  onReportIssue: (delivery: DeliveryItem) => void;
}

export const DeliveryModule: React.FC<DeliveryModuleProps> = ({ items, setItems, setView, view, onReportIssue }) => {
  const [formData, setFormData] = useState<Partial<DeliveryItem>>({
    status: DeliveryStatus.SCHEDULED
  });
  
  // State for the "Receiving" modal/mode
  const [receivingItem, setReceivingItem] = useState<DeliveryItem | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [signature, setSignature] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: DeliveryItem = {
      id: Date.now().toString(),
      material: formData.material!,
      supplier: formData.supplier!,
      quantity: Number(formData.quantity),
      unit: formData.unit!,
      arrivalDate: formData.arrivalDate!,
      invoiceNumber: formData.invoiceNumber,
      status: DeliveryStatus.SCHEDULED
    };
    setItems(prev => [newItem, ...prev]);
    setView('DELIVERY_LIST');
    setFormData({ status: DeliveryStatus.SCHEDULED });
  };

  const handleReceiveSubmit = (status: 'OK' | 'ISSUE') => {
    if (!receivingItem) return;

    const updatedItem = {
      ...receivingItem,
      status: status === 'OK' ? DeliveryStatus.CHECKED : DeliveryStatus.ISSUE,
      receivedBy: receiverName,
      receivedAt: Date.now(),
      signature: signature,
      issueReported: status === 'ISSUE'
    };

    setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
    
    if (status === 'ISSUE') {
      onReportIssue(updatedItem);
    }
    
    setReceivingItem(null);
    setReceiverName('');
    setSignature('');
  };

  const getStatusColor = (s: DeliveryStatus) => {
    switch (s) {
      case DeliveryStatus.SCHEDULED: return 'bg-gray-100 text-gray-700';
      case DeliveryStatus.ARRIVED: return 'bg-blue-100 text-blue-700';
      case DeliveryStatus.CHECKED: return 'bg-green-100 text-green-700';
      case DeliveryStatus.ISSUE: return 'bg-red-100 text-red-700';
    }
  };

  if (view === 'DELIVERY_LIST') {
    if (receivingItem) {
      return (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto pb-20">
          <div className="p-4 max-w-lg mx-auto">
             <div className="flex items-center mb-6">
              <button onClick={() => setReceivingItem(null)} className="mr-2 text-gray-500">
                <XCircle />
              </button>
              <h2 className="text-xl font-bold">Conferência de Entrega</h2>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm">
              <p><strong>Material:</strong> {receivingItem.material}</p>
              <p><strong>Fornecedor:</strong> {receivingItem.supplier}</p>
              <p><strong>Qtd:</strong> {receivingItem.quantity} {receivingItem.unit}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Recebedor</label>
                <input 
                  type="text" 
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
                  placeholder="Seu nome"
                />
              </div>

              <SignaturePad onSave={setSignature} />

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => handleReceiveSubmit('OK')} 
                  disabled={!signature || !receiverName}
                  fullWidth
                  className="bg-green-600 hover:bg-green-700"
                >
                  Conferido e OK
                </Button>
                <Button 
                  onClick={() => handleReceiveSubmit('ISSUE')}
                  disabled={!signature || !receiverName}
                  fullWidth
                  variant="danger"
                >
                  Problema
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-20">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-gray-800">Entregas</h2>
          <Button onClick={() => setView('DELIVERY_FORM')} className="!py-2 !px-3 text-sm">
            <Plus size={18} className="mr-1" /> Nova
          </Button>
        </div>

        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900">{item.material}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 mb-3">
                <div className="col-span-2 flex items-center"><Truck size={14} className="mr-1"/> {item.supplier}</div>
                <div className="flex items-center"><Package size={14} className="mr-1"/> {item.quantity} {item.unit}</div>
                <div className="flex items-center"><Calendar size={14} className="mr-1"/> 
                  {new Date(item.arrivalDate).toLocaleString('pt-BR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                </div>
              </div>

              {item.status === DeliveryStatus.SCHEDULED && (
                <Button 
                  variant="secondary" 
                  fullWidth 
                  className="!py-1.5 text-sm"
                  onClick={() => {
                    const newItem = {...item, status: DeliveryStatus.ARRIVED};
                    setItems(prev => prev.map(i => i.id === item.id ? newItem : i));
                  }}
                >
                  Marcar como Chegou
                </Button>
              )}
              
              {item.status === DeliveryStatus.ARRIVED && (
                <Button 
                  fullWidth 
                  className="!py-1.5 text-sm bg-brand-600"
                  onClick={() => setReceivingItem(item)}
                >
                  Conferir Recebimento
                </Button>
              )}

              {(item.status === DeliveryStatus.CHECKED || item.status === DeliveryStatus.ISSUE) && (
                <div className="mt-2 pt-2 border-t border-gray-50 text-xs text-gray-500">
                  Recebido por: {item.receivedBy} em {new Date(item.receivedAt!).toLocaleDateString()}
                  {item.signature && <p className="text-[10px] text-green-600 mt-1">✓ Assinado digitalmente</p>}
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p>Nenhuma entrega agendada.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Form
  return (
    <div className="pb-20">
      <div className="flex items-center mb-4">
        <button onClick={() => setView('DELIVERY_LIST')} className="mr-2 text-gray-500">
          <XCircle />
        </button>
        <h2 className="text-xl font-bold">Agendar Entrega</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Material</label>
          <input
            required
            type="text"
            value={formData.material || ''}
            onChange={e => setFormData({...formData, material: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
            placeholder="Ex: Cimento CP-II"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fornecedor / Transportadora</label>
          <input
            required
            type="text"
            value={formData.supplier || ''}
            onChange={e => setFormData({...formData, supplier: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
            placeholder="Ex: Construtora ABC Log"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantidade</label>
            <input
              required
              type="number"
              value={formData.quantity || ''}
              onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unidade</label>
            <input
              required
              type="text"
              value={formData.unit || ''}
              onChange={e => setFormData({...formData, unit: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
              placeholder="Ex: sc, m², kg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Data e Hora Prevista</label>
          <input
            required
            type="datetime-local"
            value={formData.arrivalDate || ''}
            onChange={e => setFormData({...formData, arrivalDate: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nota Fiscal (Opcional)</label>
          <input
            type="text"
            value={formData.invoiceNumber || ''}
            onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
            placeholder="Nº da NF"
          />
        </div>

        <div className="pt-4">
          <Button type="submit" fullWidth>Agendar Entrega</Button>
        </div>
      </form>
    </div>
  );
};
