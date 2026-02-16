
import React, { useState } from 'react';
import { Zap, ShieldCheck, Mail, Lock, Sparkles } from 'lucide-react';
import { User } from '../types';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface LoginProps {
  onLogin: (user: Partial<User>) => void;
  googleEnabled?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, googleEnabled = true }) => {
  const [email, setEmail] = useState('admin@zapai.com');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'google' | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginMethod('email');

    // Simulando delay de rede para autenticação por e-mail
    setTimeout(() => {
      onLogin({
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: 'Diretor de Atendimento',
        email,
        isAuthenticated: true
      });
      setIsLoading(false);
    }, 1200);
  };

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    setLoginMethod('google');

    try {
      if (credentialResponse.credential) {
        const decoded: any = jwtDecode(credentialResponse.credential);

        onLogin({
          id: decoded.sub || 'google_' + Date.now(),
          name: decoded.name || 'Usuário Google',
          email: decoded.email || '',
          isAuthenticated: true
        });
      }
    } catch (error) {
      console.error("Google Login Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Login Failed');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden relative">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden p-8 md:p-12 animate-in fade-in zoom-in-95 duration-700 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 rounded-3xl mb-6 shadow-inner relative group">
            <Zap className="w-12 h-12 text-blue-600 fill-current group-hover:scale-110 transition-transform duration-500" />
            <Sparkles className="absolute -top-2 -right-2 text-amber-400 w-6 h-6 animate-bounce" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">ZapAI Master</h2>
          <p className="text-slate-400 mt-2 font-medium">Enterprise Automation Hub</p>
        </div>

        <div className="space-y-6">
          {/* Botão Google - UI Aprimorada */}
          {googleEnabled && (
            <div className="w-full flex justify-center pb-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                auto_select={false}
                theme="filled_blue"
                size="large"
                shape="pill"
                text="signin_with"
                width="320"
              />
            </div>
          )}

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-slate-100"></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">ou por e-mail</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-wide">ID de Acesso</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-700"
                  placeholder="admin@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-wide">Chave de Segurança</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-700"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-200 disabled:opacity-50 active:scale-[0.98] mt-4"
            >
              {isLoading && loginMethod === 'email' ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><ShieldCheck size={20} /> Acessar Dashboard</>
              )}
            </button>

            {/* Botão de Atalho para Desenvolvimento */}
            <button
              type="button"
              onClick={() => {
                setEmail('admin@zapai.com');
                setPassword('password');
                // Trigger submit logic indirectly
                setTimeout(() => {
                  const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
                  document.querySelector('form')?.dispatchEvent(submitEvent);
                }, 100);
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 mt-2"
            >
              🚀 Acesso Rápido (Entrar como Admin)
            </button>
          </form>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-50 text-center space-y-4">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
            Powered by ZapAI Intelligence
          </p>
          <div className="flex justify-center gap-6 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <button className="hover:text-blue-500 transition-colors" onClick={() => alert('Política de Privacidade acessível no dashboard.')}>Privacidade</button>
            <button className="hover:text-blue-500 transition-colors" onClick={() => alert('Termos de Uso acessíveis no dashboard.')}>Termos</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
