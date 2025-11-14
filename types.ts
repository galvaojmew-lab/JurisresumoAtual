export interface SummaryEntry {
  id: string;
  date: string;
  processNumber: string;
  summaryTechnical: string;
  summarySimplified: string;
  originalFileName: string | null;
  rawText: string;
}