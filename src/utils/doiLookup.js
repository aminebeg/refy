/**
 * DOI lookup utilities
 * Fetch metadata from CrossRef and other sources using DOI
 */

/**
 * Clean abstract text by removing JATS XML tags
 * @param {string} text - Abstract text that may contain XML tags
 * @returns {string} Cleaned abstract text
 */
function cleanAbstract(text) {
    if (!text) return '';

    // Remove all JATS XML tags (e.g., <jats:title>, <jats:p>, etc.)
    let cleaned = text.replace(/<jats:[^>]+>/g, '');
    cleaned = cleaned.replace(/<\/jats:[^>]+>/g, '');

    // Remove any other XML/HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&quot;/g, '"');
    cleaned = cleaned.replace(/&apos;/g, "'");

    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
}

/**
 * Lookup paper metadata using DOI from CrossRef
 * @param {string} doi - Digital Object Identifier
 * @returns {Promise<Object|null>} Paper metadata or null
 */
export async function lookupDOI(doi) {
    if (!doi || doi.trim().length === 0) {
        return null;
    }

    // Clean DOI (remove https://doi.org/ prefix if present)
    const cleanDOI = doi.replace(/^https?:\/\/doi\.org\//, '').trim();

    try {
        const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDOI)}`;
        console.log('Looking up DOI:', cleanDOI);

        const response = await fetch(url);

        if (!response.ok) {
            console.warn('DOI lookup failed:', response.status);
            return null;
        }

        const data = await response.json();
        const item = data.message;

        if (!item) {
            return null;
        }

        console.log('DOI lookup successful:', item);

        // Map CrossRef type to reference type
        const typeMapping = {
            'journal-article': 'Journal Article',
            'proceedings-article': 'Conference Paper',
            'book-chapter': 'Book Chapter',
            'book': 'Book',
            'monograph': 'Book',
            'posted-content': 'Preprint',
            'report': 'Technical Report',
            'dissertation': 'Thesis'
        };

        const referenceType = typeMapping[item.type] || 'Journal Article';

        // Extract editor information if available
        const editors = item.editor?.map(e => {
            const given = e.given || '';
            const family = e.family || '';
            return family ? `${family}, ${given}`.trim() : given;
        }).filter(Boolean) || [];

        // Get published date
        const publishedDate = item.published?.['date-parts']?.[0];
        const year = publishedDate?.[0] || new Date().getFullYear();
        const month = publishedDate?.[1] ? publishedDate[1] : null;

        return {
            doi: cleanDOI,
            title: item.title?.[0] || '',
            authors: item.author?.map(a => {
                const given = a.given || '';
                const family = a.family || '';
                return family ? `${family}, ${given}`.trim() : given;
            }).filter(Boolean) || [],
            year: year,
            month: month,
            journal: item['container-title']?.[0] || '',
            abstract: cleanAbstract(item.abstract) || '',
            type: referenceType,
            volume: item.volume || '',
            issue: item.issue || '',
            pages: item.page || '',
            articleNumber: item['article-number'] || '',
            publisher: item.publisher || '',
            isbn: item.ISBN?.[0] || '',
            issn: item.ISSN?.[0] || '',
            url: item.URL || `https://doi.org/${cleanDOI}`,
            // Additional BibTeX fields
            editors: editors,
            series: item['container-title']?.[1] || '',
            edition: item.edition || '',
            // Full citation info for BibTeX generation
            citationKey: generateCitationKey(item),
            source: 'CrossRef (DOI)'
        };
    } catch (error) {
        console.error('Error looking up DOI:', error);
        return null;
    }
}

/**
 * Generate BibTeX citation key from metadata
 * @param {Object} item - CrossRef metadata
 * @returns {string} Citation key
 */
function generateCitationKey(item) {
    const firstAuthor = item.author?.[0];
    const lastName = firstAuthor?.family || 'Unknown';
    const year = item.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear();

    // Clean last name (remove spaces, special characters)
    const cleanLastName = lastName.replace(/[^a-zA-Z]/g, '');

    return `${cleanLastName}${year}`;
}

/**
 * Validate DOI format
 * @param {string} doi - DOI to validate
 * @returns {boolean} True if valid DOI format
 */
export function isValidDOI(doi) {
    if (!doi) return false;

    // Clean DOI
    const cleanDOI = doi.replace(/^https?:\/\/doi\.org\//, '').trim();

    // DOI format: 10.xxxx/yyyy
    const doiPattern = /^10\.\d{4,}\/[^\s]+$/;
    return doiPattern.test(cleanDOI);
}

/**
 * Format DOI as URL
 * @param {string} doi - DOI to format
 * @returns {string} DOI URL
 */
export function formatDOIUrl(doi) {
    if (!doi) return '';

    const cleanDOI = doi.replace(/^https?:\/\/doi\.org\//, '').trim();
    return `https://doi.org/${cleanDOI}`;
}

/**
 * Extract DOI from text with improved patterns
 * @param {string} text - Text to search for DOI
 * @returns {string|null} Extracted DOI or null
 */
export function extractDOI(text) {
    if (!text) return null;

    // Multiple DOI patterns
    const patterns = [
        // Standard DOI with doi: prefix
        /doi:\s*(10\.\d{4,}\/[^\s]+)/i,
        // DOI URL
        /https?:\/\/doi\.org\/(10\.\d{4,}\/[^\s]+)/i,
        // DOI with DOI: prefix
        /DOI:\s*(10\.\d{4,}\/[^\s]+)/i,
        // Plain DOI
        /\b(10\.\d{4,}\/[^\s]+)\b/
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const doi = match[1].trim();
            // Remove trailing punctuation
            return doi.replace(/[.,;:!?]$/, '');
        }
    }

    return null;
}
