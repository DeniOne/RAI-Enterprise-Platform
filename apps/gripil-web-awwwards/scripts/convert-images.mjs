import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, basename, extname } from 'path';

const dir = './public/images';

const files = await readdir(dir);

for (const file of files) {
  const ext = extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

  const inputPath = join(dir, file);
  const name = basename(file, ext);
  const outputPath = join(dir, name + '.webp');

  const statBefore = await stat(inputPath);

  // agronomist-proof.jpg — очень тяжелый, quality=60
  // остальные — quality=82
  const quality = statBefore.size > 5_000_000 ? 60 : 82;

  await sharp(inputPath)
    .webp({ quality, effort: 6 })
    .toFile(outputPath);

  const statAfter = await stat(outputPath);
  console.log(
    `✓ ${file} (${Math.round(statBefore.size / 1024)}KB) → ${name}.webp (${Math.round(statAfter.size / 1024)}KB) [${Math.round((1 - statAfter.size / statBefore.size) * 100)}% меньше]`
  );
}

console.log('\nВсе изображения конвертированы в WebP.');
