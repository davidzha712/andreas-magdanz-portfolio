"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type SubmitStatus = "idle" | "loading" | "success" | "error";

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const inputClasses =
  "w-full bg-transparent border border-border px-4 py-3 font-sans text-sm text-fg placeholder:text-fg-muted/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors duration-200";

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({});
  const t = useTranslations("contact");

  const validate = (): boolean => {
    const errors: Partial<FormState> = {};

    if (!form.name.trim()) errors.name = "Required";
    if (!form.email.trim()) {
      errors.email = "Required";
    } else if (!isValidEmail(form.email)) {
      errors.email = "Invalid email";
    }
    if (!form.subject.trim()) errors.subject = "Required";
    if (!form.message.trim()) errors.message = "Required";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name as keyof FormState]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setForm(INITIAL_FORM);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block font-sans text-xs uppercase tracking-widest text-fg-muted mb-2"
        >
          {t("name")} <span className="text-accent">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          autoComplete="name"
          className={[
            inputClasses,
            fieldErrors.name ? "border-red-500/60 focus:ring-red-500/60" : "",
          ].join(" ")}
        />
        {fieldErrors.name && (
          <p className="mt-1.5 font-sans text-xs text-red-400">
            {fieldErrors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block font-sans text-xs uppercase tracking-widest text-fg-muted mb-2"
        >
          {t("email")} <span className="text-accent">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          className={[
            inputClasses,
            fieldErrors.email ? "border-red-500/60 focus:ring-red-500/60" : "",
          ].join(" ")}
        />
        {fieldErrors.email && (
          <p className="mt-1.5 font-sans text-xs text-red-400">
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Subject */}
      <div>
        <label
          htmlFor="subject"
          className="block font-sans text-xs uppercase tracking-widest text-fg-muted mb-2"
        >
          {t("subject")} <span className="text-accent">*</span>
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          value={form.subject}
          onChange={handleChange}
          className={[
            inputClasses,
            fieldErrors.subject
              ? "border-red-500/60 focus:ring-red-500/60"
              : "",
          ].join(" ")}
        />
        {fieldErrors.subject && (
          <p className="mt-1.5 font-sans text-xs text-red-400">
            {fieldErrors.subject}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block font-sans text-xs uppercase tracking-widest text-fg-muted mb-2"
        >
          {t("message")} <span className="text-accent">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          value={form.message}
          onChange={handleChange}
          className={[
            inputClasses,
            "resize-y min-h-[140px]",
            fieldErrors.message
              ? "border-red-500/60 focus:ring-red-500/60"
              : "",
          ].join(" ")}
        />
        {fieldErrors.message && (
          <p className="mt-1.5 font-sans text-xs text-red-400">
            {fieldErrors.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-accent text-bg border border-accent font-sans text-xs uppercase tracking-widest hover:bg-accent-hover transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <>
              <svg
                className="animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              {t("sending")}
            </>
          ) : (
            t("send")
          )}
        </button>
      </div>

      {/* Success message */}
      {status === "success" && (
        <div className="border border-green-700/40 bg-green-900/10 px-4 py-3">
          <p className="font-sans text-sm text-green-400">
            {t("success")}
          </p>
        </div>
      )}

      {/* Error message */}
      {status === "error" && (
        <div className="border border-red-700/40 bg-red-900/10 px-4 py-3">
          <p className="font-sans text-sm text-red-400">
            {errorMessage || t("error")}
          </p>
        </div>
      )}
    </form>
  );
}
