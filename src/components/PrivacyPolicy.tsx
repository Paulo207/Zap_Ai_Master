import React from 'react';
import { Shield } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
                <div className="p-3 bg-blue-100 rounded-xl">
                    <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Política de Privacidade</h1>
            </div>

            <div className="prose prose-slate max-w-none">
                <p className="text-gray-600 mb-6">
                    Última atualização: {new Date().toLocaleDateString('pt-BR')}
                </p>

                <section className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">1. Introdução</h2>
                    <p className="text-gray-600 leading-relaxed">
                        A ZapAI valoriza a sua privacidade. Esta política descreve como coletamos, usamos e protegemos
                        suas informações pessoais ao utilizar nosso sistema de automação de atendimento.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">2. Dados Coletados</h2>
                    <p className="text-gray-600 leading-relaxed mb-3">
                        Coletamos as seguintes informações para o funcionamento do serviço:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                        <li>Informações de conta (nome, e-mail, telefone).</li>
                        <li>Dados das conversas processadas pelo bot para fins de histórico e melhoria do serviço.</li>
                        <li>Logs de acesso e uso do sistema para segurança e auditoria.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">3. Uso das Informações</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Utilizamos seus dados para fornecer, manter e melhorar nossos serviços, além de comunicar
                        atualizações importantes e garantir a segurança da plataforma. Não vendemos seus dados para terceiros.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">4. Segurança</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso,
                        alteração, divulgação ou destruição não autorizados.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-800 mb-3">5. Contato</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Se tiver dúvidas sobre esta política, entre em contato através do nosso suporte.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
