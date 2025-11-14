
import React from 'react';

interface SummaryDisplayProps {
  summary: string;
}

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary }) => {
  // Use a simple parser to render bold text and paragraphs.
  const renderSummary = () => {
    return summary.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;

      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={index} className="mb-2">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-semibold text-slate-800 dark:text-slate-100">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {renderSummary()}
    </div>
  );
};

export default SummaryDisplay;
