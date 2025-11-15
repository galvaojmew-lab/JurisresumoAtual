import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const PendingApprovalPage: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-center">
            <div className="w-full max-w-lg p-8 space-y-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Aguardando Aprovação</h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Olá, <span className="font-semibold">{currentUser?.email}</span>.
                    <br />
                    Sua conta foi criada com sucesso e está aguardando a aprovação de um administrador.
                    <br />
                    Você será notificado por e-mail quando seu acesso for liberado.
                </p>
                <button
                    onClick={handleLogout}
                    className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-md hover:bg-slate-700 transition"
                >
                    Sair
                </button>
            </div>
        </div>
    );
};

export default PendingApprovalPage;
