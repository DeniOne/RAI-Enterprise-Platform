import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageFrame } from "@/components/LegalPageFrame";
import { getSiteProfile } from "@/lib/site-profile";

export const metadata: Metadata = {
  title: "Политика обработки контактных данных | ГРИПИЛ",
  description: "Порядок обработки контактных данных, оставленных через форму сайта ГРИПИЛ.",
};

export default function PrivacyPage() {
  const profile = getSiteProfile();

  return (
    <LegalPageFrame
      eyebrow="Политика данных"
      title="Политика обработки контактных данных"
      description="Эта страница описывает, как сайт ГРИПИЛ принимает и использует контактные данные из формы обратной связи."
    >
      <p>
        Оператор: <strong>{profile.companyLegalName}</strong>.
      </p>
      <p>
        Цель обработки: принять заявку на продукт ГРИПИЛ, связаться по запросу, уточнить сценарий применения и отправить
        технологические материалы по обращению.
      </p>
      <p>
        Состав данных: номер телефона, служебные поля источника заявки, дата и страница отправки. Эти данные не используются
        для массовых рассылок и не продаются третьим лицам.
      </p>
      <p>
        Канал для вопросов по данным:{" "}
        <Link href="/contact" className="text-[#C6D98A] underline underline-offset-4">
          страница контактов
        </Link>
        .
      </p>
      {!profile.isComplete ? (
        <p className="rounded-2xl border border-[#FFB4B4]/20 bg-[#170F0C] px-4 py-3 text-[#FFD0C6]">
          Публичный профиль релиза ещё не заполнен полностью. Перед выкладкой нужно подставить реальные домен, контакты и
          реквизиты через переменные окружения `GRIPIL_*`, иначе сайт останется закрытым для поисковой индексации и не должен получать платный трафик.
        </p>
      ) : null}
    </LegalPageFrame>
  );
}



