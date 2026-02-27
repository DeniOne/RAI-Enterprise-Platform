import { PartyLookupPartyType } from "./party-lookup.types";

function computeChecksum(value: string, coefficients: number[]): number {
  const sum = coefficients.reduce((acc, coefficient, index) => {
    const digit = Number(value[index] ?? 0);
    return acc + digit * coefficient;
  }, 0);
  return (sum % 11) % 10;
}

export function isRuInnValid(
  value: string,
  partyType: PartyLookupPartyType,
): boolean {
  if (!/^\d+$/.test(value)) {
    return false;
  }

  if (partyType === "LEGAL_ENTITY") {
    if (value.length !== 10) {
      return false;
    }
    const checksum = computeChecksum(value, [2, 4, 10, 3, 5, 9, 4, 6, 8]);
    return checksum === Number(value[9]);
  }

  if (value.length !== 12) {
    return false;
  }

  const checksum11 = computeChecksum(value, [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);
  const checksum12 = computeChecksum(value, [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);

  return checksum11 === Number(value[10]) && checksum12 === Number(value[11]);
}
