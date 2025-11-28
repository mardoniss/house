import React, { useState, useEffect } from 'react';
import { PendingItem, DeliveryItem, ViewState, DeliveryStatus, TabProps } from './types';
import { PendingModule } from './components/PendingModule';
import { DeliveryModule } from './components/DeliveryModule';
import { ClipboardList, Truck, Bell } from 'lucide-react';

const STORAGE_PENDING_KEY = 'obragester_pending_v1';
const STORAGE_DELIVERY_KEY = 'obragester_delivery_v1';

const Tab: React.FC<TabProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center flex-1 py-3 transition-colors ${
      active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
    }`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { size: 24, strokeWidth: active ? 2.5 : 2 })}
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'DELIVERY'>('PENDING');
  const [currentView, setCurrentView] = useState<ViewState>('PENDING_LIST');
  const [notification, setNotification] = useState<string | null>(null);
  
  // Data State
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
  
  // Cross-module state: Data passed from Delivery to Pending when an issue is reported
  const [pendingPrefill, setPendingPrefill] = useState<{description: string} | undefined>(undefined);

  // Load from Storage
  useEffect(() => {
    const pData = localStorage.getItem(STORAGE_PENDING_KEY);
    const dData = localStorage.getItem(STORAGE_DELIVERY_KEY);
    if (pData) setPendingItems(JSON.parse(pData));
    if (dData) setDeliveryItems(JSON.parse(dData));
  }, []);

  // Save to Storage
  useEffect(() => {
    localStorage.setItem(STORAGE_PENDING_KEY, JSON.stringify(pendingItems));
  }, [pendingItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_DELIVERY_KEY, JSON.stringify(deliveryItems));
  }, [deliveryItems]);

  // Handle reporting an issue from delivery
  const handleDeliveryIssue = (delivery: DeliveryItem) => {
    setPendingPrefill({
      description: `Problema de entrega reportado. Material: ${delivery.material}. Fornecedor: ${delivery.supplier}. Qtd: ${delivery.quantity} ${delivery.unit}.`
    });
    setActiveTab('PENDING');
    setCurrentView('PENDING_FORM');
    showNotification("Redirecionado para cadastrar pendência da entrega");
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const switchTab = (tab: 'PENDING' | 'DELIVERY') => {
    setActiveTab(tab);
    setCurrentView(tab === 'PENDING' ? 'PENDING_LIST' : 'DELIVERY_LIST');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-200">
      
      {/* Header */}
      <header className="bg-white px-4 py-4 border-b border-gray-200 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-brand-900 tracking-tight">ObraGestor <span className="text-brand-500">AI</span></h1>
          <p className="text-xs text-gray-500">Gerenciamento de Qualidade & Logística</p>
        </div>
        <div className="relative p-2 bg-gray-50 rounded-full">
           <Bell size={20} className="text-gray-600" />
           {/* Simulate notification badge */}
           <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 min-h-[calc(100vh-140px)]">
        {activeTab === 'PENDING' ? (
          <PendingModule 
            items={pendingItems} 
            setItems={setPendingItems}
            view={currentView}
            setView={setCurrentView}
            prefillFromDelivery={pendingPrefill}
          />
        ) : (
          <DeliveryModule 
            items={deliveryItems}
            setItems={setDeliveryItems}
            view={currentView}
            setView={setCurrentView}
            onReportIssue={handleDeliveryIssue}
          />
        )}
      </main>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          {notification}
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 max-w-md w-full bg-white border-t border-gray-200 flex justify-around pb-safe z-40">
        <Tab 
          active={activeTab === 'PENDING'} 
          onClick={() => switchTab('PENDING')}
          icon={<ClipboardList />}
          label="Pendências"
        />
        <Tab 
          active={activeTab === 'DELIVERY'} 
          onClick={() => switchTab('DELIVERY')}
          icon={<Truck />}
          label="Entregas"
        />
      </nav>
    </div>
  );
};

export default App;