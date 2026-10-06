export async function readBrandLogo(file: unknown) {
  if (!(file instanceof File) || file.size === 0 || file.size > 2 * 1024 * 1024) return { error: "Envie uma imagem PNG, JPG ou WebP de até 2 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte) ? "image/png"
    : bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "image/jpeg"
    : bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" ? "image/webp" : null;
  if (!type || file.type !== type) return { error: "Formato de imagem inválido. Use PNG, JPG ou WebP." };
  return { bytes, contentType: type };
}
