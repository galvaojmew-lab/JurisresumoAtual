import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getHistory } from '../services/historyService';
import { SummaryEntry } from '../types';
import Modal from '../components/Modal';
import SummaryDisplay from '../components/SummaryDisplay';
import { useToast } from '../hooks/useToast';

// Declarations for CDN libraries
declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
        save: any; // Corrected from htmlToDocx
    }
}

const HistoryPage: React.FC = () => {
    const [history, setHistory] = useState<SummaryEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEntry, setSelectedEntry] = useState<SummaryEntry | null>(null);
    const [activeTab, setActiveTab] = useState<'technical' | 'simplified'>('technical');
    const { addToast } = useToast();
    const summaryDisplayRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        setHistory(getHistory());
    }, []);

    const filteredHistory = useMemo(() => {
        return history.filter(entry =>
            entry.processNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            new Date(entry.date).toLocaleDateString().includes(searchTerm)
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [history, searchTerm]);

    const openModal = (entry: SummaryEntry) => {
        setSelectedEntry(entry);
        setActiveTab('technical'); // Reset to default tab on open
    };

    const handleCopySummary = () => {
        if (selectedEntry) {
            const summaryText = activeTab === 'technical' ? selectedEntry.summaryTechnical : selectedEntry.summarySimplified;
            navigator.clipboard.writeText(summaryText);
            addToast('Resumo copiado para a área de transferência!', 'success');
        }
    };
    
    const handleExport = async (format: 'json' | 'csv' | 'pdf' | 'docx') => {
        if (!selectedEntry) return;

        if (format === 'pdf' || format === 'docx') {
            const element = summaryDisplayRef.current;
            if (!element) return;
            
            const processNumber = selectedEntry.processNumber || 'Export';
    
            if(format === 'pdf'){
                const { jsPDF } = window.jspdf;
                const canvas = await window.html2canvas(element, { scale: 2 });
                const data = canvas.toDataURL('image/png');
                
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`resumo_${processNumber.replace(/\W/g, '_')}.pdf`);
            } else { // docx
                const header = `<h1 style="font-family: Arial, sans-serif; font-size: 16pt;">Resumo do Processo: ${processNumber}</h1>`;
                const content = header + element.innerHTML;
                 window.save(content, {
                    filename: `resumo_${processNumber.replace(/\W/g, '_')}.docx`,
                });
            }
            addToast(`Resumo exportado como ${format.toUpperCase()}!`, 'success');
            return;
        }


        let data: string;
        let filename: string;
        let mimeType: string;

        if (format === 'json') {
            data = JSON.stringify(selectedEntry, null, 2);
            filename = `resumo_${selectedEntry.processNumber.replace(/\W/g, '_')}.json`;
            mimeType = 'application/json';
        } else { // CSV
            const headers: (keyof SummaryEntry)[] = ['id', 'date', 'processNumber', 'summaryTechnical', 'summarySimplified', 'originalFileName', 'rawText'];
            const values = headers.map(header => JSON.stringify(selectedEntry[header] ?? '')).join(',');
            data = headers.join(',') + '\r\n' + values;
            filename = `resumo_${selectedEntry.processNumber.replace(/\W/g, '_')}.csv`;
            mimeType = 'text/csv';
        }

        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(`Dados exportados como ${format.toUpperCase()}!`, 'success');
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">Histórico de Resumos</h1>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Buscar por nº do processo ou data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-lg p-3 border border-slate-300 rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="bg-white dark:bg-slate-800 p-2 md:p-6 rounded-lg shadow-md">
                {filteredHistory.length > 0 ? (
                    <div className="space-y-4">
                        {filteredHistory.map(entry => (
                            <div
                                key={entry.id}
                                className="p-4 border dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                                onClick={() => openModal(entry)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-blue-600 dark:text-blue-400">{entry.processNumber}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(entry.date).toLocaleString()}</p>
                                    </div>
                                    <span className="text-sm text-slate-500 dark:text-slate-400 hidden md:block">{entry.originalFileName || 'Texto colado'}</span>
                                </div>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                    {entry.summaryTechnical.replace(/\*\*/g, '')}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <p>Nenhum resumo encontrado.</p>
                        <p className="text-sm">Gere um novo resumo na página principal.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={!!selectedEntry} onClose={() => setSelectedEntry(null)} title={`Detalhes: ${selectedEntry?.processNumber}`}>
                {selectedEntry && (
                    <div>
                         <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
                            <nav className="-mb-px flex space-x-6">
                                <button onClick={() => setActiveTab('technical')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'technical' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Técnico</button>
                                <button onClick={() => setActiveTab('simplified')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'simplified' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Simplificado</button>
                            </nav>
                        </div>
                        <div ref={summaryDisplayRef} className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-md max-h-[50vh] overflow-y-auto">
                            <SummaryDisplay summary={activeTab === 'technical' ? selectedEntry.summaryTechnical : selectedEntry.summarySimplified} />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-6">
                             <button onClick={handleCopySummary} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition">Copiar</button>
                             <button onClick={() => handleExport('pdf')} className="bg-slate-500 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-600 transition">Exportar PDF</button>
                             <button onClick={() => handleExport('docx')} className="bg-slate-500 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-600 transition">Exportar DOCX</button>
                             <button onClick={() => handleExport('json')} className="bg-gray-500 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 transition">Exportar JSON</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default HistoryPage;