/**
 * Локальное файловое хранилище для системы антиплагиата
 * Работает только при локальном запуске через npm run dev
 * Файлы сохраняются в data/uploads/, метаданные в data/documents.json
 */

import fs from "fs"
import path from "path"

// Типы
export type DocumentStatus = "draft" | "final"

export interface StoredDocument {
  id: number
  title: string
  author: string | null
  filename: string | null
  filePath: string | null
  content: string
  wordCount: number
  uploadDate: string
  category: string
  status: DocumentStatus
  userId?: string // ID пользователя, загрузившего документ
  institution?: string // Учебное заведение
  minhashSignature: number[]
  shingleCount: number
  /** Процент оригинальности (0–100), заполняется после генерации финальной справки */
  originalityPercent?: number
}

interface DatabaseFile {
  nextId: number
  documents: StoredDocument[]
}

// Пути к файлам
const DATA_DIR = path.join(process.cwd(), "data")
const UPLOADS_DIR = path.join(DATA_DIR, "uploads")
const REPORTS_DIR = path.join(DATA_DIR, "reports")
const DB_FILE = path.join(DATA_DIR, "documents.json")

// Инициализация директорий
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true })
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialDb: DatabaseFile = { nextId: 1, documents: [] }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8")
  }
}

// Чтение базы данных
function readDatabase(): DatabaseFile {
  ensureDirectories()
  const data = fs.readFileSync(DB_FILE, "utf-8")
  return JSON.parse(data)
}

// Запись базы данных
function writeDatabase(db: DatabaseFile) {
  ensureDirectories()
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8")
}

// Сохранение файла на диск
export function saveFileToDisk(fileBuffer: Buffer, originalFilename: string): string {
  ensureDirectories()

  // Создаем уникальное имя файла с timestamp
  const timestamp = Date.now()
  const ext = path.extname(originalFilename)
  const baseName = path.basename(originalFilename, ext)
  const safeBaseName = baseName.replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, "_")
  const newFilename = `${timestamp}_${safeBaseName}${ext}`
  const filePath = path.join(UPLOADS_DIR, newFilename)

  fs.writeFileSync(filePath, fileBuffer)

  return newFilename
}

// Добавление документа в базу
export function addDocumentToDb(
  title: string,
  content: string,
  minhashSignature: number[],
  shingleCount: number,
  author?: string,
  filename?: string,
  savedFilename?: string,
  category = "uncategorized",
  status: DocumentStatus = "draft",
  userId?: string,
  institution?: string,
): StoredDocument {
  const db = readDatabase()

  const doc: StoredDocument = {
    id: db.nextId++,
    title,
    author: author || null,
    filename: filename || null,
    filePath: savedFilename ? `data/uploads/${savedFilename}` : null,
    content,
    wordCount: content.split(/\s+/).filter((w) => w.length > 0).length,
    uploadDate: new Date().toISOString(),
    category,
    status,
    userId,
    institution,
    minhashSignature,
    shingleCount,
  }

  db.documents.push(doc)
  writeDatabase(db)

  return doc
}

// Получение всех документов
export function getAllDocumentsFromDb(excludeUserId?: string, institution?: string): StoredDocument[] {
  const db = readDatabase()
  const now = Date.now()
  
  // Удаляем черновики старше 24 часов
  const documents = db.documents.filter((doc) => {
    if (doc.status === "draft") {
      const uploadTime = new Date(doc.uploadDate).getTime()
      const hoursSinceUpload = (now - uploadTime) / (1000 * 60 * 60)
      if (hoursSinceUpload >= 24) {
        // Удаляем физический файл если есть
        if (doc.filePath) {
          const fullPath = path.join(process.cwd(), doc.filePath)
          if (fs.existsSync(fullPath)) {
            try {
              fs.unlinkSync(fullPath)
            } catch (err) {
              console.error("Error deleting draft file:", err)
            }
          }
        }
        return false // Исключаем из списка
      }
    }
    return true
  })
  
  // Обновляем базу, удаляя старые черновики
  if (documents.length !== db.documents.length) {
    db.documents = documents
    writeDatabase(db)
  }
  
  // Фильтруем документы
  let filtered = documents
  
  // Исключаем документы текущего пользователя (исключить самоплагиат)
  if (excludeUserId) {
    filtered = filtered.filter((doc) => doc.userId !== excludeUserId)
  }
  
  // Адресная проверка по учебному заведению
  if (institution) {
    filtered = filtered.filter((doc) => doc.institution === institution)
  }
  
  return filtered.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
}

// Получение финальных версий документов пользователя
export function getUserFinalDocuments(userId: string): StoredDocument[] {
  const db = readDatabase()
  return db.documents
    .filter((doc) => doc.userId === userId && doc.status === "final")
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
}

// Получение документа по ID
export function getDocumentByIdFromDb(id: number): StoredDocument | null {
  const db = readDatabase()
  return db.documents.find((doc) => doc.id === id) || null
}

// Удаление документа
export function deleteDocumentFromDb(id: number): boolean {
  const db = readDatabase()
  const docIndex = db.documents.findIndex((doc) => doc.id === id)

  if (docIndex === -1) return false

  const doc = db.documents[docIndex]

  // Удаляем физический файл если есть
  if (doc.filePath) {
    const fullPath = path.join(process.cwd(), doc.filePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  }

  db.documents.splice(docIndex, 1)
  writeDatabase(db)

  return true
}

// Подсчет документов
export function getDocumentCountFromDb(): number {
  const db = readDatabase()
  return db.documents.length
}

// Обновление процента оригинальности документа (после генерации справки)
export function updateDocumentOriginality(documentId: number, originalityPercent: number): boolean {
  const db = readDatabase()
  const doc = db.documents.find((d) => d.id === documentId)
  if (!doc) return false
  doc.originalityPercent = Math.round(originalityPercent * 100) / 100
  writeDatabase(db)
  return true
}

// ——— Итоговые отчёты (PDF) для финальных версий ———

export function saveReportPdf(
  documentId: number,
  pdfBuffer: Buffer,
  originalityPercent?: number,
): boolean {
  ensureDirectories()
  const filePath = path.join(REPORTS_DIR, `${documentId}.pdf`)
  try {
    fs.writeFileSync(filePath, pdfBuffer)
    if (originalityPercent !== undefined) {
      updateDocumentOriginality(documentId, originalityPercent)
    }
    return true
  } catch (err) {
    console.error("Error saving report PDF:", err)
    return false
  }
}

export function getReportPdfPath(documentId: number): string | null {
  const filePath = path.join(REPORTS_DIR, `${documentId}.pdf`)
  return fs.existsSync(filePath) ? filePath : null
}

export function getReportPdfBuffer(documentId: number): Buffer | null {
  const p = getReportPdfPath(documentId)
  if (!p) return null
  try {
    return fs.readFileSync(p)
  } catch {
    return null
  }
}

export function deleteReportPdf(documentId: number): boolean {
  const p = getReportPdfPath(documentId)
  if (!p) return false
  try {
    fs.unlinkSync(p)
    return true
  } catch (err) {
    console.error("Error deleting report PDF:", err)
    return false
  }
}
