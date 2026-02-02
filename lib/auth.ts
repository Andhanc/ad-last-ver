export type UserRole = "student" | "teacher" | "admin" | "superadmin"

export interface User {
  username: string
  role: UserRole
  email?: string
  fullName?: string
  institution?: string
}

const USERS: Record<string, { username: string; password: string; role: UserRole; email?: string; fullName?: string }> = {
  student: { username: "student", password: "student", role: "student" as UserRole, fullName: "Студент Тестовый" },
  teacher: { username: "teacher", password: "teacher", role: "teacher" as UserRole, fullName: "Преподаватель Тестовый" },
  admin: { username: "admin", password: "admin", role: "admin" as UserRole, fullName: "Администратор Тестовый" },
  superadmin: { username: "superadmin", password: "superadmin", role: "superadmin" as UserRole, fullName: "Главный Администратор" },
}

export function authenticate(username: string, password: string): User | null {
  // В клиентском коде используем только тестовых пользователей
  // Реальная аутентификация через API endpoint
  const user = USERS[username as keyof typeof USERS]
  if (user && user.password === password) {
    return { username: user.username, role: user.role, email: user.email, fullName: user.fullName }
  }
  return null
}

export function saveSession(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user))
  }
}

export function getSession(): User | null {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem("user")
    if (data) {
      return JSON.parse(data)
    }
  }
  return null
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
  }
}
