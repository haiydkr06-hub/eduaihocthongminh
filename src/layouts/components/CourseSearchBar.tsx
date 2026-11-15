import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { studentService } from '../../services/studentService'

export interface SearchCourseResult {
  id: string
  title: string
  category: string
  instructor?: string
  description?: string
  accent?: string
  illustration?: string
}

interface CourseDbRow {
  id: string
  title: string
  category?: string | null
  description?: string | null
  thumbnail_url?: string | null
  profiles?: { full_name?: string } | null
}

export function CourseSearchBar() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchCourseResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Lắng nghe sự kiện click ngoài để đóng dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      // Phím tắt Ctrl+K hoặc Cmd+K để focus vào ô tìm kiếm
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      // Phím Escape để đóng dropdown
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Xử lý Debounce tìm kiếm khóa học
  useEffect(() => {
    const trimmed = searchTerm.trim()
    if (!trimmed) {
      const timer = setTimeout(() => {
        setResults([])
        setLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        let foundCourses: SearchCourseResult[] = []

        // 1. Thử truy vấn bảng courses trên Supabase với status = 'published' và title ILIKE %keyword%
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('courses')
            .select(`
              id,
              title,
              category,
              description,
              thumbnail_url,
              profiles:teacher_id (full_name)
            `)
            .eq('status', 'published')
            .ilike('title', `%${trimmed}%`)
            .limit(8)

          if (!error && data && data.length > 0) {
            const courseRows = data as unknown as CourseDbRow[]
            foundCourses = courseRows.map((c, idx: number) => ({
              id: c.id,
              title: c.title,
              category: c.category || 'Môn học',
              instructor: c.profiles?.full_name || 'Giảng viên EduAI',
              description: c.description || '',
              accent: idx % 3 === 0 ? 'lavender' : idx % 3 === 1 ? 'mint' : 'peach',
              illustration: idx % 3 === 0 ? '∑' : idx % 3 === 1 ? '✳' : 'A',
            }))
          }
        }

        // 2. Fallback tìm kiếm từ danh sách khóa học có sẵn nếu chưa có data từ Supabase
        if (foundCourses.length === 0) {
          const allCourses = await studentService.getAllAvailableCourses()
          foundCourses = allCourses
            .filter(
              (c) =>
                c.title.toLowerCase().includes(trimmed.toLowerCase()) ||
                c.category.toLowerCase().includes(trimmed.toLowerCase()) ||
                (c.description && c.description.toLowerCase().includes(trimmed.toLowerCase()))
            )
            .map((c) => ({
              id: c.id,
              title: c.title,
              category: c.category,
              instructor: c.instructor,
              description: c.description,
              accent: c.accent,
              illustration: c.illustration,
            }))
        }

        setResults(foundCourses)
        setIsOpen(true)
      } catch (err) {
        console.warn('Lỗi tìm kiếm khóa học:', err)
      } finally {
        setLoading(false)
      }
    }, 300) // Debounce 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleSelectCourse = (courseId: string) => {
    setIsOpen(false)
    setSearchTerm('')
    navigate(`/student/learn/${courseId}`)
  }

  const handleViewAllResults = () => {
    setIsOpen(false)
    navigate(`/student/courses?search=${encodeURIComponent(searchTerm)}`)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (searchTerm.trim()) setIsOpen(true)
          }}
          placeholder="Tìm kiếm khóa học..."
          className="w-full pl-9 pr-16 py-2 bg-gray-100/80 hover:bg-gray-100 focus:bg-white text-xs sm:text-sm text-gray-800 placeholder-gray-400 rounded-xl border border-transparent focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none transition duration-150"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {loading ? (
            <svg className="animate-spin h-3.5 w-3.5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : searchTerm ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setResults([])
                setIsOpen(false)
              }}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 transition"
              title="Xóa tìm kiếm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 rounded shadow-2xs">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Danh Sách Kết Quả Ngay Dưới Ô Tìm Kiếm */}
      {isOpen && searchTerm.trim() && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200/90 overflow-hidden z-50 animate-fade-in">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
            <span>
              Kết quả cho: <strong className="text-gray-900 font-semibold">"{searchTerm}"</strong>
            </span>
            <span>{results.length} khóa học</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {loading && results.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Đang tìm kiếm khóa học...</span>
              </div>
            ) : results.length > 0 ? (
              results.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleSelectCourse(course.id)}
                  className="w-full p-3 flex items-start gap-3 hover:bg-primary-50/50 transition text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-100/70 text-primary-700 flex items-center justify-center text-lg font-bold flex-shrink-0 group-hover:scale-105 transition transform">
                    {course.illustration || '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 group-hover:text-primary-700 truncate">
                        {course.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                      <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-medium text-[10px]">
                        {course.category}
                      </span>
                      {course.instructor && (
                        <span>• {course.instructor}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover:text-primary-600 text-xs self-center">
                    →
                  </span>
                </button>
              ))
            ) : (
              <div className="p-6 text-center">
                <div className="text-2xl mb-1">🔍</div>
                <p className="text-xs font-semibold text-gray-700">Không tìm thấy khóa học phù hợp</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Hãy thử tìm kiếm với từ khóa khác như "Toán", "Khoa học", "Tiếng Anh"...
                </p>
              </div>
            )}
          </div>

          {results.length > 0 && (
            <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
              <button
                type="button"
                onClick={handleViewAllResults}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition"
              >
                Xem tất cả khóa học trên EduAI →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
