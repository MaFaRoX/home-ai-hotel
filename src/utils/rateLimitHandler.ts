// Utility for handling rate limit errors (429)

import { ApiClientError } from './api';
import { toast } from 'sonner';

/**
 * Handles rate limit errors by showing a user-friendly message
 * @param error The error to check
 * @returns true if error was a rate limit error and was handled, false otherwise
 */
export function handleRateLimitError(error: unknown): boolean {
  if (error instanceof ApiClientError && error.statusCode === 429) {
    const retryAfter = error.retryAfter || 900; // Default 15 minutes if not provided
    const minutes = Math.ceil(retryAfter / 60);
    
    const message = minutes === 1
      ? 'Please wait 1 minute before trying again.'
      : `Please wait ${minutes} minutes before trying again.`;
    
    toast.error('Too Many Requests', {
      description: `You've made too many requests. ${message}`,
      duration: 10000, // Show for 10 seconds
    });
    
    return true; // Error was handled
  }
  return false; // Not a rate limit error
}

/**
 * Formats retry after time in a human-readable way
 */
export function formatRetryAfter(retryAfterSeconds?: number): string {
  if (!retryAfterSeconds) return 'a few minutes';
  
  const minutes = Math.ceil(retryAfterSeconds / 60);
  if (minutes < 1) return 'a few seconds';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

