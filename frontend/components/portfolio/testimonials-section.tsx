"use client";

import { useState, useEffect, useCallback } from "react";
import type { TestimonialDto } from "@portfolio/shared-types";
import { SectionWrapper } from "./section-wrapper";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/i18n-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface TestimonialsSectionProps {
  testimonials: TestimonialDto[];
  allowSubmission: boolean;
}

function TestimonialCarousel({ testimonials }: { testimonials: TestimonialDto[] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const total = testimonials.length;

  const next = useCallback(() => {
    setDirection("right");
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setDirection("left");
    setCurrent((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-advance
  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, total]);

  const t = testimonials[current];
  if (!t) return null;

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Card */}
      <div
        key={`${t.id}-${direction}`}
        className="bg-card rounded-2xl border border-border p-8 md:p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500"
      >
        {/* Quote icon */}
        <svg className="size-8 text-foreground/10 mb-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
        </svg>

        <blockquote className="text-base md:text-lg leading-relaxed mb-6 italic">
          &ldquo;{t.content}&rdquo;
        </blockquote>

        <div className="flex items-center gap-3">
          {/* Avatar initials */}
          <div className="size-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold shrink-0">
            {t.firstName[0]}{t.lastName[0]}
          </div>
          <div>
            <p className="font-semibold text-sm">{t.firstName} {t.lastName}</p>
            {(t.role || t.company) && (
              <p className="text-xs text-muted-foreground">
                {[t.role, t.company].filter(Boolean).join(" - ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      {total > 1 && (
        <>
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prev}
              className="size-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
              aria-label="Previous"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? "right" : "left"); setCurrent(i); }}
                  className={`rounded-full transition-all cursor-pointer ${i === current ? "w-6 h-2 bg-foreground" : "size-2 bg-foreground/20 hover:bg-foreground/40"}`}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="size-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
              aria-label="Next"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TestimonialForm() {
  const [form, setForm] = useState({ firstName: "", lastName: "", company: "", role: "", content: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showForm, setShowForm] = useState(false);
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        content: form.content,
        ...(form.company && { company: form.company }),
        ...(form.role && { role: form.role }),
      };
      const res = await fetch(`${API_URL}/api/testimonials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur");
      setStatus("success");
      setForm({ firstName: "", lastName: "", company: "", role: "", content: "" });
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-6 mt-6 bg-card rounded-xl border border-border">
        <p className="font-semibold">{t("testimonials.thanks")}</p>
        <p className="text-sm text-muted-foreground mt-1">{t("testimonials.pendingApproval")}</p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="flex justify-center mt-8">
        <Button variant="outline" onClick={() => setShowForm(true)}>
          {t("testimonials.leaveOne")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-xl mx-auto bg-card rounded-xl border border-border p-6">
      <h3 className="font-semibold mb-4">{t("testimonials.leaveOne")}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="t-firstName" className="block text-sm font-medium mb-1">{t("testimonials.firstName")}</label>
            <input id="t-firstName" name="firstName" type="text" required value={form.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
          </div>
          <div>
            <label htmlFor="t-lastName" className="block text-sm font-medium mb-1">{t("testimonials.lastName")}</label>
            <input id="t-lastName" name="lastName" type="text" required value={form.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="t-company" className="block text-sm font-medium mb-1">{t("testimonials.company")}</label>
            <input id="t-company" name="company" type="text" value={form.company} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
          </div>
          <div>
            <label htmlFor="t-role" className="block text-sm font-medium mb-1">{t("testimonials.role")}</label>
            <input id="t-role" name="role" type="text" value={form.role} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
          </div>
        </div>
        <div>
          <label htmlFor="t-content" className="block text-sm font-medium mb-1">{t("testimonials.content")}</label>
          <textarea id="t-content" name="content" required rows={4} value={form.content} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background resize-none" />
        </div>
        {status === "error" && <p className="text-sm text-red-500">{t("contact.error")}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? t("contact.sending") : t("contact.send")}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
            {t("testimonials.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function TestimonialsSection({ testimonials, allowSubmission }: TestimonialsSectionProps) {
  const { t } = useTranslation();

  return (
    <SectionWrapper id="testimonials" title={t("section.testimonials")}>
      {testimonials.length > 0 ? (
        <TestimonialCarousel testimonials={testimonials} />
      ) : (
        <p className="text-sm text-muted-foreground text-center">{t("testimonials.none")}</p>
      )}
      {allowSubmission && <TestimonialForm />}
    </SectionWrapper>
  );
}
