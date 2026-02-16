
import React, { useState } from 'react';
import { WhatsAppConfig, AIConfig, TrainingExample, KnowledgeBaseItem } from '../types';
import {
  Bot,
  Save,
  RefreshCw,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Info,
  Lock,
  Globe,
  GraduationCap,
  Plus,
  Trash2,
  MessageSquareQuote,
  Eye,
  EyeOff,
  BookOpen,
  FileText,
  Target,
  FileJson
} from 'lucide-react';
import { getQRCode, checkDeviceStatus, restartInstance, logoutDevice } from '../services/whatsappService';

interface SettingsViewProps {
  waConfig: WhatsAppConfig;
  aiConfig: AIConfig;
  onSaveWa: (cfg: WhatsAppConfig) => void;
  onSaveAi: (cfg: AIConfig) => void;
  isConnected: boolean;
  onSetConnected: (val: boolean) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  waConfig,
  aiConfig,
  onSaveWa,
  onSaveAi,
  isConnected,
  onSetConnected
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'persona' | 'knowledge' | 'training'>('persona');
  const [tempAi, setTempAi] = useState<AIConfig>(aiConfig);
  const [tempWa, setTempWa] = useState(waConfig);
  const [showQr, setShowQr] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [showTokenRaw, setShowTokenRaw] = useState(false);
  const [lastRawStatus, setLastRawStatus] = useState<string>('');

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Auto-recovery state
  const [forcingLogout, setForcingLogout] = useState(false);
  const [forceNewSession, setForceNewSession] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleGenerateQr = async () => {
    try {
      setLoadingQr(true);
      setCountdown(null);

      if (forceNewSession) {
        // ... existing force logic (short wait)
        try {
          console.log("Forcing logout before QR generation...");
          await logoutDevice(waConfig);
          await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
          console.error("Logout failed:", e);
        }
      } else {
        // ... existing check status logic
        try {
          const status: any = await checkDeviceStatus(waConfig);
          if (status.rawStatus) {
            const displayStatus = typeof status.rawStatus === 'string'
              ? status.rawStatus
              : JSON.stringify(status.rawStatus);
            setLastRawStatus(displayStatus);
          }
          if (status.status === 'connected') {
            onSetConnected(true);
            alert('Dispositivo já está conectado e pronto!');
            setLoadingQr(false);
            return;
          }
        } catch (e) {
          console.error("Status check failed", e);
        }
      }

      // 2. Try to get QR Code
      let url = await getQRCode(waConfig);

      // 3. Fallback logic with Countdown
      if (!url) {
        try {
          console.log("QR Code generation failed. Attempting force-restart...");
          setForcingLogout(true);
          await restartInstance(waConfig);

          // Countdown Loop (15 seconds)
          for (let i = 15; i > 0; i--) {
            setCountdown(i);
            await new Promise(r => setTimeout(r, 1000));
          }
          setCountdown(null);

          url = await getQRCode(waConfig);
          setForcingLogout(false);
        } catch (err) {
          console.error("Restart failed:", err);
          setForcingLogout(false);
          setCountdown(null);
        }
      }

      if (!url) {
        alert('Não foi possível gerar o QR Code. Verifique se o backend está rodando e se as credenciais estão corretas.');
        setLoadingQr(false);
        return;
      }

      if (url === "CONNECTED") {
        onSetConnected(true);
        alert('Dispositivo já está conectado e pronto!');
        setLoadingQr(false);
        return;
      }

      setQrUrl(url);
      setShowQr(true);
      setLoadingQr(false);

    } catch (error) {
      console.error("Critical error in handleGenerateQr:", error);
      alert('Erro ao gerar QR Code. Por favor, tente novamente ou verifique o console para mais detalhes.');
      setLoadingQr(false);
      setForcingLogout(false);
      setCountdown(null);
    }
  };

  const handleForceLogout = async () => {
    if (!confirm("Isso irá REINICIAR a instância na Z-API. Pode levar alguns segundos. Continuar?")) return;

    // Attempt restart first (more aggressive than logout)
    setForcingLogout(true);
    // Explicitly using restartInstance now
    const success = await restartInstance(waConfig);
    setForcingLogout(false);

    if (success) {
      onSetConnected(false);
      alert("Instância reiniciada com sucesso! Aguarde 10 segundos e tente gerar o QR Code.");
    } else {
      alert("Falha ao reiniciar instância. Verifique se o ID e Token estão corretos.");
    }
  };

