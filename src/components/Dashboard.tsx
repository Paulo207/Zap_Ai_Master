
import React from 'react';
import {
  Users,
  MessageCircle,
  Activity,
  Bot,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Conversation, WhatsAppConfig, BotStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardProps {
  conversations: Conversation[];
  waConfig: WhatsAppConfig;
}

// Data fetched from API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Dashboard: React.FC<DashboardProps> = ({ conversations, waConfig }) => {
  const [graphData, setGraphData] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch(`${API_URL}/stats/messages-by-day`)
      .then(res => res.json())
      .then(data => setGraphData(data))
      .catch(err => console.error('Failed to fetch stats:', err));
  }, []);
  const activeBots = conversations.filter(c => c.status === BotStatus.BOT).length;
  const humanTakeovers = conversations.filter(c => c.status === BotStatus.HUMAN).length;
  const totalMsgs = conversations.reduce((acc, curr) => acc + curr.messages.length, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
          <p className="text-gray-500">Acompanhe o desempenho do seu atendimento automatizado.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className={`w-3 h-3 rounded-full ${waConfig.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium text-gray-700">WhatsApp {waConfig.active ? 'Online' : 'Offline'}</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          icon={<Users className="text-blue-600" />}
          title="Total Contatos"
          value={conversations.length.toString()}
          change="+12% vs ontem"
        />
        <StatCard
          icon={<Bot className="text-purple-600" />}
          title="Bots Ativos"
          value={activeBots.toString()}
          change={`${Math.round((activeBots / conversations.length) * 100)}% do total`}
        />
        <StatCard
          icon={<Activity className="text-orange-600" />}
          title="Intervenção Humana"
          value={humanTakeovers.toString()}
          change="Requer atenção"
        />
        <StatCard
          icon={<MessageCircle className="text-green-600" />}
          title="Mensagens (24h)"
          value={totalMsgs.toString()}
          change="+45 novas hoje"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800">Volume de Mensagens</h3>
            <TrendingUp size={18} className="text-gray-400" />
          </div>
          <div className="h-64 w-full">
            {graphData.length > 0 ? (
              <div style={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={100} minHeight={100}>
                  <BarChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="msgs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Carregando dados...</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800">Atividade Recente</h3>
            <Clock size={18} className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {conversations.slice(0, 5).map(conv => (
              <div key={conv.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                    {conv.contactName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{conv.contactName}</p>
                    <p className="text-xs text-gray-500 truncate w-32 md:w-full">{conv.lastMessage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${conv.status === BotStatus.BOT ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {conv.status}
                  </span>
                  <p className="text-[10px] text-gray-400">10m</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string, change: string }> = ({ icon, title, value, change }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
    </div>
    <div>
      <h3 className="text-sm text-gray-500 font-medium">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
    <p className="text-xs text-gray-400 mt-4 font-medium flex items-center gap-1">
      <CheckCircle2 size={12} className="text-green-500" /> {change}
    </p>
  </div>
);

export default Dashboard;
