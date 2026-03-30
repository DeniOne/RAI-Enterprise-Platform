type RawSiteProfile = {
  siteUrl: string;
  companyShortName: string;
  companyLegalName: string;
  contactPhone: string;
  contactEmail: string;
  companyAddress: string;
};

const FALLBACK_SITE_URL = "https://gripil.local";
const FALLBACK_PROFILE: RawSiteProfile = {
  siteUrl: FALLBACK_SITE_URL,
  companyShortName: "ГРИПИЛ",
  companyLegalName: "Оператор данных ГРИПИЛ",
  contactPhone: "+7 (000) 000-00-00",
  contactEmail: "hello@gripil.local",
  companyAddress: "Адрес и реквизиты будут опубликованы после заполнения профиля релиза.",
};

function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function resolveSiteUrl(rawUrl: string) {
  try {
    return new URL(rawUrl);
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}

export type SiteProfile = {
  siteUrl: URL;
  companyShortName: string;
  companyLegalName: string;
  contactPhone: string;
  contactEmail: string;
  companyAddress: string;
  isComplete: boolean;
  allowIndexing: boolean;
  missingFields: string[];
};

export function getSiteProfile(): SiteProfile {
  const rawProfile: RawSiteProfile = {
    siteUrl: readEnv("GRIPIL_SITE_URL") || FALLBACK_PROFILE.siteUrl,
    companyShortName: readEnv("GRIPIL_COMPANY_SHORT_NAME") || FALLBACK_PROFILE.companyShortName,
    companyLegalName: readEnv("GRIPIL_COMPANY_LEGAL_NAME") || FALLBACK_PROFILE.companyLegalName,
    contactPhone: readEnv("GRIPIL_CONTACT_PHONE") || FALLBACK_PROFILE.contactPhone,
    contactEmail: readEnv("GRIPIL_CONTACT_EMAIL") || FALLBACK_PROFILE.contactEmail,
    companyAddress: readEnv("GRIPIL_COMPANY_ADDRESS") || FALLBACK_PROFILE.companyAddress,
  };

  const missingFields = [
    ["GRIPIL_SITE_URL", readEnv("GRIPIL_SITE_URL")],
    ["GRIPIL_COMPANY_SHORT_NAME", readEnv("GRIPIL_COMPANY_SHORT_NAME")],
    ["GRIPIL_COMPANY_LEGAL_NAME", readEnv("GRIPIL_COMPANY_LEGAL_NAME")],
    ["GRIPIL_CONTACT_PHONE", readEnv("GRIPIL_CONTACT_PHONE")],
    ["GRIPIL_CONTACT_EMAIL", readEnv("GRIPIL_CONTACT_EMAIL")],
    ["GRIPIL_COMPANY_ADDRESS", readEnv("GRIPIL_COMPANY_ADDRESS")],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  const isComplete = missingFields.length === 0;
  const allowIndexing = process.env.NODE_ENV === "production" && isComplete;

  return {
    siteUrl: resolveSiteUrl(rawProfile.siteUrl),
    companyShortName: rawProfile.companyShortName,
    companyLegalName: rawProfile.companyLegalName,
    contactPhone: rawProfile.contactPhone,
    contactEmail: rawProfile.contactEmail,
    companyAddress: rawProfile.companyAddress,
    isComplete,
    allowIndexing,
    missingFields,
  };
}
