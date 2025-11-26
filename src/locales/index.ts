import { vi } from './vi';
import { en } from './en';

// Define supported languages
export type Language = 'vi' | 'en';

// Type for translation keys (inferred from Vietnamese translations)
export type TranslationKey = keyof typeof vi;

// All translations object
export const translations = {
  vi,
  en,
} as const;

// Default language
export const DEFAULT_LANGUAGE: Language = 'vi';

// Available languages metadata
export const languages = {
  vi: {
    code: 'vi' as const,
    name: 'Tiếng Việt',
    flag: '🇻🇳',
  },
  en: {
    code: 'en' as const,
    name: 'English',
    flag: '🇬🇧',
  },
} as const;

// Helper function to validate language
export function isValidLanguage(lang: string): lang is Language {
  return lang === 'vi' || lang === 'en';
}

