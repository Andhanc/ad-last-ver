# PlagiarismGuard - Система антиплагиата

Веб-платформа для проверки текстовых документов на плагиат с использованием научно обоснованных алгоритмов.

## Алгоритмы

- **Shingling** - разбиение текста на k-граммы (Broder, 1997)
- **MinHash** - создание компактных сигнатур для быстрого сравнения
- **LSH** - Locality-Sensitive Hashing для поиска похожих документов
- **Jaccard Similarity** - вычисление процента схожести

## Локальный запуск

### Разработка

\`\`\`bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev
\`\`\`

Откройте http://localhost:3000

### Развертывание с Docker

См. подробную документацию в [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md)

Быстрый старт:

\`\`\`bash
# Настройка переменных окружения
cp env.bsuir.local.example .env.local
# Отредактируйте .env.local и укажите настройки LDAP

# Запуск через Docker Compose
docker-compose up -d

# Или используйте скрипт развертывания
chmod +x deploy.sh
./deploy.sh
\`\`\`

Приложение будет доступно по адресу:
- **На сервере:** `http://guard-main.by:3000` (после настройки DNS)
- **Локально:** `http://localhost:3000`

**Настройка DNS:** См. [DNS_SETUP.md](./DNS_SETUP.md)

## Структура данных

При локальном запуске файлы хранятся физически:

\`\`\`
data/
├── documents.json    # База метаданных и MinHash сигнатур
└── uploads/          # Загруженные PDF/DOCX файлы
    ├── 1234567890_document1.pdf
    └── 1234567891_document2.docx
\`\`\`

## Использование

1. **Админ-панель** (`/admin`) - загрузка документов в базу
2. **Проверка** (`/check`) - проверка работы на плагиат

## Технологии

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- pdf.js для парсинга PDF
- mammoth для парсинга DOCX
