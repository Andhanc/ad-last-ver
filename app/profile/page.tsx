"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  LogOut,
  History,
  FileText,
  Building2,
  Mail,
  UserCircle,
  ExternalLink,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSession, clearSession } from "@/lib/auth"
import { BsuirLogo } from "@/components/bsuir-logo"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FinalDocument {
  id: number
  title: string
  author: string | null
  filename: string | null
  category: string
  categoryLabel: string
  uploadDate: string
  reportViewUrl: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [finalDocuments, setFinalDocuments] = useState<FinalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<FinalDocument | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDocuments = () => {
    const currentUser = getSession()
    if (!currentUser) return
    fetch(`/api/documents/user/${currentUser.username}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setFinalDocuments(data.documents)
      })
      .catch((err) => console.error("Error fetching documents:", err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const currentUser = getSession()
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(currentUser)
    setLoading(true)
    fetchDocuments()
  }, [router])

  const handleLogout = () => {
    clearSession()
    router.push("/login")
  }

  const handleOpenReport = (doc: FinalDocument) => {
    if (doc.reportViewUrl) window.open(doc.reportViewUrl, "_blank", "noopener,noreferrer")
  }

  const handleDeleteClick = (doc: FinalDocument) => setDeleteConfirm(doc)
  const handleDeleteCancel = () => setDeleteConfirm(null)

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || !user) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/documents/user/${user.username}/documents/${deleteConfirm.id}`,
        { method: "DELETE" },
      )
      const data = await res.json()
      if (data.success) {
        setFinalDocuments((prev) => prev.filter((d) => d.id !== deleteConfirm.id))
        setDeleteConfirm(null)
      } else {
        alert(data.error || "Не удалось удалить")
      }
    } catch (err) {
      alert("Ошибка при удалении")
    } finally {
      setDeleting(false)
    }
  }

  if (!user) {
    return null
  }

  const roleLabels: Record<string, string> = {
    student: "Студент",
    teacher: "Преподаватель",
    admin: "Администратор",
    superadmin: "Главный администратор",
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-r from-blue-50 to-white dark:from-gray-900 dark:to-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BsuirLogo href="/profile" />
            {(() => {
              const role = user.role as string
              const label = roleLabels[role] || role
              const colorClasses =
                role === "teacher"
                  ? "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-100 dark:border-indigo-500/40"
                  : role === "student"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-500/40"
                    : "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/40 dark:text-slate-100 dark:border-slate-500/40"
              return (
                <Badge
                  variant="outline"
                  className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${colorClasses}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {label}
                </Badge>
              )
            })()}
          </div>
          <nav className="flex items-center gap-4">
            {(user.role === "student" || user.role === "teacher") && (
              <Button variant="ghost" onClick={() => router.push("/check")} className="gap-2">
                <FileText className="h-4 w-4" />
                Проверка
              </Button>
            )}
            {(user.role === "admin" || user.role === "superadmin") && (
              <Button variant="ghost" onClick={() => router.push("/admin")} className="gap-2">
                <FileText className="h-4 w-4" />
                Админ-панель
              </Button>
            )}
            <Button variant="outline" className="gap-2 bg-transparent" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Личная информация */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Личная информация
              </CardTitle>
              <CardDescription>Ваши данные в системе</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    ФИО
                  </p>
                  <p className="font-medium">{user.fullName || "Не указано"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Логин
                  </p>
                  <p className="font-medium">{user.username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="font-medium">{user.email || "Не указано"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Учебное заведение
                  </p>
                  <p className="font-medium">{user.institution || "БГУИР"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Тип пользователя</p>
                  {(() => {
                    const role = user.role as string
                    const label = roleLabels[role] || role
                    const colorClasses =
                      role === "teacher"
                        ? "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-100 dark:border-indigo-500/40"
                        : role === "student"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-500/40"
                          : "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/40 dark:text-slate-100 dark:border-slate-500/40"
                    return (
                      <Badge
                        variant="outline"
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${colorClasses}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {label}
                      </Badge>
                    )
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* История финальных версий */}
          {(user.role === "student" || user.role === "teacher") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  История финальных версий
                </CardTitle>
                <CardDescription>Ваши документы, сохраненные как финальные версии</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
                ) : finalDocuments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">У вас пока нет финальных версий документов</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {finalDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className={`group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-primary/30 transition-all ${
                          doc.reportViewUrl ? "cursor-pointer" : ""
                        }`}
                        onClick={() => doc.reportViewUrl && handleOpenReport(doc)}
                        role={doc.reportViewUrl ? "button" : undefined}
                        tabIndex={doc.reportViewUrl ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (doc.reportViewUrl && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault()
                            handleOpenReport(doc)
                          }
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{doc.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground/80">
                              {doc.categoryLabel || doc.category}
                            </span>
                            <span>
                              {new Date(doc.uploadDate).toLocaleDateString("ru-RU", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className="bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
                          >
                            Финальная версия
                          </Badge>
                          {doc.reportViewUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenReport(doc)
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                              Открыть отчёт
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClick(doc)
                            }}
                            aria-label="Удалить документ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить документ?</AlertDialogTitle>
            <AlertDialogDescription>
              Работа «{deleteConfirm?.title}» будет удалена из базы. Отчёт и файл работы удаляются
              безвозвратно. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90 dark:text-destructive-foreground"
            >
              {deleting ? "Удаление…" : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
