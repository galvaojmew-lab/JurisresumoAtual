
import React from 'react';
import { clearHistory } from '../services/historyService';
import { useToast } from '../hooks/useToast';

const SettingsPage: React.FC = () => {
    const { addToast } = useToast();

    const handleClearHistory = () => {
        if (window.confirm('Tem certeza que deseja apagar todo o histórico de resumos? Esta ação não pode ser desfeita.')) {
            clearHistory();
            addToast('Histórico apagado com sucesso!', 'success');
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">Configurações</h1>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Segurança e Privacidade</h2>
                <div className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h3 className="font-bold text-blue-800 dark:text-blue-300">Seus dados são privados.</h3>
                        <p className="text-slate-600 dark:text-slate-300 mt-1">
                            O JurisResumo foi projetado com a sua privacidade em mente. Todos os processos, textos e resumos gerados são armazenados <strong>exclusivamente no seu navegador/dispositivo</strong> através do Local Storage. Nenhum dado de processo é enviado ou armazenado em nossos servidores.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Gerenciamento de Dados</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Você pode apagar todo o seu histórico de resumos permanentemente. Esta ação não pode ser desfeita.
                </p>
                <button
                    onClick={handleClearHistory}
                    className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition"
                >
                    Apagar Todo o Histórico
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;
