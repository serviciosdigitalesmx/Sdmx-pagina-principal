import sharp from "sharp";

export type CompressedImage = {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  bytes: number;
};

export async function compressEvidenceImage(buffer: Buffer) {
  const output = await sharp(buffer)
    .rotate()
    .resize({
      width: 1280,
      height: 1280,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: 78, effort: 4 })
    .toBuffer();

  return {
    buffer: output,
    mimeType: "image/webp",
    extension: "webp",
    bytes: output.length
  } satisfies CompressedImage;
}

export async function compressPdfPreviewImage(buffer: Buffer) {
  return await sharp(buffer)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true
    })
    .jpeg({ quality: 75, mozjpeg: true })
    .toBuffer();
}

