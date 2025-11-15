import React, { useState, useEffect } from 'react';
import { User } from '../types';
import * as authService from '../services/authService';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

const AdminPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const { currentUser } = useAuth();

    const fetchUsers = () => {
        setLoading(true);
        try {
            // Fetch all users except the current admin
            const allUsers = authService.getAllUsers().filter(u => u.id !== currentUser?.id);
            setUsers(allUsers);
        } catch (error) {
            addToast('Falha ao carregar usuários.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApprovalChange = (user: User, isApproved: boolean) => {
        try {
            authService.updateUserApproval(user.id, isApproved);
            setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? { ...u, isApproved } : u));
            addToast(`Usuário ${user.email} ${isApproved ? 'aprovado' : 'reprovado'}.`, 'success');
        } catch (error) {
            addToast('Falha ao atualizar status do usuário.', 'error');
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">Painel de Administração</h1>
            <p className="mb-6 text-slate-600 dark:text-slate-400">Gerencie o acesso dos usuários à plataforma.</p>

            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">E-mail</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={3} className="text-center p-8 text-slate-500">Carregando...</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700">
                                        <td className="p-4">{user.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isApproved ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                                                {user.isApproved ? 'Aprovado' : 'Pendente'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <label htmlFor={`toggle-${user.id}`} className="flex items-center cursor-pointer justify-center">
                                                <div className="relative">
                                                <input type="checkbox" id={`toggle-${user.id}`} className="sr-only" checked={user.isApproved} onChange={(e) => handleApprovalChange(user, e.target.checked)} />
                                                <div className="block bg-slate-300 dark:bg-slate-600 w-14 h-8 rounded-full"></div>
                                                <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                                                </div>
                                            </label>
                                        </td>
                                    </tr>
                                ))
                            )}
                            {!loading && users.length === 0 && (
                                <tr><td colSpan={3} className="text-center p-8 text-slate-500">Nenhum usuário para aprovar.</td></tr>
                            )}
                        </tbody>
                    </table>
                    <style>{`
                        .dot {
                            transform: translateX(0);
                        }
                        input:checked ~ .dot {
                            transform: translateX(100%);
                        }
                        input:checked ~ .block {
                            background-color: #2563eb; /* bg-blue-600 */
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
