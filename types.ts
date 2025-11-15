export interface SummaryEntry {
  id: string;
  date: string;
  processNumber: string;
  summaryTechnical: string;
  summarySimplified: string;
  originalFileName: string | null;
  rawText: string;
}

export interface User {
  id: string;
  email: string;
  password?: string; // Stored insecurely for this prototype
  isApproved: boolean;
  isAdmin: boolean;
}