'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
          cancel: () => void;
        };
      };
    };
  }
}

export default function GoogleOneTap() {
  const [clientId, setClientId] = useState<string>('');
  const initialized = useRef(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings/public');
        const data = await res.json();
        if (data.googleClientId) {
          setClientId(data.googleClientId);
        }
      } catch (e) {
        console.error('Failed to fetch settings:', e);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!clientId || initialized.current) {
      return;
    }

    const stored = localStorage.getItem('subscriber_email');
    if (stored) {
      return;
    }

    const loadGoogleScript = () => {
      const existingScript = document.querySelector('script[src*="gsi/client"]');
      if (existingScript && window.google?.accounts?.id) {
        initializeOneTap();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeOneTap;
      document.head.appendChild(script);
    };

    const initializeOneTap = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          ux_mode: 'popup',
          allowed_parent_origin: window.location.origin,
        });
        
        initialized.current = true;
        
        setTimeout(() => {
          window.google?.accounts?.id.prompt();
        }, 1000);
      }
    };

    const handleCredentialResponse = async (response: any) => {
      if (response.credential) {
        try {
          const payload = JSON.parse(atob(response.credential.split('.')[1]));
          const email = payload.email;
          
          if (email) {
            localStorage.setItem('subscriber_email', email);
            await subscribeUser(email);
          }
        } catch (e) {
          console.error('Failed to parse credential:', e);
        }
      }
    };

    const subscribeUser = async (email: string) => {
      try {
        await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } catch (error) {
        console.error('Failed to subscribe:', error);
      }
    };

    if (window.google?.accounts?.id) {
      initializeOneTap();
    } else {
      loadGoogleScript();
    }

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [clientId]);

  return null;
}