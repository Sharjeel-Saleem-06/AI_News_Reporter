/**
 * Utility functions for the AI News app
 */

/**
 * Strip HTML tags from a string and decode HTML entities
 */
export function stripHtml(html: string): string {
    if (!html) return '';
    
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, '');
    
    // Decode common HTML entities
    text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&hellip;/g, '...')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"');
    
    // Remove excessive whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
}

/**
 * Truncate text to a specific length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 
        ? truncated.slice(0, lastSpace) + '...'
        : truncated + '...';
}

/**
 * Clean and prepare content snippet for display
 */
export function cleanContentSnippet(content: string, maxLength: number = 200): string {
    const cleaned = stripHtml(content);
    return truncate(cleaned, maxLength);
}
