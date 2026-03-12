export const EXTERNAL_FRONT_OFFICE_BASE_PATH = "/portal/front-office";
export const EXTERNAL_FRONT_OFFICE_LOGIN_PATH =
  `${EXTERNAL_FRONT_OFFICE_BASE_PATH}/login`;
export const EXTERNAL_FRONT_OFFICE_ACTIVATE_PATH =
  `${EXTERNAL_FRONT_OFFICE_BASE_PATH}/activate`;
export const EXTERNAL_FRONT_OFFICE_API_BASE_PATH = "/portal/front-office";

export function getExternalFrontOfficeThreadPath(threadKey: string): string {
  return `${EXTERNAL_FRONT_OFFICE_BASE_PATH}/threads/${encodeURIComponent(
    threadKey,
  )}`;
}
