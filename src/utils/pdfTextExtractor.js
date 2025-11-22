import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

/**
 * Extract text from a PDF file
 * @param {File|Blob} file - The PDF file to parse
 * @param {number} maxPages - Maximum number of pages to extract (default 15 to save tokens)
 * @returns {Promise<string>} Extracted text
 */
export async function extractPDFText(file, maxPages = 15) {
    try {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Load PDF document
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        const pagesToRead = Math.min(maxPages, pdf.numPages);

        for (let i = 1; i <= pagesToRead; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }

        return fullText;
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        throw new Error('Failed to extract text from PDF');
    }
}
