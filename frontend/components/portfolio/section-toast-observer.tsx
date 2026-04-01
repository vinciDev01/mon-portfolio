"use client";

import { useEffect, useRef } from "react";

/* SVG icon paths (Lucide-style, 24x24 viewBox) */
const sectionMeta: Record<string, { label: string; icon: string }> = {
  presentation: {
    label: "Presentation",
    icon: '<path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  skills: {
    label: "Competences",
    icon: '<path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  experience: {
    label: "Experience",
    icon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" stroke-width="2" fill="none"/>',
  },
  certifications: {
    label: "Certifications",
    icon: '<circle cx="12" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none"/><path d="M15.477 12.89L17 22l-5-3l-5 3l1.523-9.11" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  projects: {
    label: "Projets",
    icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  services: {
    label: "Services",
    icon: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  about: {
    label: "A propos",
    icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/>',
  },
};

export function SectionToastObserver() {
  const currentToastRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSectionRef = useRef<string | null>(null);

  useEffect(() => {
    function showToast(sectionId: string) {
      const meta = sectionMeta[sectionId];
      if (!meta) return;

      // Remove existing toast
      if (currentToastRef.current) {
        currentToastRef.current.classList.add("section-toast-exit");
        const old = currentToastRef.current;
        setTimeout(() => old.remove(), 300);
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const toast = document.createElement("div");
      toast.className = "section-toast section-toast-enter";
      toast.innerHTML = `
        <div class="section-toast-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${meta.icon}</svg>
        </div>
        <div class="section-toast-content">
          <span class="section-toast-label">Section</span>
          <span class="section-toast-title">${meta.label}</span>
        </div>
        <div class="section-toast-progress">
          <div class="section-toast-progress-bar"></div>
        </div>
      `;

      document.body.appendChild(toast);
      currentToastRef.current = toast;

      // Auto dismiss after 2s
      timeoutRef.current = setTimeout(() => {
        toast.classList.add("section-toast-exit");
        setTimeout(() => toast.remove(), 300);
        if (currentToastRef.current === toast) {
          currentToastRef.current = null;
        }
      }, 2000);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id && id !== lastSectionRef.current) {
              lastSectionRef.current = id;
              showToast(id);
            }
          }
        }
      },
      { threshold: 0.3 },
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (currentToastRef.current) currentToastRef.current.remove();
    };
  }, []);

  return null;
}
