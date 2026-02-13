import React from 'react';
import { FileText } from 'lucide-react';

const TermsOfUse: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
                <div className="p-3 bg-purple-100 rounded-xl">
                    <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Termos de Uso</h1>
            </div>

            <div className="prose prose-slate max-w-none">
                <p className="text-gray-600 mb-6">
                    Última atualização: {new Date().toLocaleDateString('pt-BR')}
                </p>

                <section className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">1. Aceitação dos Termos</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Ao acessar e usar a plataforma ZapAI, você concorda em cumprir estes Termos de Uso e todas as
                        leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido
                        de usar ou acessar este site.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">2. Licença de Uso</h2>
                    <p className="text-gray-600 leading-relaxed mb-3">
                        É concedida permissão para usar o software ZapAI para fins comerciais próprios, sujeito às seguintes restrições:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                        <li>Não modificar ou copiar os materiais do software sem autorização.</li>
                        <li>Não usar o serviço para enviar spam ou conteúdo ilegal.</li>
                        <li>Não tentar realizar engenharia reversa de qualquer software contido na plataforma.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">3. Isenção de Responsabilidade</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Os serviços são fornecidos "como estão". A ZapAI não oferece garantias, expressas ou implícitas,
                        e por este meio isenta e nega todas as outras garantias, incluindo, sem limitação, garantias
                        implícitas de comercialização ou adequação a um fim específico.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">4. Limitação de Responsabilidade</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Em nenhum caso a ZapAI ou seus fornecedores serão responsáveis por quaisquer danos decorrentes
                        do uso ou incapacidade de usar os serviços.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-800 mb-3">5. Modificações</h2>
                    <p className="text-gray-600 leading-relaxed">
                        A ZapAI pode revisar estes termos de serviço a qualquer momento sem aviso prévio. Ao usar este
                        site, você concorda em ficar vinculado pela versão atual desses termos de serviço.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default TermsOfUse;
