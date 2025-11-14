
// pdf.js and mammoth are loaded from CDN and available on the window object.
declare global {
    interface Window {
        pdfjsLib: any;
        mammoth: any;
    }
}

/**
 * Parses a file (PDF or DOCX) and returns its text content.
 * @param file The file to parse.
 * @returns A promise that resolves with the extracted text.
 */
export async function parseFile(file: File): Promise<string> {
    const fileType = file.type;
    if (fileType === 'application/pdf') {
        return parsePdf(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return parseDocx(file);
    } else {
        throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
    }
}

async function parsePdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
    const numPages = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}

async function parseDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value;
}
