
export enum BotStatus {
  BOT = 'BOT',
  HUMAN = 'HUMAN'
}

export enum SenderType {
  USER = 'USER',
  BOT = 'BOT',
  SYSTEM = 'SYSTEM'
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderKind: SenderType;
  text: string;
  timestamp: number;
  fromMe: boolean;
}

export interface Conversation {
  id: string;
  externalId?: string;
  contactName: string;
  phoneNumber: string;
  lastMessage: string;
  lastTimestamp: number;
  status: BotStatus;
  messages: Message[];
  unreadCount: number;
  unclearCount: number;
}

export interface WhatsAppConfig {
  id?: string;
  provider?: 'zapi' | 'ultramsg' | 'official';
  instanceId: string;
  token: string;
  clientToken?: string;
  active: boolean;
  webhookUrl: string;
}

export interface TrainingExample {
  id: string;
  userQuery: string;
  expectedResponse: string;
}

export interface KnowledgeBaseItem {
  id: string;
  title: string;
  content: string;
}

export interface AIConfig {
  enabled: boolean;
  systemPrompt: string;
  companyName?: string;
  adminPhone?: string; // New field for notifications
  profession?: string;
  agenda?: string; // New field
  priceTable?: string; // New field
  temperature: number;
  tone: string;
  trainingExamples: TrainingExample[];
  knowledgeBase: KnowledgeBaseItem[];
  behavioralDirectives: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAuthenticated: boolean;
}

export interface Contact {
  phone: string;
  name: string;
  imgUrl?: string;
}

export interface Appointment {
  id: string;
  phone: string;
  client: string;
  service: string;
  date: string;
  completed: boolean;
  createdAt: string; // Serialized Date
}
