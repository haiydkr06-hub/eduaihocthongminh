/**
 * Lưu các tùy chọn chưa có cột trong database (lớp học, chuyên môn, giới thiệu, cấu hình hệ thống)
 * ngay trên thiết bị. Giao diện ghi rõ "lưu trên thiết bị này" để không gây hiểu nhầm.
 */
export function readPrefs<T extends object>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<T>) } : defaults
  } catch {
    return defaults
  }
}

export function writePrefs<T extends object>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}
