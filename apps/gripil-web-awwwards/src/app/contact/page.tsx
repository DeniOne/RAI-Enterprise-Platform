import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageFrame } from "@/components/LegalPageFrame";
import { getSiteProfile } from "@/lib/site-profile";

export const metadata: Metadata = {
  title: "Контакты | ГРИПИЛ",
  description: "Каналы связи по заявкам и вопросам о продукте ГРИПИЛ.",
};

export default function ContactPage() {
  const profile = getSiteProfile();
  const telHref = `tel:${profile.contactPhone.replace(/[^\d+]/g, "")}`;
  const mailHref = `mailto:${profile.contactEmail}`;

  return (
    <LegalPageFrame
      eyebrow="Контакты"
      title="Контакты по заявкам"
      description="Оставьте форму на сайте или используйте прямой канал связи, когда нужна быстрая проверка сценария применения."
    >
      <p>
        Телефон:{" "}
        <Link href={telHref} className="text-[#C6D98A] underline underline-offset-4">
          {profile.contactPhone}
        </Link>
        .
      </p>
      <p>
        Электронная почта:{" "}
        <Link href={mailHref} className="text-[#C6D98A] underline underline-offset-4">
          {profile.contactEmail}
        </Link>
        .
      </p>
      <p>
        Обращение через форму сайта используется только для обратной связи по продукту, уточнения параметров поля и отправки
        технологической карты по вашему обращению.
      </p>
    </LegalPageFrame>
  );
}


