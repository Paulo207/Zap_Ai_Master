
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  MoreVertical, 
  Send, 
  Bot, 
  User, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { Conversation, Message, BotStatus } from '../types';

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
  onToggleStatus: () => void;
  onSendMessage: (text: string) => void;
  isAiThinking?: boolean;
  onSimulateIncoming?: (text: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  conversation, 
  onBack, 
  onToggleStatus, 
  onSendMessage, 
  isAiThinking,
  onSimulateIncoming 
}) => {
  const [inputText, setInputText] = useState('');
  const [testText, setTestText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages, isAiThinking]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (testText.trim() && onSimulateIncoming) {
      onSimulateIncoming(testText);
      setTestText('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <header className="p-4 flex items-center justify-between border-b border-gray-100 bg-white z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden text-gray-500 hover:text-gray-700">
            <ArrowLeft size={24} />
          </button>
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm transition-all duration-500 ${conversation.status === BotStatus.BOT ? 'bg-blue-500 scale-105 ring-2 ring-blue-100' : 'bg-orange-500'}`}>
              {conversation.contactName.charAt(0)}
            </div>
            {conversation.status === BotStatus.BOT && (
              <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                <Sparkles size={12} className="text-blue-500" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight">{conversation.contactName}</h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500">{conversation.phoneNumber}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span className={`text-[10px] font-bold uppercase ${conversation.status === BotStatus.BOT ? 'text-blue-500' : 'text-orange-500'}`}>
                {conversation.status === BotStatus.BOT ? 'IA Analisando Histórico' : 'Modo Manual'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {conversation.unclearCount > 0 && conversation.status === BotStatus.BOT && (
            <div className="hidden lg:flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
              <AlertTriangle size={12} /> Confusão IA: {conversation.unclearCount}/3
            </div>
          )}
          <button 
            onClick={onToggleStatus}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${conversation.status === BotStatus.BOT 
              ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' 
              : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}
          >
            {conversation.status === BotStatus.BOT ? (
              <><User size={14} /> Assumir Humano</>
            ) : (
              <><Bot size={14} /> Ativar IA Consultiva</>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/30 space-y-4">
        {conversation.messages.map((msg) => {
          if (msg.senderId === 'system') {
            return (
              <div key={msg.id} className="flex justify-center py-2">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-200 flex items-center gap-2">
                  <AlertTriangle size={12} /> {msg.text}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 shadow-sm ${msg.fromMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <div className={`flex items-center gap-1 mt-1 text-[9px] ${msg.fromMe ? 'text-blue-200 justify-end' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.fromMe && <ShieldCheck size={10} />}
                </div>
              </div>
            </div>
          );
        })}

        {isAiThinking && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white border border-blue-100 rounded-2xl p-3 shadow-sm flex items-center gap-2">
              <Bot size={14} className="text-blue-500 animate-spin" />
              <span className="text-xs text-blue-600 font-medium">IA analisando preferências e gerando oferta...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {onSimulateIncoming && (
        <div className="px-4 py-2 bg-slate-800 border-t border-slate-700">
           <form onSubmit={handleSimulate} className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Simular mensagem do cliente (ex: Gostei daquele celular azul...)"
                  className="w-full bg-slate-900 border-none rounded-lg py-1.5 px-3 text-[10px] text-gray-300 outline-none focus:ring-1 focus:ring-blue-500"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                />
                <Zap size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-500" />
              </div>
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase">Simular</button>
           </form>
        </div>
      )}

      <footer className="p-4 border-t border-gray-100 bg-white">
        {conversation.status === BotStatus.BOT ? (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="text-blue-600" size={20} />
              <div className="flex flex-col">
                <p className="text-xs text-blue-800 font-bold">Automação Inteligente Ativa</p>
                <p className="text-[10px] text-blue-600">A IA está usando o histórico para recomendações.</p>
              </div>
            </div>
            <button onClick={onToggleStatus} className="text-[10px] font-bold text-blue-600 uppercase bg-white px-2 py-1 rounded border border-blue-200 hover:bg-blue-50">Parar Bot</button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <input 
              type="text" 
              className="flex-1 px-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              placeholder="Digite sua resposta manual..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-200"
            >
              <Send size={20} />
            </button>
          </form>
        )}
      </footer>
    </div>
  );
};

export default ChatWindow;
