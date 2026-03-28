"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { EMPHATIC_EASE } from "@/lib/motion";

type SubmitState = "idle" | "pending" | "success" | "error";

function normalizePhone(raw: string) {
  return raw.replace(/[^\d+]/g, "");
}

function isValidPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export default function FooterCTA() {
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(true);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidPhone(phone)) {
      setSubmitState("error");
      setMessage("Введите рабочий номер телефона, чтобы мы могли связаться с вами.");
      return;
    }

    if (!consent) {
      setSubmitState("error");
      setMessage("Подтвердите согласие на обработку данных, чтобы отправить заявку.");
      return;
    }

    setSubmitState("pending");
    setMessage("");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: normalizePhone(phone),
          source: "footer_cta",
          page: "/",
          requestedAsset: "technology_card",
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Не удалось отправить заявку. Повторите попытку через пару минут.");
      }

      setSubmitState("success");
      setMessage("Заявка принята. Свяжемся с вами в рабочее время и отправим техкарту.");
      setPhone("");
    } catch (error) {
      setSubmitState("error");
      setMessage(error instanceof Error ? error.message : "Сервис недоступен. Повторите отправку чуть позже.");
    }
  }

  const isPending = submitState === "pending";

  return (
    <footer id="cta-section" className="relative overflow-hidden border-t border-[#EFECE6]/10 bg-[#0A140E] font-sans text-[#EFECE6]">
      <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col items-end justify-between gap-10 px-5 pb-8 pt-10 sm:px-8 md:flex-row md:gap-16 md:pt-14 md:pb-10 lg:px-16 lg:pt-20">
        <div className="w-full flex-1 text-left md:w-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: EMPHATIC_EASE }}
            className="mb-8 text-3xl font-display font-medium leading-[0.9] tracking-tight text-[#EFECE6] sm:text-4xl md:mb-12 md:text-5xl lg:text-6xl xl:text-7xl"
          >
            Хватит
            <br />
            оставлять
            <br />
            <span className="italic font-light text-[#EFECE6]/[0.65]">миллионы</span>
            <br />в поле.
          </motion.h2>

          <div className="mb-12 h-[1px] w-full bg-[#EFECE6]/10" />

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: EMPHATIC_EASE }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end md:gap-4">
              <div className="w-full sm:w-80 md:w-96">
                <label className="mb-3 block text-[13px] font-mono uppercase tracking-[0.12em] text-[#EFECE6]/60">
                  Технологическая карта и расчёт окупаемости
                </label>
                <div className="relative group">
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+7 (___) ___-__-__"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    aria-invalid={submitState === "error" && !isValidPhone(phone)}
                    className="h-[52px] w-full rounded-sm border border-white/30 bg-[#112118] px-5 py-3 text-lg font-light text-[#EFECE6] transition-colors placeholder:text-[#EFECE6]/40 focus:outline-none focus:border-[#CDFF00]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 flex h-[52px] w-full flex-shrink-0 items-center justify-center gap-2 rounded-sm bg-[#CDFF00] px-8 text-sm font-medium uppercase tracking-widest text-[#112118] transition-colors hover:bg-[#DFFF33] disabled:cursor-wait disabled:bg-[#CDFF00]/70 sm:mt-0 sm:w-auto"
              >
                {isPending ? "Отправляем" : "Отправить"}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <label className="flex items-start gap-3 text-sm text-[#EFECE6]/60">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border border-[#EFECE6]/20 bg-transparent accent-[#CDFF00]"
              />
              <span>
                Даю согласие на обработку контакта для обратной связи по продукту ГРИПИЛ и получению техкарты.
              </span>
            </label>

            <div
              aria-live="polite"
              className={`min-h-6 text-sm ${
                submitState === "error"
                  ? "text-[#ffb4b4]"
                  : submitState === "success"
                    ? "text-[#CDFF00]"
                    : "text-[#EFECE6]/45"
              }`}
            >
              {message || "Оставьте номер. Возвращаемся с расчётом, нормой внесения и окном обработки."}
            </div>
          </motion.form>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4, ease: EMPHATIC_EASE }}
          className="hidden flex-col items-end pb-4 text-right md:flex"
        >
          <div className="mb-4 text-[10px] font-mono uppercase tracking-[0.12em] text-[#EFECE6]/40">
            Что произойдёт дальше
          </div>
          <div className="mb-6 grid gap-3">
            {[
              "Перезваниваем и уточняем площадь, фазу и регион.",
              "Подбираем окно внесения и базовую норму.",
              "Мессенджер согласуем после звонка, без фейковых контактов на сайте.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-sm border border-[#EFECE6]/10 bg-[#112118]/45 px-4 py-3 text-sm leading-relaxed text-[#EFECE6]/72"
              >
                {item}
              </div>
            ))}
          </div>
          <p className="text-sm font-normal uppercase tracking-widest text-[#EFECE6]/60">
            Уже защитили <span className="text-[#CDFF00]">120 000 га</span>.
            <br />
            Отвечаем в рабочие часы.
          </p>
        </motion.div>

        <div className="pointer-events-none absolute right-16 top-1/2 hidden -translate-y-1/2 select-none opacity-[0.03] lg:block">
          <div className="origin-bottom-right -rotate-90 translate-x-[20%] text-[15rem] font-display font-bold leading-none">
            GRIPIL
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-16 w-full border-t border-[#EFECE6]/5 bg-[#112118] font-mono text-[10px] uppercase tracking-widest text-[#EFECE6]/40">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-6 py-8 text-center md:flex-row md:text-left lg:px-16">
          <p>© 2026 GRIPIL. Все права защищены.</p>
          <p>Контакты из формы используем только для обратной связи по заявке.</p>
        </div>
      </div>
    </footer>
  );
}
