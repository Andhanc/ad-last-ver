"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Download, FileSpreadsheet, Calendar, Filter, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSession } from "@/lib/auth"
import * as XLSX from "xlsx"

interface StatisticsData {
  totalChecks: number
  totalDocuments: number
  averageUniqueness: number
  checksByCategory: Array<{ category: string; count: number }>
  checksByDate: Array<{ date: string; count: number }>
  uniquenessDistribution: Array<{ range: string; count: number }>
  userActivity: Array<{ username: string; checks: number }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function StatisticsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "all",
    minUniqueness: 0,
    maxUniqueness: 100,
  })

  useEffect(() => {
    fetchStatistics()
  }, [filters])

  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)
      if (filters.category !== "all") params.append("category", filters.category)
      params.append("minUniqueness", filters.minUniqueness.toString())
      params.append("maxUniqueness", filters.maxUniqueness.toString())

      const res = await fetch(`/api/admin/statistics?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setStats(data.statistics)
      }
    } catch (error) {
      console.error("Error fetching statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  const getExportData = () => {
    if (!stats) return []
    return [
      ["Период", filters.startDate || "Начало", filters.endDate || "Конец"],
      ["Всего проверок", stats.totalChecks.toString()],
      ["Всего документов", stats.totalDocuments.toString()],
      ["Средняя уникальность", stats.averageUniqueness.toFixed(2) + "%"],
      [],
      ["Проверки по категориям"],
      ["Категория", "Количество"],
      ...stats.checksByCategory.map((item) => [item.category, item.count.toString()]),
      [],
      ["Распределение уникальности"],
      ["Диапазон", "Количество"],
      ...stats.uniquenessDistribution.map((item) => [item.range, item.count.toString()]),
    ]
  }

  const handleExportCSV = () => {
    const rows = getExportData()
    if (rows.length === 0) return

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `statistics-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const handleExportXLSX = () => {
    const rows = getExportData()
    if (rows.length === 0) return

    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Статистика")
    XLSX.writeFile(wb, `statistics-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Загрузка статистики...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Ошибка загрузки статистики</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Статистика и отчеты</h1>
          <p className="text-muted-foreground">Анализ данных о проверках и активности пользователей</p>
        </div>

        {/* Фильтры */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Параметры выборки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Начальная дата</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Конечная дата</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Тип работы</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="diploma">Дипломная работа</SelectItem>
                    <SelectItem value="coursework">Курсовая работа</SelectItem>
                    <SelectItem value="lab">Лабораторная работа</SelectItem>
                    <SelectItem value="practice">Практическое задание</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Уникальность (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="От"
                    min={0}
                    max={100}
                    value={filters.minUniqueness}
                    onChange={(e) => setFilters({ ...filters, minUniqueness: Number.parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    type="number"
                    placeholder="До"
                    min={0}
                    max={100}
                    value={filters.maxUniqueness}
                    onChange={(e) => setFilters({ ...filters, maxUniqueness: Number.parseInt(e.target.value) || 100 })}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    Экспорт
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Экспорт CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportXLSX}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Экспорт XLSX
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Общая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Всего проверок</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalChecks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Всего документов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalDocuments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Средняя уникальность</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.averageUniqueness.toFixed(2)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Графики */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Проверки по категориям</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.checksByCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {stats.checksByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Распределение уникальности</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.uniquenessDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Проверки по датам</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.checksByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
