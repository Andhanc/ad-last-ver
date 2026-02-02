import { type NextRequest, NextResponse } from "next/server"
import { getAllDocumentsFromDb } from "@/lib/local-storage"
import { getLogs } from "@/lib/logger"

// GET - Получение статистики
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const category = searchParams.get("category") || "all"
    const minUniqueness = Number.parseInt(searchParams.get("minUniqueness") || "0")
    const maxUniqueness = Number.parseInt(searchParams.get("maxUniqueness") || "100")

    const documents = getAllDocumentsFromDb()
    const logs = getLogs(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    )

    // Фильтруем документы
    let filteredDocs = documents
    if (startDate) {
      filteredDocs = filteredDocs.filter((doc) => new Date(doc.uploadDate) >= new Date(startDate))
    }
    if (endDate) {
      filteredDocs = filteredDocs.filter((doc) => new Date(doc.uploadDate) <= new Date(endDate))
    }
    if (category !== "all") {
      filteredDocs = filteredDocs.filter((doc) => doc.category === category)
    }

    // Подсчитываем проверки из логов
    const checkLogs = logs.filter((log) => log.action === "check")
    const totalChecks = checkLogs.length

    // Статистика по категориям
    const categoryCounts = new Map<string, number>()
    filteredDocs.forEach((doc) => {
      const cat = doc.category || "uncategorized"
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1)
    })

    const checksByCategory = Array.from(categoryCounts.entries()).map(([category, count]) => ({
      category,
      count,
    }))

    // Статистика по датам
    const dateCounts = new Map<string, number>()
    checkLogs.forEach((log) => {
      const date = new Date(log.timestamp).toISOString().split("T")[0]
      dateCounts.set(date, (dateCounts.get(date) || 0) + 1)
    })

    const checksByDate = Array.from(dateCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Последние 30 дней

    // Распределение уникальности (упрощенная версия)
    const uniquenessRanges = [
      { range: "0-20%", min: 0, max: 20 },
      { range: "21-40%", min: 21, max: 40 },
      { range: "41-60%", min: 41, max: 60 },
      { range: "61-80%", min: 61, max: 80 },
      { range: "81-100%", min: 81, max: 100 },
    ]

    const uniquenessDistribution = uniquenessRanges.map((range) => ({
      range: range.range,
      count: Math.floor(Math.random() * 10), // TODO: Реальная статистика из результатов проверок
    }))

    // Активность пользователей
    const userActivity = new Map<string, number>()
    checkLogs.forEach((log) => {
      if (log.userId) {
        userActivity.set(log.userId, (userActivity.get(log.userId) || 0) + 1)
      }
    })

    const topUsers = Array.from(userActivity.entries())
      .map(([username, checks]) => ({ username, checks }))
      .sort((a, b) => b.checks - a.checks)
      .slice(0, 10)

    // Средняя уникальность (упрощенная версия)
    const averageUniqueness = 75.5 // TODO: Реальная статистика из результатов проверок

    const statistics = {
      totalChecks,
      totalDocuments: filteredDocs.length,
      averageUniqueness,
      checksByCategory,
      checksByDate,
      uniquenessDistribution,
      userActivity: topUsers,
    }

    return NextResponse.json({
      success: true,
      statistics,
    })
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch statistics" }, { status: 500 })
  }
}
