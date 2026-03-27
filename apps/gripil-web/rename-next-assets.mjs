// Post-build скрипт: переименовывает _next/ → n/ и обновляет ссылки во всех HTML-файлах
// Запустить: node rename-next-assets.mjs (после next build)

import { readdir, readFile, writeFile, rename, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';

const OUT_DIR = './out';
const OLD_PREFIX = '/_next/';
const NEW_PREFIX = '/n/';
const OLD_FOLDER = join(OUT_DIR, '_next');
const NEW_FOLDER = join(OUT_DIR, 'n');

async function getAllFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function replaceInFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  if (content.includes(OLD_PREFIX)) {
    const updated = content.split(OLD_PREFIX).join(NEW_PREFIX);
    await writeFile(filePath, updated, 'utf-8');
    console.log(`✓ Обновлён: ${filePath}`);
  }
}

async function main() {
  console.log('🔄 Переименовываем _next/ → n/ ...');

  if (!existsSync(OLD_FOLDER)) {
    console.error('❌ Папка out/_next/ не найдена. Сначала запусти next build.');
    process.exit(1);
  }

  // Переименовываем папку
  await rename(OLD_FOLDER, NEW_FOLDER);
  console.log('✓ _next/ → n/ (папка переименована)');

  // Заменяем ссылки во всех файлах
  const allFiles = await getAllFiles(OUT_DIR);
  const textFiles = allFiles.filter(f => ['.html', '.txt', '.js', '.css', '.json'].includes(extname(f)));

  console.log(`🔍 Обрабатываем ${textFiles.length} файлов...`);
  await Promise.all(textFiles.map(replaceInFile));

  console.log('\n✅ Готово! Папка out/ готова к загрузке на хостинг.');
}

main().catch(err => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
