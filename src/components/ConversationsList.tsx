
import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, UserPlus, Users, MessageCircle, RefreshCw, Plus } from 'lucide-react';
import { Conversation, BotStatus, Contact } from '../types';

interface ConversationsListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onStartChat: (contact: Contact) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ConversationsList: React.FC<ConversationsListProps> = ({ conversations, selectedId, onSelect, onStartChat }) => {
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeTab, setActiveTab] = useState<'conversations' | 'contacts'>('conversations');
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });

  const fetchContacts = () => {
    fetch(`${API_URL}/contacts`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map((d: any) => ({
            phone: d.phone || d.id,
            name: d.name || d.pushName || d.shortName || d.phone || 'Desconhecido',
            imgUrl: d.profilePicUrl || d.imgUrl
          }));
          setContacts(mapped);
        }
      })
      .catch(err => console.error("Error fetching contacts:", err));
  };

  // Fetch contacts on mount
  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSyncContacts = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_URL}/contacts/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchContacts();
      } else {
        alert('Erro ao sincronizar.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão.');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.phone) return alert('Telefone obrigatório');
    try {
      const res = await fetch(`${API_URL}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewContact({ name: '', phone: '' });
        fetchContacts();
        alert('Contato adicionado!');
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao criar contato');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar.');
    }
  };

  // Filter Conversations
  const filteredConversations = conversations.filter(c =>
    c.contactName.toLowerCase().includes(search.toLowerCase()) ||
    c.phoneNumber.includes(search)
  );

  // Filter Contacts
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header & Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="p-4 pb-2">
          <h2 className="text-xl font-bold text-gray-800 mb-4">ZapAI</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex px-4 gap-4">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'conversations' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <MessageCircle size={18} /> Conversas
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'contacts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <Users size={18} /> Agenda ({contacts.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Conversations View */}
        {activeTab === 'conversations' && (
          <div className="py-2">
            {filteredConversations.length > 0 ? (
              filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`w-full p-4 flex items-center gap-3 transition-colors text-left border-b border-gray-50 ${selectedId === conv.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${conv.status === BotStatus.BOT ? 'bg-blue-500' : 'bg-orange-500'}`}>
                      {conv.contactName.charAt(0)}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{conv.contactName}</h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">Now</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate leading-relaxed">{conv.lastMessage}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <MessageSquare size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">Nenhuma conversa encontrada</p>
              </div>
            )}
          </div>
        )}

        {/* Contacts View */}
        {activeTab === 'contacts' && (
          <div className="py-2">
            {/* Action Buttons */}
            <div className="px-4 py-3 flex gap-2">
              <button
                onClick={handleSyncContacts}
                disabled={syncing}
                className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                Novo Contato
              </button>
            </div>

            {filteredContacts.length > 0 ? (
              filteredContacts.map(contact => (
                <button
                  key={contact.phone}
                  onClick={() => {
                    onStartChat(contact);
                    setActiveTab('conversations');
                  }}
                  className="w-full p-4 flex items-center gap-3 transition-colors text-left hover:bg-gray-50 border-b border-gray-50"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 overflow-hidden">
                    {contact.imgUrl ? (
                      <img src={contact.imgUrl} alt={contact.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserPlus size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{contact.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{contact.phone}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center pt-12">
                {contacts.length === 0 ? (
                  <>
                    <Users size={32} className="mx-auto text-gray-300 mb-2 animate-pulse" />
                    <p className="text-gray-400 text-sm">Carregando contatos...</p>
                  </>
                ) : (
                  <>
                    <Users size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">Nenhum contato encontrado</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Novo Contato</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label>
                <input
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={newContact.name}
                  onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Nome do Cliente"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone (com DDD)</label>
                <input
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={newContact.phone}
                  onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="5511999999999"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-gray-400 font-bold text-xs uppercase hover:bg-gray-50 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddContact}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-xs uppercase hover:bg-blue-700 shadow-lg shadow-blue-200"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationsList;
