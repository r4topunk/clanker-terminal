/**
 * Formats an Ethereum address by showing the first and last n characters
 * @param address The Ethereum address to format
 * @param chars The number of characters to show at start and end (default: 4)
 * @returns The formatted address
 */
export function formatAddress(address?: string, chars: number = 4): string {
  if (!address) return "";
  if (address.length < chars * 2) return address;

  const start = address.slice(0, chars);
  const end = address.slice(-chars);

  return `${start}...${end}`;
}
