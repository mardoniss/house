export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta'
}

export enum PendingStatus {
  OPEN = 'Aberto',
  IN_PROGRESS = 'Em Andamento',
  WAITING_APPROVAL = 'Aguardando Aprovação',
  RESOLVED = 'Resolvido',
  REJECTED = 'Rejeitado'
}

export enum DeliveryStatus {
  SCHEDULED = 'Agendada',
  ARRIVED = 'Chegou',
  CHECKED = 'Conferido OK',
  ISSUE = 'Problema'
}

export interface PendingItem {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  responsible: string;
  deadline: string; // ISO Date string
  location: string;
  photos: string[]; // Base64 strings
  status: PendingStatus;
  createdAt: number;
}

export interface DeliveryItem {
  id: string;
  material: string;
  supplier: string;
  quantity: number;
  unit: string;
  arrivalDate: string; // ISO Date string
  invoiceNumber?: string;
  status: DeliveryStatus;
  receivedBy?: string;
  receivedAt?: number;
  signature?: string; // Base64
  photo?: string; // Base64
  issueReported?: boolean;
}

export type ViewState = 'PENDING_LIST' | 'PENDING_FORM' | 'DELIVERY_LIST' | 'DELIVERY_FORM';

export interface TabProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}
