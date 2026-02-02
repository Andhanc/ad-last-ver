/**
 * Русские названия типов работ для отображения в UI.
 */

export const CATEGORY_LABELS: Record<string, string> = {
  diploma: "Дипломная работа",
  coursework: "Курсовая работа / Проект",
  lab: "Лабораторная работа",
  practice: "Практическое задание",
  uncategorized: "Не указано",
}

export function categoryLabel(cat?: string): string {
  if (!cat) return "Не указано"
  return CATEGORY_LABELS[cat] ?? cat
}
