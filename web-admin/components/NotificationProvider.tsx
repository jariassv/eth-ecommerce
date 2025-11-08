'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

type NotificationVariant = 'success' | 'error' | 'info';

interface NotificationOptions {
  title: string;
  message?: string;
  type?: NotificationVariant;
  duration?: number;
}

interface NotificationRecord extends Required<NotificationOptions> {
  id: number;
}

interface NotificationContextValue {
  notify: (options: NotificationOptions) => void;
  notifySuccess: (title: string, message?: string, duration?: number) => void;
  notifyError: (title: string, message?: string, duration?: number) => void;
  notifyInfo: (title: string, message?: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const VARIANT_STYLES: Record<NotificationVariant, { container: string; badge: string }> = {
  success: {
    container: 'border-emerald-200 bg-white text-emerald-900 shadow-emerald-100/70',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  error: {
    container: 'border-rose-200 bg-white text-rose-900 shadow-rose-100/70',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  info: {
    container: 'border-slate-200 bg-white text-slate-900 shadow-slate-100/70',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const notify = useCallback(
    ({ title, message = '', type = 'info', duration = 4500 }: NotificationOptions) => {
      if (!title) return;

      const id = Date.now() + Math.floor(Math.random() * 1000);
      const record: NotificationRecord = {
        id,
        title,
        message,
        type,
        duration,
      };

      setNotifications((prev) => [...prev, record]);

      if (duration > 0) {
        window.setTimeout(() => removeNotification(id), duration);
      }
    },
    [removeNotification],
  );

  const contextValue = useMemo<NotificationContextValue>(
    () => ({
      notify,
      notifySuccess: (title, message, duration) =>
        notify({ title, message, duration, type: 'success' }),
      notifyError: (title, message, duration) =>
        notify({ title, message, duration, type: 'error' }),
      notifyInfo: (title, message, duration) => notify({ title, message, duration, type: 'info' }),
    }),
    [notify],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-3">
        {notifications.map((notification) => {
          const styles = VARIANT_STYLES[notification.type];
          return (
            <div
              key={notification.id}
              className={`pointer-events-auto overflow-hidden rounded-2xl border shadow-xl transition-all ${styles.container}`}
            >
              <div className="flex items-start gap-3 p-4">
                <div
                  className={`inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-semibold uppercase tracking-wide ${styles.badge}`}
                >
                  {notification.type === 'success'
                    ? 'Éxito'
                    : notification.type === 'error'
                      ? 'Error'
                      : 'Info'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-tight text-gray-900">
                    {notification.title}
                  </p>
                  {notification.message && (
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Cerrar notificación"
                  onClick={() => removeNotification(notification.id)}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 8.586l4.95-4.95 1.414 1.414L11.414 10l4.95 4.95-1.414 1.414L10 11.414l-4.95 4.95-1.414-1.414L8.586 10l-4.95-4.95L5.05 3.636 10 8.586z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-black/5 to-transparent" />
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de un NotificationProvider');
  }
  return context;
}


