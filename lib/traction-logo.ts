const uint32 = (bytes: Uint8Array, offset: number, littleEndian = false) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, littleEndian);
const tag = (bytes: Uint8Array, offset: number) => String.fromCharCode(...bytes.subarray(offset, offset + 4));

function validPng(bytes: Uint8Array) {
  let offset = 8, header = false, image = false;
  while (offset + 12 <= bytes.length) {
    const size = uint32(bytes, offset), end = offset + 12 + size, type = tag(bytes, offset + 4);
    if (end > bytes.length || (!header && type !== "IHDR")) return false;
    // A truncated or corrupted chunk must not become a broken company logo.
    let crc = 0xffffffff;
    for (let i = offset + 4; i < end - 4; i++) {
      crc ^= bytes[i];
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    if (((crc ^ 0xffffffff) >>> 0) !== uint32(bytes, end - 4)) return false;
    if (type === "IHDR") {
      if (header || size !== 13 || !uint32(bytes, offset + 8) || !uint32(bytes, offset + 12)) return false;
      header = true;
    }
    if (type === "IDAT" && size > 0) image = true;
    if (type === "IEND") return header && image && size === 0 && end === bytes.length;
    offset = end;
  }
  return false;
}

function validJpeg(bytes: Uint8Array) {
  let offset = 2, frame = false, scan = false;
  while (offset < bytes.length) {
    if (bytes[offset++] !== 255) return false;
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    if (marker === 217) return frame && scan && offset === bytes.length;
    if (marker === 216 || marker === 0 || marker === undefined) return false;
    if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
    if (offset + 2 > bytes.length) return false;
    const size = (bytes[offset] << 8) | bytes[offset + 1];
    if (size < 2 || offset + size > bytes.length) return false;
    if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
      if (size < 8 || !(bytes[offset + 3] || bytes[offset + 4]) || !(bytes[offset + 5] || bytes[offset + 6])) return false;
      frame = true;
    }
    offset += size;
    if (marker === 218) {
      if (!frame || size < 6) return false;
      scan = true;
      while (offset < bytes.length) {
        if (bytes[offset] !== 255) { offset++; continue; }
        if (bytes[offset + 1] === 0 || (bytes[offset + 1] >= 208 && bytes[offset + 1] <= 215)) { offset += 2; continue; }
        break;
      }
    }
  }
  return false;
}

function validWebpChunks(bytes: Uint8Array, start: number, end: number): boolean {
  let offset = start, image = false;
  while (offset + 8 <= end) {
    const type = tag(bytes, offset), size = uint32(bytes, offset + 4, true), body = offset + 8;
    const next = body + size + (size % 2);
    if (!size || next > end) return false;
    if (type === "VP8 ") {
      if (size < 10 || bytes[body + 3] !== 157 || bytes[body + 4] !== 1 || bytes[body + 5] !== 42 || !((bytes[body + 6] | bytes[body + 7] << 8) & 16383) || !((bytes[body + 8] | bytes[body + 9] << 8) & 16383)) return false;
      image = true;
    }
    if (type === "VP8L") {
      if (size < 5 || bytes[body] !== 47) return false;
      image = true;
    }
    if (type === "ANMF") {
      if (size < 24 || !validWebpChunks(bytes, body + 16, body + size)) return false;
      image = true;
    }
    offset = next;
  }
  return image && offset === end;
}

export async function readBrandLogo(file: unknown): Promise<{ error: string } | { bytes: Uint8Array; contentType: string }> {
  if (!(file instanceof File) || file.size === 0 || file.size > 2 * 1024 * 1024) return { error: "Envie uma imagem PNG, JPG ou WebP de até 2 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte) ? "image/png"
    : bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "image/jpeg"
    : bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" ? "image/webp" : null;
  if (!type || file.type !== type) return { error: "Formato de imagem inválido. Use PNG, JPG ou WebP." };
  const complete = type === "image/png" ? validPng(bytes) : type === "image/jpeg" ? validJpeg(bytes)
    : uint32(bytes, 4, true) + 8 === bytes.length && validWebpChunks(bytes, 12, bytes.length);
  if (!complete) return { error: "A imagem está incompleta ou danificada. Escolha outra logo PNG, JPG ou WebP." };
  return { bytes, contentType: type };
}
