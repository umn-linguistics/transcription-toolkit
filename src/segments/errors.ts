/**
 * Error handlers for grapheme tokenization
 */

//import { REPLACEMENT_MARKER } from './util';

export type ErrorHandler = (char: string) => string;
export const REPLACEMENT_MARKER = '\uFFFD'; //

/**
 * Strict error handler - throws an error when encountering invalid grapheme
 * @param char - The invalid character
 * @throws Error when called
 */
export function strict(char: string): string {
  throw new Error('invalid grapheme');
}

/**
 * Replace error handler - replaces invalid grapheme with replacement marker
 * @param char - The invalid character
 * @returns The replacement marker
 */
export function replace(char: string): string {
  return REPLACEMENT_MARKER;
}

/**
 * Ignore error handler - ignores invalid grapheme by returning empty string
 * @param char - The invalid character
 * @returns Empty string
 */
export function ignore(char: string): string {
  return '';
}
