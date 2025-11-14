import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateSummaries } from '../services/geminiService';
import { parseFile } from '../services/fileParserService';
import { saveSummary } from '../services/historyService';
import Spinner from '../components/Spinner';
import SummaryDisplay from '../components/SummaryDisplay';
import { MAX_FILE_SIZE, MAX_TEXT_LENGTH } from '../constants';
import { useToast } from '../hooks/useToast';

// Declarations for CDN libraries
declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
        save: any; // Corrected from htmlToDocx
    }
}

const HomePage: React.FC = () => {
    const [rawText, setRawText] = useState<string>('');
    const [summaries, setSummaries] = useState<{ technical: string; simplified: string } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [options, setOptions] = useState({
        technical: true,
        simplified: true,
        size: 'medium' as 'short' | 'medium' | 'long',
    });
    const [activeTab, setActiveTab] = useState<'technical' | 'simplified'>('technical');
    const { addToast } = useToast();
    const summaryDisplayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cachedSummaries = localStorage.getItem('lastSummaries');
        const cachedText = localStorage.getItem('lastRawText');
        if (cachedSummaries && cachedText) {
            setSummaries(JSON.parse(cachedSummaries));
            setRawText(cachedText);
        }
    }, []);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            addToast('Erro: O arquivo excede o limite de 50MB.', 'error');
            return;
        }

        setIsLoading(true);
        setSummaries(null);
        setRawText('');
        setFileName(file.name);
        try {
            const text = await parseFile(file);
            if (text.length > MAX_TEXT_LENGTH) {
                addToast(`Aviso: O texto extraído excede ${MAX_TEXT_LENGTH} caracteres e foi truncado.`, 'warning');
                setRawText(text.substring(0, MAX_TEXT_LENGTH));
            } else {
                setRawText(text);
            }
            addToast('Arquivo processado com sucesso!', 'success');
        } catch (error) {
            console.error('Error parsing file:', error);
            addToast('Falha ao processar o arquivo. Verifique o formato.', 'error');
        } finally {
            setIsLoading(false);
            event.target.value = '';
        }
    };

    const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        let currentText = event.target.value;
        if (currentText.length > MAX_TEXT_LENGTH) {
            addToast(`O texto não pode exceder ${MAX_TEXT_LENGTH} caracteres.`, 'warning');
            currentText = currentText.substring(0, MAX_TEXT_LENGTH);
        }
        setRawText(currentText);
        setFileName(null);
    };

    const handleGenerateSummary = useCallback(async () => {
        if (!rawText.trim()) {
            addToast('Por favor, insira um texto ou envie um arquivo.', 'error');
            return;
        }
        if (!options.technical && !options.simplified) {
            addToast('Selecione ao menos um tipo de resumo para gerar.', 'error');
            return;
        }

        setIsLoading(true);
        setSummaries(null);
        try {
            const result = await generateSummaries(rawText, {
                generateTechnical: options.technical,
                generateSimplified: options.simplified,
                size: options.size,
            });

            const finalSummaries = {
                technical: result.technical || '',
                simplified: result.simplified || '',
            };
            setSummaries(finalSummaries);

            const processNumberMatch = finalSummaries.technical.match(/\*\*Número do Processo:\*\*\s*(.*)/);
            const processNumber = processNumberMatch ? processNumberMatch[1].trim() : 'Não encontrado';

            const newEntry = {
                id: new Date().toISOString(),
                date: new Date().toISOString(),
                summaryTechnical: finalSummaries.technical,
                summarySimplified: finalSummaries.simplified,
                rawText: rawText,
                processNumber: processNumber,
                originalFileName: fileName,
            };
            saveSummary(newEntry);
            localStorage.setItem('lastSummaries', JSON.stringify(finalSummaries));
            localStorage.setItem('lastRawText', rawText);
            addToast('Resumos gerados e salvos no histórico!', 'success');
        } catch (error) {
            console.error('Error generating summary:', error);
            if (error instanceof Error) {
                if (error.message === "API_KEY_MISSING") {
                    addToast('Erro: A chave de API do Google não foi configurada.', 'error');
                } else {
                    addToast(error.message, 'error');
                }
            } else {
                addToast('Ocorreu um erro desconhecido ao gerar o resumo.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }, [rawText, fileName, options, addToast]);

    const handleCopy = () => {
        const summaryText = (activeTab === 'technical' ? summaries?.technical : summaries?.simplified) || '';
        navigator.clipboard.writeText(summaryText);
        addToast('Resumo copiado para a área de transferência!', 'success');
    };

    const handleExport = async (format: 'pdf' | 'docx') => {
        const element = summaryDisplayRef.current;
        if (!element || !summaries) return;
        
        const processNumberMatch = summaries.technical.match(/\*\*Número do Processo:\*\*\s*(.*)/);
        const processNumber = processNumberMatch ? processNumberMatch[1].trim() : 'Export';

        if(format === 'pdf'){
            const { jsPDF } = window.jspdf;
            const canvas = await window.html2canvas(element, { scale: 2 });
            const data = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`resumo_${processNumber.replace(/\W/g, '_')}.pdf`);
        } else {
            const header = `<h1 style="font-family: Arial, sans-serif; font-size: 16pt;">Resumo do Processo: ${processNumber}</h1>`;
            const content = header + element.innerHTML;
             window.save(content, {
                filename: `resumo_${processNumber.replace(/\W/g, '_')}.docx`,
            });
        }
        addToast(`Resumo exportado como ${format.toUpperCase()}!`, 'success');
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">Resumir Processo Judicial</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex flex-col">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">1. Forneça o texto</h2>
                         <div className="flex items-center justify-center w-full mb-4">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:hover:bg-bray-800 dark:bg-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-600">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-4 text-slate-500 dark:text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                                    <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">PDF ou DOCX (MAX. 50MB)</p>
                                </div>
                                <input id="dropzone-file" type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                            </label>
                        </div>
                        <div className="text-center my-4 text-slate-500 dark:text-slate-400">ou</div>
                        <textarea value={rawText} onChange={handleTextChange} placeholder="Cole o texto do processo aqui..." className="w-full h-48 p-3 border border-slate-300 rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 transition"/>
                        <div className="text-right text-sm text-slate-500 dark:text-slate-400 mt-1">{rawText.length} / {MAX_TEXT_LENGTH}</div>
                    </div>
                    
                    {rawText && (
                        <div className="mt-6 border-t pt-6 border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-semibold mb-4">2. Opções de Resumo</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="font-semibold">Tipos de Resumo:</label>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <label className="flex items-center"><input type="checkbox" checked={options.technical} onChange={e => setOptions({...options, technical: e.target.checked})} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"/> <span className="ml-2">Técnico Jurídico</span></label>
                                        <label className="flex items-center"><input type="checkbox" checked={options.simplified} onChange={e => setOptions({...options, simplified: e.target.checked})} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"/> <span className="ml-2">Simplificado (Cliente)</span></label>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="size-select" className="font-semibold">Tamanho do Resumo Técnico:</label>
                                    <select id="size-select" value={options.size} onChange={e => setOptions({...options, size: e.target.value as any})} className="w-full mt-2 p-2 border border-slate-300 rounded-md bg-white dark:bg-slate-700 dark:border-slate-600">
                                        <option value="short">Curto (~500 palavras)</option>
                                        <option value="medium">Médio (~1000 palavras)</option>
                                        <option value="long">Longo (até 1500 palavras)</option>
                                    </select>
                                </div>
                            </div>
                             <button onClick={handleGenerateSummary} disabled={isLoading} className="w-full mt-6 bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-slate-400 flex items-center justify-center transition">
                                {isLoading ? <><Spinner /> <span className="ml-2">Gerando Resumos...</span></> : 'Gerar Resumos com IA'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Output Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">3. Resumos Gerados</h2>
                    <div className="h-full">
                        {isLoading && !summaries && (<div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400"><Spinner size="h-8 w-8" color="text-blue-500"/><p className="mt-4">Analisando e gerando resumos...</p></div>)}
                        {!isLoading && !summaries && (<div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500"><p>Os resumos aparecerão aqui.</p></div>)}
                        {summaries && (
                            <div>
                                <div className="border-b border-slate-200 dark:border-slate-700">
                                    <nav className="-mb-px flex space-x-6">
                                        {summaries.technical && <button onClick={() => setActiveTab('technical')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'technical' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Resumo Técnico</button>}
                                        {summaries.simplified && <button onClick={() => setActiveTab('simplified')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'simplified' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Resumo para Cliente</button>}
                                    </nav>
                                </div>
                                <div className="mt-4 flex space-x-2">
                                    <button onClick={handleCopy} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 text-sm transition">Copiar</button>
                                    <button onClick={() => handleExport('pdf')} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 text-sm transition">Exportar PDF</button>
                                    <button onClick={() => handleExport('docx')} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 text-sm transition">Exportar DOCX</button>
                                </div>
                                <div ref={summaryDisplayRef} className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md max-h-[60vh] overflow-y-auto">
                                   <SummaryDisplay summary={activeTab === 'technical' ? summaries.technical : summaries.simplified} />
                                </div>
                                {summaries.technical.length < 50 && summaries.simplified.length < 50 && !isLoading && <p className="text-sm text-yellow-600 mt-2">Aviso: O resumo parece curto. Verifique se o documento continha texto legível ou se a resposta da IA foi truncada.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;