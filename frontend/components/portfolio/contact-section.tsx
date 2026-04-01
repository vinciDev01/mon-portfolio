"use client";

import { useState } from "react";
import { SectionWrapper } from "./section-wrapper";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/i18n-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function ContactSection() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const { t } = useTranslation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/api/contact-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Erreur");
      setStatus("success");
      setForm({ firstName: "", lastName: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <SectionWrapper id="contact" title={t("section.contact")}>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold mb-2">{t("contact.headline")}</p>
          <p className="text-sm text-muted-foreground">{t("contact.subtitle")}</p>
        </div>
        {status === "success" ? (
          <div className="text-center py-8">
            <div className="size-12 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="size-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-lg">{t("contact.success")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("contact.successDetail")}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setStatus("idle")}>
              {t("contact.sendAnother")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-firstName" className="block text-sm font-medium mb-1">{t("contact.firstName")}</label>
                <input id="contact-firstName" name="firstName" type="text" required value={form.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
              </div>
              <div>
                <label htmlFor="contact-lastName" className="block text-sm font-medium mb-1">{t("contact.lastName")}</label>
                <input id="contact-lastName" name="lastName" type="text" required value={form.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
              </div>
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium mb-1">{t("contact.email")}</label>
              <input id="contact-email" name="email" type="email" required value={form.email} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
            </div>
            <div>
              <label htmlFor="contact-subject" className="block text-sm font-medium mb-1">{t("contact.subject")}</label>
              <input id="contact-subject" name="subject" type="text" required value={form.subject} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium mb-1">{t("contact.message")}</label>
              <textarea id="contact-message" name="message" required rows={5} value={form.message} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background resize-none" />
            </div>
            {status === "error" && (
              <p className="text-sm text-red-500">{t("contact.error")}</p>
            )}
            <Button type="submit" disabled={status === "loading"} className="w-full">
              {status === "loading" ? t("contact.sending") : t("contact.send")}
            </Button>
          </form>
        )}
      </div>
    </SectionWrapper>
  );
}
