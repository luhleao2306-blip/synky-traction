export const defaultBrand = { primary: "#00835E", sidebar: "#006F50" };

export const brandPresets = [
  { name: "Synky", ...defaultBrand },
  { name: "Verde clássico", primary: "#0A7655", sidebar: "#102C2A" },
  { name: "Oceano", primary: "#175CD3", sidebar: "#102A43" },
  { name: "Violeta", primary: "#6941C6", sidebar: "#292047" },
  { name: "Terracota", primary: "#9A4B30", sidebar: "#3A2521" },
];

function luminance(input: unknown) {
  if (typeof input !== "string" || !/^#[\da-fA-F]{6}$/.test(input)) return null;
  const channels = [1, 3, 5].map((index) => parseInt(input.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastWithWhite(input: unknown) {
  const level = luminance(input);
  return level === null ? null : 1.05 / (level + 0.05);
}

export function validBrandColor(input: unknown, maxLuminance = 0.18): input is string {
  const level = luminance(input);
  return level !== null && level <= maxLuminance;
}
