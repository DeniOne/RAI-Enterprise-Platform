"use client";

import Link from "next/link";
import { FormEvent, useId, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { EMPHATIC_EASE } from "@/lib/motion";
import { useViewportProfile } from "@/lib/useViewportProfile";

type SubmitState = "idle" | "pending" | "success" | "error";

function normalizePhone(raw: string) {
  return raw.replace(/[^\d+]/g, "");
}

function isValidPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

const nextSteps = [
  "Перезваниваем и уточняем площадь, фазу и регион.",
  "Подбираем окно внесения и базовую норму.",
  "Согласуем канал связи после звонка, без подменных окон переписки на сайте.",
];

function TrustDetails() {
  return (
    <div className="grid gap-3 text-sm leading-relaxed text-[#EFECE6]/68">
      <div className="rounded-sm border border-[#EFECE6]/10 bg-[#112118]/45 px-4 py-3">
        Честный сценарий: заявка уходит только в боевой канал. При технической ошибке вы увидите отказ, а не
        ложный успех.
      </div>
      <div className="rounded-sm border border-[#EFECE6]/10 bg-[#112118]/45 px-4 py-3">
        Публичный контур доверия:{" "}
        <Link href="/company" className="text-[#C6D98A] underline underline-offset-4">
          данные оператора
        </Link>
        ,{" "}
        <Link href="/contact" className="text-[#C6D98A] underline underline-offset-4">
          контакты
        </Link>
        ,{" "}
        <Link href="/privacy" className="text-[#C6D98A] underline underline-offset-4">
          обработка данных
        </Link>
        .
      </div>
    </div>
  );
}

function FooterMeta() {
  return (
    <div className="relative z-10 mt-12 w-full border-t border-[#EFECE6]/5 bg-[#112118] font-mono text-[10px] uppercase tracking-widest text-[#EFECE6]/40 md:mt-0">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-6 py-8 text-center md:flex-row md:text-left lg:px-16">
        <p>© 2026 ГРИПИЛ. Все права защищены.</p>
        <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
          <Link href="/privacy" className="hover:text-[#C6D98A]">
            политика данных
          </Link>
          <Link href="/company" className="hover:text-[#C6D98A]">
            данные оператора
          </Link>
          <Link href="/contact" className="hover:text-[#C6D98A]">
            контакты
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FooterCTA() {
  const viewport = useViewportProfile();
  const phoneFieldId = useId();
  const consentFieldId = useId();
  const helperId = useId();
  const feedbackId = useId();
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitState === "pending") return;

    if (!isValidPhone(phone)) {
      setSubmitState("error");
      setMessage("Введите рабочий номер телефона, чтобы мы могли связаться с вами.");
      return;
    }

    if (!consent) {
      setSubmitState("error");
      setMessage("Подтвердите согласие на обработку контакта, чтобы отправить заявку.");
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

      const payload = (await response.json().catch(() => ({}))) as { error?: string; ok?: boolean };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Не удалось отправить заявку. Повторите попытку через пару минут.");
      }

      setSubmitState("success");
      setMessage("Заявка принята. Свяжемся с вами в рабочее время и отправим техкарту.");
      setPhone("");
      setConsent(false);
    } catch (error) {
      setSubmitState("error");
      setMessage(error instanceof Error ? error.message : "Сервис недоступен. Повторите отправку чуть позже.");
    }
  }

  const isPending = submitState === "pending";
  const isCompactDesktop = viewport.isLowHeightDesktop;

  return (
    <>
      <footer id="cta-section" className="relative overflow-hidden border-t border-[#EFECE6]/10 bg-[#0A140E] font-sans text-[#EFECE6]">
        <div
          className={`relative z-10 mx-auto grid max-w-[1440px] px-5 sm:px-8 lg:px-16 ${
            viewport.isMobileOrTablet
              ? "grid-cols-1 gap-8 py-8"
              : isCompactDesktop
                ? "grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] items-start gap-8 py-8"
                : "grid-cols-[minmax(0,1fr)_minmax(360px,0.86fr)] items-start gap-12 py-10 lg:py-16"
          }`}
        >
          <div className="w-full text-left">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: EMPHATIC_EASE }}
              className={`font-display font-medium leading-[0.9] tracking-tight text-[#EFECE6] ${
                viewport.isPhone
                  ? "mb-6 text-[2.5rem]"
                  : viewport.isTablet
                    ? "mb-7 text-[3.4rem]"
                    : isCompactDesktop
                      ? "mb-6 text-[4rem] xl:text-[4.6rem]"
                      : "mb-8 text-4xl lg:text-6xl xl:text-7xl"
              }`}
            >
              Хватит
              <br />
              оставлять
              <br />
              <span className="italic font-light text-[#EFECE6]/[0.65]">миллионы</span>
              <br />в поле.
            </motion.h2>

            <div className={`${isCompactDesktop ? "mb-6" : "mb-8"} h-px w-full bg-[#EFECE6]/10`} />

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, ease: EMPHATIC_EASE }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end md:gap-4">
                <div className="w-full sm:max-w-[26rem]">
                  <label htmlFor={phoneFieldId} className="mb-3 block text-[13px] font-mono uppercase tracking-[0.12em] text-[#EFECE6]/60">
                    Технологическая карта и расчёт окупаемости
                  </label>
                  <input
                    id={phoneFieldId}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+7 (___) ___-__-__"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      if (submitState !== "pending") {
                        setSubmitState("idle");
                        setMessage("");
                      }
                    }}
                    required
                    aria-describedby={`${helperId} ${feedbackId}`}
                    aria-invalid={submitState === "error" && !isValidPhone(phone)}
                    className="h-[52px] w-full rounded-sm border border-white/30 bg-[#112118] px-5 py-3 text-lg font-light text-[#EFECE6] transition-colors placeholder:text-[#EFECE6]/40 focus:border-[#CDFF00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CDFF00]/45"
                  />
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

              <div id={helperId} className="text-sm leading-relaxed text-[#EFECE6]/56">
                Оставьте номер, и мы вернёмся с расчётом окупаемости, нормой внесения и окном обработки.
              </div>

              <label htmlFor={consentFieldId} className="flex items-start gap-3 text-sm text-[#EFECE6]/60">
                <input
                  id={consentFieldId}
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => {
                    setConsent(event.target.checked);
                    if (submitState !== "pending") {
                      setSubmitState("idle");
                      setMessage("");
                    }
                  }}
                  className="mt-1 h-4 w-4 rounded border border-[#EFECE6]/20 bg-transparent accent-[#CDFF00]"
                />
                <span>
                  Даю согласие на обработку контакта для обратной связи по продукту ГРИПИЛ и получению техкарты.{" "}
                  <Link href="/privacy" className="text-[#C6D98A] underline underline-offset-4">
                    Политика обработки
                  </Link>
                </span>
              </label>

              <div
                id={feedbackId}
                aria-live="polite"
                className={`min-h-6 text-sm ${
                  submitState === "error"
                    ? "text-[#ffb4b4]"
                    : submitState === "success"
                      ? "text-[#CDFF00]"
                      : "text-[#EFECE6]/45"
                }`}
              >
                {message || "Форма отправляет заявку только при реальной доставке в боевой канал."}
              </div>
            </motion.form>
          </div>

          {!viewport.isMobileOrTablet ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4, ease: EMPHATIC_EASE }}
              className="text-right"
            >
              <div className="mb-4 text-[10px] font-mono uppercase tracking-[0.12em] text-[#EFECE6]/40">
                Что произойдёт дальше
              </div>
              <div className="mb-6 grid gap-3">
                {nextSteps.map((item) => (
                  <div key={item} className="rounded-sm border border-[#EFECE6]/10 bg-[#112118]/45 px-4 py-3 text-sm leading-relaxed text-[#EFECE6]/72">
                    {item}
                  </div>
                ))}
              </div>
              <TrustDetails />
            </motion.div>
          ) : null}

          {!viewport.isMobileOrTablet ? (
            <div className="pointer-events-none absolute right-16 top-1/2 hidden -translate-y-1/2 select-none opacity-[0.03] lg:block">
              <div className="origin-bottom-right -rotate-90 translate-x-[20%] text-[15rem] font-display font-bold leading-none">
                ГРИПИЛ
              </div>
            </div>
          ) : null}
        </div>
      </footer>

      {viewport.isMobileOrTablet ? (
        <section style={{ minHeight: "100dvh" }} className="relative flex items-center overflow-hidden border-t border-[#EFECE6]/10 bg-[#0A140E] px-5 py-8 font-sans text-[#EFECE6] sm:px-8">
          <div className="mx-auto flex w-full max-w-[860px] flex-col justify-center">
            <div className="mb-4 text-[10px] font-mono uppercase tracking-[0.12em] text-[#EFECE6]/40">
              Что произойдёт дальше
            </div>
            <div className="mb-6 grid gap-3">
              {nextSteps.map((item) => (
                <div key={item} className="rounded-sm border border-[#EFECE6]/10 bg-[#112118]/45 px-4 py-3 text-sm leading-relaxed text-[#EFECE6]/72">
                  {item}
                </div>
              ))}
            </div>
            <TrustDetails />
          </div>
        </section>
      ) : null}

      <FooterMeta />
    </>
  );
}


