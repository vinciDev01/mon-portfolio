"use client";

import { useEffect, useState } from "react";

interface ToastNotificationProps {
  message: string | null;
  delayMs: number;
}

export function ToastNotification({ message, delayMs }: ToastNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!message) return;

    const showTimer = setTimeout(() => setVisible(true), delayMs);

    return () => clearTimeout(showTimer);
  }, [message, delayMs]);

  useEffect(() => {
    if (!visible) return;

    const hideTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 400);
    }, 6000);

    return () => clearTimeout(hideTimer);
  }, [visible]);

  if (!visible || !message) return null;

  function handleClose() {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, 400);
  }

  return (
    <div className="fixed inset-x-0 top-20 z-[100] flex justify-center pointer-events-none">
      <div
        className={`pointer-events-auto max-w-md w-full mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden transition-all duration-400 ${exiting ? "opacity-0 -translate-y-4 scale-95" : "opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-4"}`}
      >
        <div className="relative px-6 py-5">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 size-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer"
          >
            <svg className="size-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 size-10 rounded-full bg-foreground/10 flex items-center justify-center">
              <svg className="size-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium leading-relaxed">{message}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted overflow-hidden">
            <div
              className="h-full bg-foreground/40 rounded-full"
              style={{
                animation: "toast-progress 6s linear forwards",
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