  const handleSaveAi = () => {
    onSaveAi(tempAi);
    alert('Cérebro da IA atualizado com novos conhecimentos e treinamentos!');
  };

  // Helpers para Exemplos de Treinamento
  const handleAddExample = () => {
    const newExample: TrainingExample = {
      id: Math.random().toString(36).substr(2, 9),
      userQuery: '',
      expectedResponse: ''
    };
    setTempAi({ ...tempAi, trainingExamples: [...(tempAi.trainingExamples || []), newExample] });
  };

  const handleUpdateExample = (id: string, field: 'userQuery' | 'expectedResponse', value: string) => {
    setTempAi({
      ...tempAi,
      trainingExamples: tempAi.trainingExamples.map(ex => ex.id === id ? { ...ex, [field]: value } : ex)
    });
  };

  const handleUpdateKB = (id: string, field: 'title' | 'content', value: string) => {
    setTempAi({
      ...tempAi,
      knowledgeBase: tempAi.knowledgeBase.map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const handleRemoveKB = (id: string) => {
    setTempAi({ ...tempAi, knowledgeBase: tempAi.knowledgeBase.filter(item => item.id !== id) });
  };

  const handleSaveWaParams = () => {
    if (!isValidUrl(tempWa.webhookUrl)) {
      setUrlError(true);
      alert('Por favor, insira uma URL de Webhook válida.');
      return;
    }

    setUrlError(false);
    onSaveWa(tempWa);
    alert('Parâmetros Z-API atualizados!');
    setShowTechnical(false);
  };

  const handleUrlChange = (val: string) => {
    setTempWa({ ...tempWa, webhookUrl: val });
    if (urlError && isValidUrl(val)) {
      setUrlError(false);
    }
  };

  // Common Input Class for Technical Section
  const techInputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-[10px] text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600";
  const techLabelClass = "block text-[9px] font-bold text-slate-500 uppercase mb-1 ml-1";

  const handleAddKB = () => {
    const newItem: KnowledgeBaseItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      content: ''
    };
    setTempAi({ ...tempAi, knowledgeBase: [...(tempAi.knowledgeBase || []), newItem] });
  };

  const handleRemoveExample = (id: string) => {
    setTempAi({ ...tempAi, trainingExamples: tempAi.trainingExamples.filter(ex => ex.id !== id) });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Centro de Treinamento e IA</h2>
          <p className="text-gray-500">Gerencie a conexão do canal e a inteligência do seu agente.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
            <div className={`p-2 rounded-lg ${tempAi.enabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              <Bot size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-gray-400">Status do Agente</span>
              <button
                onClick={() => setTempAi({ ...tempAi, enabled: !tempAi.enabled })}
                className={`text-xs font-bold ${tempAi.enabled ? 'text-green-600' : 'text-red-500'} flex items-center gap-1`}
              >
                {tempAi.enabled ? 'Ativado' : 'Desativado'}
                <div className={`w-8 h-4 rounded-full relative transition-colors ${tempAi.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${tempAi.enabled ? 'right-0.5' : 'left-0.5'}`}></div>
                </div>
              </button>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase flex items-center gap-2 border ${isConnected ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {isConnected ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {isConnected ? 'WhatsApp Conectado' : 'Canal Desconectado'}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Lado Esquerdo: Conexão e Técnica (1 Coluna) */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Smartphone size={20} /></div>
              <h3 className="font-bold text-gray-900">Canal WhatsApp</h3>
            </div>

            {isConnected ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Status Ativo</p>
                  <p className="font-bold text-gray-800 text-xs">Pareado via {(waConfig.provider || 'Z-API').toUpperCase()}</p>
                </div>
                <button
                  onClick={() => onSetConnected(false)}
                  className="w-full py-2.5 rounded-lg border border-red-200 text-red-600 text-[10px] font-bold uppercase hover:bg-red-50 transition-colors"
                >
                  Desvincular Dispositivo
                </button>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <div className="bg-blue-50 p-4 rounded-xl inline-block">
                  <QrCode size={48} className="text-blue-600 mx-auto" />
                </div>

                {/* Status Diagnostico */}
                <div className="text-[10px] text-gray-400 bg-gray-50 py-1 px-2 rounded border border-gray-100 inline-block mb-2">
                  Diagnóstico: {loadingQr ? 'Verificando...' : (lastRawStatus ? `Status API: "${lastRawStatus}"` : 'Aguardando ação')}
                </div>

                <div className="flex items-center justify-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="forceNew"
                    checked={forceNewSession}
                    onChange={e => setForceNewSession(e.target.checked)}
                    className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="forceNew" className="text-[10px] text-gray-500 font-medium cursor-pointer select-none">
                    Forçar nova conexão (Desconectar atual)
                  </label>
                </div>

                <button
                  onClick={handleGenerateQr}
                  disabled={loadingQr || forcingLogout}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  {loadingQr || forcingLogout ? <RefreshCw className="animate-spin" size={16} /> : <QrCode size={16} />}
                  {forcingLogout
                    ? (countdown ? `Reiniciando... Aguarde ${countdown}s` : 'Reiniciando Instância...')
                    : 'Gerar QR Code'}
                </button>
                <div className="pt-2">
                  <button
                    onClick={handleForceLogout}
                    className="text-[10px] text-gray-400 underline hover:text-red-500"
                  >
                    Resetar Conexão (Forçar Logout)
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Info size={12} /> Parâmetros Técnicos
              </h4>
              <button onClick={() => setShowTechnical(!showTechnical)} className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase">
                {showTechnical ? 'Fechar' : 'Editar'}
              </button>
            </div>

            {showTechnical ? (
              <div className="space-y-4">
                {/* Provider Selector */}
                <div>
                  <label className={techLabelClass}>Provedor da API</label>
                  <select
                    className={techInputClass}
                    value={tempWa.provider || 'zapi'}
                    onChange={e => setTempWa({ ...tempWa, provider: e.target.value as any })}
                  >
                    <option value="zapi">Z-API (Padrão)</option>
                    <option value="ultramsg">UltraMsg</option>
                    <option value="official">WhatsApp Cloud API (Oficial)</option>
                  </select>
                </div>

                <div>
                  <label className={techLabelClass}>Instance ID</label>
                  <input
                    type="text"
                    className={techInputClass}
                    value={tempWa.instanceId}
                    onChange={e => setTempWa({ ...tempWa, instanceId: e.target.value })}
                    placeholder="ID da Instância"
                  />
                  <p className="text-[9px] text-gray-500 mt-1 ml-1">Deixe vazio para usar do .env</p>
                </div>

                <div>
                  <label className={techLabelClass}>Token / API Key</label>
                  <div className="relative">
                    <input
                      type={showTokenRaw ? "text" : "password"}
                      className={techInputClass}
                      value={tempWa.token}
                      onChange={e => setTempWa({ ...tempWa, token: e.target.value })}
                      placeholder="Token de Acesso"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTokenRaw(!showTokenRaw)}
                      className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-300"
                    >
                      {showTokenRaw ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </div>

                {/* Client Token (Specific to Z-API usually, but good to have generic) */}
                <div>
                  <label className={techLabelClass}>Client Token (Opcional)</label>
                  <input
                    type="text"
                    className={techInputClass}
                    value={tempWa.clientToken || ''}
                    onChange={e => setTempWa({ ...tempWa, clientToken: e.target.value })}
                    placeholder="Segurança Adicional (Client-Token)"
                  />
                </div>

                <div>
                  <label className={techLabelClass}>Webhook URL (Seu Backend)</label>
                  <div className="space-y-1">
                    <input
                      type="text"
                      className={`${techInputClass} ${urlError ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="https://seu-dominio.com/api/webhook/message"
                      value={tempWa.webhookUrl}
                      onChange={e => handleUrlChange(e.target.value)}
                    />
                    <p className="text-[9px] text-gray-400">
                      * Define onde receber mensagens. Configure igual no painel do provedor.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button onClick={handleSaveWaParams} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 shadow-md shadow-blue-900/20">
                    Salvar Configurações de Conexão
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 ml-1">Provedor</p>
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-1.5 text-[10px] text-blue-400 font-mono uppercase">
                    {waConfig.provider || 'Z-API'}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 ml-1">Instance ID</p>
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-1.5 text-[10px] text-slate-300 font-mono truncate">
                    {waConfig.instanceId || 'via .env'}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 ml-1">Webhook Configurado</p>
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-1.5 text-[10px] text-blue-400 font-mono truncate">
                    {waConfig.webhookUrl || "Não configurado"}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Lado Direito: IA Dashboard (3 Colunas) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            {/* Abas Internas da IA */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveSubTab('persona')}
                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeSubTab === 'persona' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                <Target size={16} /> Persona & Missão
              </button>
              <button
                onClick={() => setActiveSubTab('knowledge')}
                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeSubTab === 'knowledge' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                <BookOpen size={16} /> Base de Conhecimento
              </button>
              <button
                onClick={() => setActiveSubTab('training')}
                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeSubTab === 'training' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                <GraduationCap size={16} /> Exemplos de Treino
              </button>
            </div>

            <div className="p-8 flex-1">
              {/* ABA PERSONA */}
              {activeSubTab === 'persona' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Perfil do Agente</label>
                        <select
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                          value={tempAi.tone}
                          onChange={e => setTempAi({ ...tempAi, tone: e.target.value })}
                        >
                          <option value="Consultor Técnico Sênior">Consultor Técnico Sênior</option>
                          <option value="Vendedor Amigável e Persuasivo">Vendedor Amigável e Persuasivo</option>
                          <option value="Suporte de Luxo/VIP">Suporte de Luxo/VIP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 flex justify-between">
                          Temperatura (Criatividade) <span>{Math.round(tempAi.temperature * 100)}%</span>
                        </label>
                        <input
                          type="range" min="0" max="1" step="0.05"
                          className="w-full h-2 bg-gray-100 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                          value={tempAi.temperature}
                          onChange={e => setTempAi({ ...tempAi, temperature: parseFloat(e.target.value) })}
                        />
                        <div className="flex justify-between mt-2 px-1">
                          <span className="text-[8px] font-bold text-gray-300 uppercase">Conservador</span>
                          <span className="text-[8px] font-bold text-gray-300 uppercase">Improvisador</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Nome da Empresa / Pessoa</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: ZapAI Tecnologia, Dr. João Silva..."
                          value={tempAi.companyName || ''}
                          onChange={e => setTempAi({ ...tempAi, companyName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Celular do Dono (Para Avisos)</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: 5511999998888"
                          value={tempAi.adminPhone || ''}
                          onChange={e => setTempAi({ ...tempAi, adminPhone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Profissão do Agente</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Corretor de Imóveis, Vendedor, Dentista..."
                          value={tempAi.profession || ''}
                          onChange={e => setTempAi({ ...tempAi, profession: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Instrução Mestre (System Prompt)</label>
                      <textarea
                        className="w-full h-40 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                        value={tempAi.systemPrompt}
                        onChange={e => setTempAi({ ...tempAi, systemPrompt: e.target.value })}
                        placeholder="Defina as regras fundamentais e o contexto da empresa aqui..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA KNOWLEDGE BASE */}
              {activeSubTab === 'knowledge' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg">
                      <BookOpen size={16} />
                      <span className="text-[10px] font-bold uppercase">Cérebro Factual</span>
                    </div>
                    <button onClick={handleAddKB} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-blue-700 transition-all flex items-center gap-2">
                      <Plus size={14} /> Novo Artigo
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Tabela de Preços (Texto)</label>
                      <textarea
                        className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Insira sua lista de preços aqui..."
                        value={tempAi.priceTable || ''}
                        onChange={e => setTempAi({ ...tempAi, priceTable: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Agenda / Horários (Texto)</label>
                      <textarea
                        className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Insira seus horários disponíveis..."
                        value={tempAi.agenda || ''}
                        onChange={e => setTempAi({ ...tempAi, agenda: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {tempAi.knowledgeBase && tempAi.knowledgeBase.map((item) => (
                      <div key={item.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative group">
                        <button onClick={() => handleRemoveKB(item.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-blue-500" />
                          <input
                            className="bg-transparent border-none outline-none font-bold text-gray-800 placeholder-gray-400 w-full text-sm"
                            placeholder="Título do Artigo (ex: Tabela de Preços)"
                            value={item.title}
                            onChange={e => handleUpdateKB(item.id, 'title', e.target.value)}
                          />
                        </div>
                        <textarea
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-600 outline-none focus:ring-1 focus:ring-blue-500 h-24 resize-none leading-relaxed"
                          placeholder="Conteúdo detalhado: preços, horários, termos técnicos..."
                          value={item.content}
                          onChange={e => handleUpdateKB(item.id, 'content', e.target.value)}
                        />
                      </div>
                    ))}
                    {(!tempAi.knowledgeBase || tempAi.knowledgeBase.length === 0) && (
                      <div className="text-center py-16 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                        <BookOpen size={40} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-xs text-gray-400 font-medium">Sua base de conhecimento está vazia.<br />Adicione fatos para a IA responder com precisão.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA TRAINING */}
              {activeSubTab === 'training' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-100">
                      <MessageSquareQuote size={16} />
                      <span className="text-[10px] font-bold uppercase">Diretrizes Adicionais de Comportamento</span>
                    </div>
                    <textarea
                      className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed font-medium text-gray-700"
                      value={tempAi.behavioralDirectives}
                      onChange={e => setTempAi({ ...tempAi, behavioralDirectives: e.target.value })}
                      placeholder="Insira exemplos de conversas longas, regras de etiqueta, ou comportamentos específicos desejados (Ex: Sempre use emojis amigáveis; Se o cliente estiver bravo, transfira imediatamente...)"
                    />
                  </section>

                  <div className="h-px bg-gray-100"></div>

                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg">
                        <GraduationCap size={16} />
                        <span className="text-[10px] font-bold uppercase">Manual de Casos (Few-Shot)</span>
                      </div>
                      <button onClick={handleAddExample} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-blue-700 transition-all flex items-center gap-2">
                        <Plus size={14} /> Novo Caso
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {tempAi.trainingExamples && tempAi.trainingExamples.map((ex, index) => (
                        <div key={ex.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 relative">
                          <button onClick={() => handleRemoveExample(ex.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Exemplo #{index + 1}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Pergunta do Usuário</label>
                              <textarea
                                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-[11px] outline-none focus:ring-1 focus:ring-blue-500 h-20 resize-none font-medium text-gray-700"
                                value={ex.userQuery}
                                onChange={e => handleUpdateExample(ex.id, 'userQuery', e.target.value)}
                                placeholder="Como o cliente costuma perguntar?"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Resposta Desejada</label>
                              <textarea
                                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-[11px] text-blue-700 font-bold outline-none focus:ring-1 focus:ring-blue-500 h-20 resize-none"
                                value={ex.expectedResponse}
                                onChange={e => handleUpdateExample(ex.id, 'expectedResponse', e.target.value)}
                                placeholder="Como você quer que a IA responda?"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-gray-100 bg-white">
              <button
                onClick={handleSaveAi}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <Save size={20} /> Salvar e Consolidar Cérebro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal QR Code (Visual Refined) */}
      {showQr && (
        <div translate="no" className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl border border-gray-100">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Vincular WhatsApp</h3>
              <p className="text-xs text-gray-500 mt-2">Abra o WhatsApp no seu celular &gt; Configurações &gt; Dispositivos Conectados e aponte para o código.</p>
            </div>
            <div className="bg-white p-6 border-2 border-dashed border-gray-100 rounded-[32px] inline-block shadow-inner">
              <img key={qrUrl} src={qrUrl} alt="QR" className="w-56 h-56 rounded-xl" />
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { onSetConnected(true); setShowQr(false); }}
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
              >
                Dispositivo Pareado
              </button>
              <button onClick={() => setShowQr(false)} className="w-full py-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:text-gray-600">Cancelar Conexão</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
