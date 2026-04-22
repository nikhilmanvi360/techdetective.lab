/**
 * Implements Levenshtein distance and fuzzy matching for tech detective anti-cheat.
 */

export function normalizeText(text: string): string {
 if (!text) return '';
 return text.toLowerCase()
 .replace(/[^a-z0-9]/g, '') // remove all non-alphanumeric (spaces, punctuation)
 .trim();
}

export function levenshteinDistance(a: string, b: string): number {
 if (a.length === 0) return b.length;
 if (b.length === 0) return a.length;

 const matrix = [];

 // Increment along the first column
 for (let i = 0; i <= b.length; i++) {
 matrix[i] = [i];
 }

 // Increment each column in the first row
 for (let j = 0; j <= a.length; j++) {
 matrix[0][j] = j;
 }

 // Fill in the rest of the matrix
 for (let i = 1; i <= b.length; i++) {
 for (let j = 1; j <= a.length; j++) {
 if (b.charAt(i - 1) == a.charAt(j - 1)) {
 matrix[i][j] = matrix[i - 1][j - 1];
 } else {
 matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
 Math.min(matrix[i][j - 1] + 1, // insertion
 matrix[i - 1][j] + 1)); // deletion
 }
 }
 }

 return matrix[b.length][a.length];
}

export function isFuzzyMatch(userInput: string, correctAnswer: string, tolerance: number = 2): boolean {
 // 1. Synonym / common substitution mapping
 const synonyms: Record<string, string[]> = {
 'admin': ['administrator', 'root', 'superuser'],
 'junior_dev_manoj': ['manoj', 'junior dev'],
 'ddos': ['denial of service', 'dos'],
 'xss': ['cross site scripting', 'cross-site scripting']
 };

 const normalizedInput = normalizeText(userInput);
 const normalizedCorrect = normalizeText(correctAnswer);

 if (normalizedInput === normalizedCorrect) return true;

 // Check synonyms
 const correctSynonyms = synonyms[correctAnswer.toLowerCase().trim()] || [];
 for (const syn of correctSynonyms) {
 if (normalizedInput === normalizeText(syn)) return true;
 }

 const correctSynonymsByInput = synonyms[userInput.toLowerCase().trim()] || [];
 for (const syn of correctSynonymsByInput) {
 if (normalizedCorrect === normalizeText(syn)) return true;
 }

 // 2. Levenshtein check (tolerance based on length)
 // For very short answers (length < 4), require exact match
 if (normalizedCorrect.length < 4) return false;

 // Adjust tolerance for long words: 1 typo per 5 characters allowed (up to max provided)
 const allowedDistance = Math.min(tolerance, Math.max(1, Math.floor(normalizedCorrect.length / 5)));
 
 const distance = levenshteinDistance(normalizedInput, normalizedCorrect);
 return distance <= allowedDistance;
}
