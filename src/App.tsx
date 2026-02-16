import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';



import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  LogOut,
  Bot,
  Zap,
  Calendar,
  Shield,
  FileText
} from 'lucide-react';

import { User, Conversation, BotStatus, WhatsAppConfig, AIConfig, Message, SenderType } from './types';
import { getChatbotResponse } from './services/geminiService';
import { checkDeviceStatus, sendMessageViaWhatsApp, getMessages } from './services/whatsappService';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ConversationsList from './components/ConversationsList';
import ChatWindow from './components/ChatWindow';
import SettingsView from './components/SettingsView';
import AgendaView from './components/AgendaView';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import { API_URL } from './config';

const ESCALATION_THRESHOLD = 3;
const WA_CONFIG_KEY = 'zapai_wa_config';
const AI_CONFIG_KEY = 'zapai_ai_config';
const USER_KEY = 'zapai_user';
const WA_CONNECTED_KEY = 'zapai_wa_connected';

// Backend URL logic moved to config.ts

const App: React.FC = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [user, setUser] = useState<User>(() => {
    const saved = sessionStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : { id: '', name: '', email: '', isAuthenticated: false };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'conversations' | 'settings' | 'agenda' | 'privacy' | 'terms'>('dashboard');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Still keeping WA config in local storage for Settings view, 
  // but eventually this should move to backend too.
  const [waConfig, setWaConfig] = useState<WhatsAppConfig>(() => {
    const saved = localStorage.getItem(WA_CONFIG_KEY);
    return saved ? JSON.parse(saved) : {
      instanceId: '', // Configuration is now handled in the backend
      token: '',
      active: true,
      webhookUrl: ''
    };
  });

  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(() => {
    return localStorage.getItem(WA_CONNECTED_KEY) === 'true';
  });


  // Legacy config migration logic removed as we now use Backend-side configuration.


  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem(AI_CONFIG_KEY);
    return saved ? JSON.parse(saved) : {
      enabled: true,
      systemPrompt: 'A ZapAI é uma loja de tecnologia premium. Vendemos smartphones, acessórios e serviços de automação.',
      temperature: 0.8,
      tone: 'Persuasivo e Profissional',
      behavioralDirectives: 'Sempre cumprimente pelo nome se souber. Nunca mencione que você é uma IA a menos que seja estritamente necessário. Se o cliente parecer indeciso, ofereça um cupom de desconto "ZAP10".',
      trainingExamples: [
        {
          id: '1',
          userQuery: 'Vocês fazem entrega hoje?',
          expectedResponse: 'Fazemos sim! Para pedidos fechados até as 14h, entregamos no mesmo dia.'
        }
      ],
      knowledgeBase: [
        {
          id: 'kb1',
          title: 'Política de Entrega',
          content: 'Entregas em São Paulo capital via Motoboy: R$ 20,00 fixo. Prazo de até 4 horas para pedidos feitos em horário comercial.'
        }
      ]
    };
  });

  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(WA_CONFIG_KEY, JSON.stringify(waConfig));
    // Also sync to backend whenever config changes (debounce or on save is better, but this ensures sync)
    // However, usually we want explicit save. Let's do it in the handlers passed to SettingsView.
  }, [waConfig]);

  useEffect(() => {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(aiConfig));
  }, [aiConfig]);

  useEffect(() => {
    localStorage.setItem(WA_CONNECTED_KEY, isWhatsAppConnected.toString());
  }, [isWhatsAppConnected]);

  // Fetch conversations from Backend
  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/conversations`);
      if (response.ok) {
        const data = await response.json();
        const mapped: Conversation[] = data.map((c: any) => ({
          id: c.id,
          contactName: c.name || c.phone,
          phoneNumber: c.phone,
          lastMessage: c.messages?.[0]?.content || '',
          lastTimestamp: c.messages?.[0]?.timestamp ? new Date(c.messages[0].timestamp).getTime() : new Date(c.updatedAt).getTime(),
          status: c.status === 'active' ? BotStatus.BOT : BotStatus.HUMAN,
          unreadCount: 0,
          unclearCount: 0,
          messages: []
        }));

        setConversations(prev => {
          return mapped.map(newConv => {
            const existing = prev.find(p => p.id === newConv.id);
            if (existing) {
              return {
                ...newConv,
                messages: existing.messages,
              };
            }
            return newConv;
          }).concat(
            prev.filter(p => p.id.startsWith('temp-') && !mapped.some(m => m.phoneNumber === p.phoneNumber))
          );
        });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  useEffect(() => {
    if (user.isAuthenticated) {
      fetchConversations();
    }
  }, [user.isAuthenticated]);


  // Auto-check connection status on load
  useEffect(() => {
    if (user.isAuthenticated) {
      checkDeviceStatus(waConfig).then(status => {
        setIsWhatsAppConnected(status.status === 'connected');
      });
    }
  }, [user.isAuthenticated, waConfig]);

  // Polling for new content from Backend (Simplifying: just refresh list)
  useEffect(() => {
    if (!user.isAuthenticated) return;

    // Load AI Config from Backend
    const fetchAiConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/settings/zapai_ai_config`);
        if (res.ok) {
          const storedConfig = await res.json();
          if (storedConfig) {
            setAiConfig(prev => ({ ...prev, ...storedConfig }));
          }
        }
      } catch (err) {
        console.warn('Could not load AI config from backend', err);
      }
    };

    fetchConversations();
    fetchAiConfig(); // Call it

    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [user.isAuthenticated]);


  // Fetch full messages when selecting a conversation
  useEffect(() => {
    if (selectedConversationId) {
      const conv = conversations.find(c => c.id === selectedConversationId);
      if (conv) {
        fetch(`${API_URL}/conversations/${conv.phoneNumber}/messages`)
          .then(res => {
            if (!res.ok) return []; // Return empty array if conversation not found (404)
            return res.json();
          })
          .then(msgs => {
            // Safety check: ensure msgs is an array
            const safeMsgs = Array.isArray(msgs) ? msgs : [];

            setConversations(prev => prev.map(c => {
              if (c.id === selectedConversationId) {
                return {
                  ...c,
                  messages: safeMsgs.map((m: any) => ({
                    id: m.id,
                    conversationId: m.conversationId,
                    senderId: m.fromMe ? 'bot' : 'user',
                    senderName: m.fromMe ? 'ZapBot' : c.contactName,
                    senderKind: m.fromMe ? SenderType.BOT : SenderType.USER,
                    text: m.content,
                    timestamp: new Date(m.timestamp).getTime(),
                    fromMe: m.fromMe
                  }))
                };
              }
              return c;
            }));
          })
          .catch(err => console.error("Error fetching messages:", err));
      }
    }
  }, [selectedConversationId]);




  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const toggleBotStatus = async (id: string, forceStatus?: BotStatus) => {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return;

    const newStatus = forceStatus || (conversation.status === BotStatus.BOT ? BotStatus.HUMAN : BotStatus.BOT);
    const backendStatus = newStatus === BotStatus.BOT ? 'active' : 'human';

    // Optimistic Update
    setConversations(prev => prev.map(c =>
      c.id === id ? {
        ...c,
        status: newStatus,
        unclearCount: 0
      } : c
    ));

    // Call Backend
    try {
      await fetch(`${API_URL}/conversations/${conversation.phoneNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: backendStatus })
      });
    } catch (error) {
      console.error("Failed to update status on backend:", error);
      // Revert if failed (optional, but good practice)
    }
  };


  const handleLogout = () => {
    setUser({ id: '', name: '', email: '', isAuthenticated: false });
    sessionStorage.removeItem(USER_KEY);
  };


  const handleSendMessage = async (text: string) => {
    if (!selectedConversation) return;

    // Optimistic UI Update
    const tempId = Math.random().toString();
    const userMsg: Message = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: 'bot', // Human agent acting via UI
      senderName: 'Atendente',
      senderKind: SenderType.BOT,
      text,
      timestamp: Date.now(),
      fromMe: true
    };

    setConversations(prev => prev.map(c =>
      c.id === selectedConversation.id ? { ...c, messages: [...c.messages, userMsg], lastMessage: text, lastTimestamp: Date.now() } : c
    ));

    // Send to Backend
    try {
      const response = await fetch(`${API_URL}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedConversation.phoneNumber,
          message: text
        })
      });

      if (!response.ok) {
        console.error("Failed to send message via backend");
        alert("Erro ao enviar mensagem.");
      }
    } catch (e) {
      console.error("Error sending message:", e);
      alert("Erro de conexão.");
    }
  };

  const simulateIncomingMessage = (convId: string, text: string) => {
    // Compatibility stub if passed to children
  };

  const handleStartChat = (contact: { phone: string; name: string }) => {
    // 1. Check if conversation already exists
    const existing = conversations.find(c => c.phoneNumber === contact.phone);
    if (existing) {
      setSelectedConversationId(existing.id);
      return;
    }

    // 2. Create optimistic conversation
    const newId = `temp-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      phoneNumber: contact.phone,
      contactName: contact.name,
      lastMessage: '',
      lastTimestamp: Date.now(),
      status: BotStatus.HUMAN, // Start as human by default for manual outreach? Or BOT? Let's say HUMAN for safety
      messages: [],
      unreadCount: 0,
      unclearCount: 0
    };

    setConversations(prev => [newConv, ...prev]);
    setSelectedConversationId(newId);
  };

  const handleSaveWaConfig = async (newConfig: WhatsAppConfig) => {
    setWaConfig(newConfig);
    try {
      await fetch(`${API_URL}/settings/whatsapp_config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      console.log('WA Config saved to backend');
    } catch (e) {
      console.error("Failed to save WA config to backend", e);
    }
  };


  const content = (
    <div className="flex h-screen bg-white md:bg-gray-50 font-sans text-gray-900">
      {/* Sidebar (Desktop) */}
      {user.isAuthenticated && (
        <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col shadow-2xl z-10">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/50">
                <Bot size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">ZapAI Master</h1>
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Enterprise</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="px-4 py-2 text-[10px] font-bold uppercase text-slate-500 tracking-widest">Menu Principal</div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('conversations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'conversations' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <MessageSquare size={18} /> Atendimentos
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'agenda' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Calendar size={18} /> Agenda
            </button>

            <div className="mt-8 px-4 py-2 text-[10px] font-bold uppercase text-slate-500 tracking-widest">Configuração</div>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Settings size={18} /> Inteligência & Canais
            </button>

            <div className="mt-8 px-4 py-2 text-[10px] font-bold uppercase text-slate-500 tracking-widest">Legal</div>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'privacy' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Shield size={18} /> Privacidade
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'terms' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <FileText size={18} /> Termos de Uso
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-4 px-2 py-2 bg-slate-800/50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${isWhatsAppConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-bold uppercase text-gray-300">
                {isWhatsAppConnected ? 'Número Pareado' : 'Aguardando QR Code'}
              </span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-slate-800 transition-colors">
              <LogOut size={20} /> Sair
            </button>
          </div>
        </aside>
      )}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {user.isAuthenticated && (
          <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600 fill-current" />
              <span className="font-bold">ZapAI</span>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setActiveTab('dashboard')}><LayoutDashboard className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'} /></button>
              <button onClick={() => setActiveTab('conversations')}><MessageSquare className={activeTab === 'conversations' ? 'text-blue-600' : 'text-gray-400'} /></button>
              <button onClick={() => setActiveTab('agenda')}><Calendar className={activeTab === 'agenda' ? 'text-blue-600' : 'text-gray-400'} /></button>
              <button onClick={() => setActiveTab('settings')}><Settings className={activeTab === 'settings' ? 'text-blue-600' : 'text-gray-400'} /></button>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {!user.isAuthenticated ? (
            <div translate="no">
              <Login
                onLogin={(u) => setUser({ ...u, isAuthenticated: true } as User)}
                googleEnabled={!!googleClientId}
              />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard conversations={conversations} waConfig={waConfig} />}

              {activeTab === 'agenda' && <AgendaView />}

              {activeTab === 'conversations' && (
                <div className="flex h-[calc(100vh-12rem)] md:h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className={`w-full md:w-80 border-r border-gray-100 flex-shrink-0 ${selectedConversationId ? 'hidden md:block' : 'block'}`}>
                    <ConversationsList
                      conversations={conversations}
                      selectedId={selectedConversationId}
                      onSelect={setSelectedConversationId}
                      onStartChat={handleStartChat}
                    />
                  </div>
                  <div className={`flex-1 flex flex-col ${selectedConversationId ? 'block' : 'hidden md:flex items-center justify-center bg-gray-50'}`}>
                    {selectedConversation ? (
                      <ChatWindow
                        conversation={selectedConversation}
                        onBack={() => setSelectedConversationId(null)}
                        onToggleStatus={() => toggleBotStatus(selectedConversation.id)}
                        onSendMessage={handleSendMessage}
                        isAiThinking={isAiThinking}
                        onSimulateIncoming={(text) => simulateIncomingMessage(selectedConversation.id, text)}
                      />
                    ) : (
                      <div className="text-center">
                        <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Selecione uma conversa para monitorar a IA</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  waConfig={waConfig}
                  aiConfig={aiConfig}
                  onSaveWa={handleSaveWaConfig}
                  onSaveAi={async (newConfig) => {
                    setAiConfig(newConfig);
                    try {
                      await fetch(`${API_URL}/settings/zapai_ai_config`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newConfig)
                      });
                      console.log('AI Config saved to backend');
                    } catch (e) {
                      console.error("Failed to save AI config to backend", e);
                    }
                  }}
                  isConnected={isWhatsAppConnected}
                  onSetConnected={setIsWhatsAppConnected}
                />
              )}

              {activeTab === 'privacy' && <PrivacyPolicy />}
              {activeTab === 'terms' && <TermsOfUse />}
            </>
          )}
        </div>
      </main>
    </div >
  );

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
};

export default App;
