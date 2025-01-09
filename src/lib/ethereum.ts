import { Address, isAddress, isAddressEqual as isAddressEqualViem } from "viem";

export function formatAddress(address?: string, chars: number = 4): string {
  if (!address) return "";
  if (address.length < chars * 2) return address;

  const start = address.slice(0, chars);
  const end = address.slice(-chars);

  return `${start}...${end}`;
}

export function isAddressEqualTo(a?: string | null, b?: string | null) {
  if (!a || !b || !isAddress(a) || !isAddress(b)) return false;
  return isAddressEqualViem(a as Address, b as Address);
}
