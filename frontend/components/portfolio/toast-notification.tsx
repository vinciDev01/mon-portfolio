"use client";

import { useEffect } from "react";
import { toast, Toaster } from "sonner";

interface ToastNotificationProps {
  message: string | null;
  delayMs: number;
}

export function ToastNotification({ message, delayMs }: ToastNotificationProps) {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      toast(message, {
        duration: 5000,
        position: "bottom-right",
      });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [message, delayMs]);

  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "bg-card text-card-foreground border border-border shadow-md rounded-xl text-sm",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
