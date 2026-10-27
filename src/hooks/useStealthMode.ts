'use client';

import { useCallback, useEffect, useState } from 'react';
import { THEME_METADATA } from '@/lib/constants';
import type { CorporateTheme, Locale } from '@/types/game';

const STORAGE_KEYS = {
  theme: 'recon_q4_theme',
  locale: 'recon_q4_locale',
  alias: 'recon_q4_alias',
  panicOnBlur: 'recon_q4_panic_on_blur',
} as const;

export interface StealthModeOptions {
  isMyTurn?: boolean;
}

export interface StealthModeState {
  isPanicMode: boolean;
  setIsPanicMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  togglePanicMode: () => void;
  theme: CorporateTheme;
  setTheme: (theme: CorporateTheme) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  alias: string;
  setAlias: (alias: string) => void;
  panicOnBlur: boolean;
  setPanicOnBlur: (enabled: boolean) => void;
}

function buildSpreadsheetFaviconDataUri(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect x="2" y="2" width="28" height="28" rx="4" fill="${color}" />
    <rect x="6" y="8" width="20" height="3" fill="#ffffff" opacity="0.95" />
    <rect x="6" y="14" width="8" height="3" fill="#ffffff" opacity="0.85" />
    <rect x="16" y="14" width="10" height="3" fill="#ffffff" opacity="0.85" />
    <rect x="6" y="20" width="8" height="3" fill="#ffffff" opacity="0.85" />
    <rect x="16" y="20" width="10" height="3" fill="#ffffff" opacity="0.85" />
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function useStealthMode(arg?: boolean | StealthModeOptions): StealthModeState {
  const isMyTurn = typeof arg === 'boolean' ? arg : Boolean(arg?.isMyTurn);

  const [isPanicMode, setIsPanicMode] = useState<boolean>(false);
  const [theme, setThemeState] = useState<CorporateTheme>('sheets');
  const [locale, setLocaleState] = useState<Locale>('es');
  const [alias, setAliasState] = useState<string>('Auditor_409');
  const [panicOnBlur, setPanicOnBlurState] = useState<boolean>(false);

  // Hydrate persisted corporate preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedTheme = window.localStorage.getItem(STORAGE_KEYS.theme);
      if (savedTheme === 'sheets' || savedTheme === 'excel' || savedTheme === 'dark') {
        setThemeState(savedTheme);
      }

      const savedLocale = window.localStorage.getItem(STORAGE_KEYS.locale);
      if (savedLocale === 'es' || savedLocale === 'en') {
        setLocaleState(savedLocale);
      }

      const savedAlias = window.localStorage.getItem(STORAGE_KEYS.alias);
      if (savedAlias && savedAlias.trim().length > 0) {
        setAliasState(savedAlias.trim());
      } else {
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const generatedAlias = `Auditor_${randomSuffix}`;
        setAliasState(generatedAlias);
        window.localStorage.setItem(STORAGE_KEYS.alias, generatedAlias);
      }

      const savedBlur = window.localStorage.getItem(STORAGE_KEYS.panicOnBlur);
      if (savedBlur === 'true' || savedBlur === 'false') {
        setPanicOnBlurState(savedBlur === 'true');
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }, []);

  const setTheme = useCallback((nextTheme: CorporateTheme) => {
    setThemeState(nextTheme);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEYS.locale, nextLocale);
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const setAlias = useCallback((nextAlias: string) => {
    const sanitized = nextAlias.slice(0, 28);
    setAliasState(sanitized);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEYS.alias, sanitized);
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const setPanicOnBlur = useCallback((enabled: boolean) => {
    setPanicOnBlurState(enabled);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEYS.panicOnBlur, String(enabled));
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const togglePanicMode = useCallback(() => {
    setIsPanicMode((prev) => !prev);
  }, []);

  // Zero-latency (<16ms) Escape listener & optional window blur boss-key trigger
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsPanicMode((prev) => !prev);
      }
    };

    const handleBlur = () => {
      if (panicOnBlur) {
        setIsPanicMode(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [panicOnBlur]);

  // Dynamic tab title & SVG spreadsheet favicon camouflage
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const meta = THEME_METADATA[theme] ?? THEME_METADATA.sheets;
    const baseTitle = meta.docTitle[locale] ?? meta.docTitle.es;
    const prefix = isMyTurn && !isPanicMode ? '* ' : '';
    document.title = `${prefix}${baseTitle}`;

    const dataUri = buildSpreadsheetFaviconDataUri(meta.faviconColor);
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = dataUri;
  }, [theme, locale, isMyTurn, isPanicMode]);

  return {
    isPanicMode,
    setIsPanicMode,
    togglePanicMode,
    theme,
    setTheme,
    locale,
    setLocale,
    alias,
    setAlias,
    panicOnBlur,
    setPanicOnBlur,
  };
}
