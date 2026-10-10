"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n/i18n-context";

import { PICTOS, SECTIONS } from "@/lib/parcours/sections";


export function SectionToastObserver() {
  const currentToastRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSectionRef = useRef<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    function showToast(sectionId: string) {
      const icon = PICTOS[sectionId];
      const tKey = SECTIONS.find((s) => s.id === sectionId)?.cleTitre;
      if (!icon || !tKey) return;

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
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${icon}</svg>
        </div>
        <div class="section-toast-content">
          <span class="section-toast-label">${t("toast.section")}</span>
          <span class="section-toast-title">${t(tKey)}</span>
        </div>
        <div class="section-toast-progress">
          <div class="section-toast-progress-bar"></div>
        </div>
      `;

      document.body.appendChild(toast);
      currentToastRef.current = toast;

      timeoutRef.current = setTimeout(() => {
        toast.classList.add("section-toast-exit");
        setTimeout(() => toast.remove(), 300);
        if (currentToastRef.current === toast) {
          currentToastRef.current = null;
        }
      }, 2000);
    }

    // Avec la pagination, aucune section ne defile dans la fenetre : celle qui
    // compte est celle que le conteneur marque `data-active`. On observe donc
    // cet attribut et non l'intersection, qui verrait toutes les sections
    // superposees comme visibles.
    const annoncer = (el: Element) => {
      const id = el.getAttribute("id");
      if (id && id !== lastSectionRef.current) {
        lastSectionRef.current = id;
        showToast(id);
      }
    };
    const actives = () =>
      document.querySelectorAll('.parcours-pagine > [data-active="true"]');

    const observer = new MutationObserver(() => actives().forEach(annoncer));
    const zone = document.querySelector(".parcours-pagine");
    if (zone) {
      observer.observe(zone, {
        attributes: true,
        attributeFilter: ["data-active"],
        subtree: true,
      });
    }
    actives().forEach(annoncer);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (currentToastRef.current) currentToastRef.current.remove();
    };
  }, [t]);

  return null;
}
