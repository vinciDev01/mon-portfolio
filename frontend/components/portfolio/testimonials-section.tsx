"use client";

import { useState } from "react";
import type { TestimonialDto } from "@portfolio/shared-types";
import { SectionWrapper } from "./section-wrapper";
import { SeeMoreList } from "./see-more-button";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/i18n-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface TestimonialsSectionProps {
  testimonials: TestimonialDto[];
}

function TestimonialCard({ testimonial }: { testimonial: TestimonialDto }) {
  return (
    <div className="animated-card bg-card rounded-xl p-5 flex flex-col gap-3 border border-border">
      <svg className="size-6 text-muted-foreground/40" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
      </svg>
      <p className="text-sm leading-relaxed flex-1">{testimonial.content}</p>
      <div className="pt-2 border-t border-border">
        <p className="font-semibold text-sm">{testimonial.firstName} {testimonial.lastName}</p>
        {(testimonial.role || testimonial.company) && (
          <p className="text-xs text-muted-foreground">
            {[testimonial.role, testimonial.company].filter(Boolean).join(" - ")}
          </p>
        )}
      </div>
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

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const { t } = useTranslation();

  return (
    <SectionWrapper id="testimonials" title={t("section.testimonials")}>
      {testimonials.length > 0 ? (
        <SeeMoreList
          items={testimonials}
          initialCount={4}
          renderItem={(testimonial) => <TestimonialCard key={testimonial.id} testimonial={testimonial} />}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        />
      ) : (
        <p className="text-sm text-muted-foreground text-center">{t("testimonials.none")}</p>
      )}
      <TestimonialForm />
    </SectionWrapper>
  );
}
