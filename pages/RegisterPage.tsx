import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';

const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            addToast('As senhas não coincidem.', 'error');
            return;
        }
        if (password.length < 6) {
            addToast('A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await register(email, password);
            addToast('Cadastro realizado com sucesso! Aguarde a aprovação do administrador.', 'success');
            navigate('/login');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            addToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Crie sua Conta</h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">O acesso será liberado após aprovação.</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email"  className="block text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</label>
                        <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-3 border border-slate-300 rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
                        <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 p-3 border border-slate-300 rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                     <div>
                        <label htmlFor="confirm-password"  className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar Senha</label>
                        <input id="confirm-password" name="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full mt-1 p-3 border border-slate-300 rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-slate-400 flex items-center justify-center transition">
                         {isLoading ? <Spinner /> : 'Cadastrar'}
                    </button>
                </form>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        Faça login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
