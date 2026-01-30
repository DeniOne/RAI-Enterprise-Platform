/**
 * Intent Matcher
 * 
 * Deterministic intent matching using token overlap and string similarity.
 * NO LLM, NO external APIs, NO fuzzy libraries.
 */

import { MGIntent } from '../contracts';
import { ResolvedIntent } from './intent.types';

/**
 * Match user message against intent examples.
 * Returns best match or null if no match found.
 */
export function matchIntent(
    message: string,
    intents: MGIntent[]
): ResolvedIntent | null {
    let bestMatch: ResolvedIntent | null = null;
    let bestScore = 0;

    const normalizedMessage = normalizeText(message);

    for (const intent of intents) {
        // Skip intents without examples (e.g., utility intents)
        if (!intent.examples || intent.examples.length === 0) {
            continue;
        }

        for (const example of intent.examples) {
            const normalizedExample = normalizeText(example);
            const score = computeSimilarity(normalizedMessage, normalizedExample);

            if (score > bestScore) {
                bestScore = score;
                bestMatch = {
                    intentId: intent.id,
                    confidence: score,
                    matchedExample: example,
                    userId: '', // Will be filled by resolver/adapter
                    slots: {}   // Will be filled by slot extractor
                };
            }
        }
    }

    return bestMatch;
}

/**
 * Normalize text for comparison:
 * - lowercase
 * - trim whitespace
 * - remove extra spaces
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}

/**
 * Compute similarity score between two normalized strings.
 * Uses token overlap + exact match bonus.
 * 
 * Returns score in range [0, 1].
 */
function computeSimilarity(message: string, example: string): number {
    // Exact match = perfect score
    if (message === example) {
        return 1.0;
    }

    // Tokenize
    const messageTokens = new Set(message.split(' '));
    const exampleTokens = new Set(example.split(' '));

    // Token overlap (Jaccard similarity)
    const intersection = new Set(
        [...messageTokens].filter(token => exampleTokens.has(token))
    );
    const union = new Set([...messageTokens, ...exampleTokens]);

    if (union.size === 0) {
        return 0;
    }

    const jaccardScore = intersection.size / union.size;

    // Substring bonus: if message is substring of example or vice versa
    const substringBonus = (message.includes(example) || example.includes(message)) ? 0.2 : 0;

    // Combined score (capped at 1.0)
    return Math.min(jaccardScore + substringBonus, 1.0);
}
