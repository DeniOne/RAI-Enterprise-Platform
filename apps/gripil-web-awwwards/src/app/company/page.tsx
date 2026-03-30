import type { Metadata } from "next";
import { LegalPageFrame } from "@/components/LegalPageFrame";
import { getSiteProfile } from "@/lib/site-profile";

export const metadata: Metadata = {
  title: "Данные компании | ГРИПИЛ",
  description: "Юридические и контактные данные оператора сайта ГРИПИЛ.",
};

export default function CompanyPage() {
  const profile = getSiteProfile();

  return (
    <LegalPageFrame
      eyebrow="Оператор"
      title="Данные оператора"
      description="Эта страница собирает публичный минимум для доверия: юрлицо, адрес и канал связи по заявкам."
    >
      <p>
        Краткое наименование: <strong>{profile.companyShortName}</strong>.
      </p>
      <p>
        Полное наименование: <strong>{profile.companyLegalName}</strong>.
      </p>
      <p>
        Адрес: <strong>{profile.companyAddress}</strong>.
      </p>
      <p>
        Эта страница не заменяет полный договорной пакет. Она закрывает публичный минимум для сайта и даёт понятную точку
        идентификации оператора перед отправкой формы.
      </p>
      {!profile.isComplete ? (
        <p className="rounded-2xl border border-[#FFB4B4]/20 bg-[#170F0C] px-4 py-3 text-[#FFD0C6]">
          Сейчас отображаются временные значения профиля релиза. Перед выкладкой заполните переменные окружения `GRIPIL_*` реальными
          данными компании.
        </p>
      ) : null}
    </LegalPageFrame>
  );
}



