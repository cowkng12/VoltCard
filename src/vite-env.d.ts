/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp?: {
      ready: () => void;
      expand: () => void;
      HapticFeedback?: {
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
      };
      initDataUnsafe?: {
        user?: {
          first_name?: string;
          last_name?: string;
          username?: string;
        };
      };
    };
  };
}
