'use client';

import { useCallback } from 'react';

interface SpeakOptions {
    language?: string; // 'en' | 'fr' | other
    rate?: number;
    pitch?: number;
    volume?: number;
    preferredVoices?: string[]; // list of voice name fragments
    excludedVoices?: string[]; // list of voice name fragments to exclude
}

export default function useTextToSpeech() {
    const chooseVoice = (voices: SpeechSynthesisVoice[], langPrefix: string, preferred: string[], excluded: string[]) => {
        // Try to match names from preferred list
        const byPreferred = preferred
            .map(name => voices.find(v => v.name.includes(name)))
            .find(v => v !== undefined);
        if (byPreferred) return byPreferred as SpeechSynthesisVoice;

        // Choose first voice that matches lang and isn't excluded
        const chosen = voices.find(v => v.lang.startsWith(langPrefix) && !excluded.some(ex => v.name.includes(ex)));
        if (chosen) return chosen;

        // Fallback to any voice with language prefix
        return voices.find(v => v.lang.startsWith(langPrefix));
    };

    const speak = useCallback((text: string, options?: SpeakOptions) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        const speechLanguage = options?.language || process.env.NEXT_PUBLIC_SPEECH_LANGUAGE || 'en';
        const langPrefix = (speechLanguage || 'en').slice(0, 2);

        let langCode = 'en-US';
        let rate = options?.rate ?? 0.75;
        let pitch = options?.pitch ?? 0.4;
        let volume = options?.volume ?? 1;

        if (langPrefix === 'fr') {
            langCode = 'fr-FR';
            rate = options?.rate ?? 0.8;
            pitch = options?.pitch ?? 1;
        }

        // Stop any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = langCode;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        const voices = window.speechSynthesis.getVoices();

        if (voices && voices.length > 0) {
            const preferred = options?.preferredVoices ?? (langPrefix === 'fr' ? [
                'Thomas', 'Google français', 'Amelie', 'Microsoft Denise', 'Audrey'
            ] : ['English']);

            const excluded = options?.excludedVoices ?? (langPrefix === 'fr' ? ['Jacques', 'Virginie'] : []);

            const matchingVoice = chooseVoice(voices, langPrefix, preferred, excluded);
            if (matchingVoice) utterance.voice = matchingVoice;
        } else {
            // If voices not loaded yet, try again when they are loaded
            window.speechSynthesis.onvoiceschanged = () => {
                const vs = window.speechSynthesis.getVoices();
                const preferred = options?.preferredVoices ?? (langPrefix === 'fr' ? [
                    'Thomas', 'Google français', 'Amelie', 'Microsoft Denise', 'Audrey'
                ] : ['English']);

                const excluded = options?.excludedVoices ?? (langPrefix === 'fr' ? ['Jacques', 'Virginie'] : []);
                const matchingVoice = chooseVoice(vs, langPrefix, preferred, excluded);
                if (matchingVoice) utterance.voice = matchingVoice;
                window.speechSynthesis.speak(utterance);
            };
        }

        // Speak (if voice will be set from onvoiceschanged, speak call is inside the handler)
        if (utterance.voice) {
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    const stop = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    return { speak, stop } as const;
}
