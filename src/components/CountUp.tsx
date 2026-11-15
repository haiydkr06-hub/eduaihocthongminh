import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number | null | undefined
  /** Số chữ số thập phân hiển thị */
  decimals?: number
  durationMs?: number
  /** Hiển thị khi chưa có giá trị */
  placeholder?: string
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/** Số đếm tăng dần từ giá trị cũ tới giá trị mới (tắt khi bật "giảm chuyển động"). */
export function CountUp({ value, decimals = 0, durationMs = 1100, placeholder = '…' }: CountUpProps) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    if (value === null || value === undefined) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const from = fromRef.current
    const to = value
    if (reduced || from === to) {
      fromRef.current = to
      const id = requestAnimationFrame(() => setDisplay(to))
      return () => cancelAnimationFrame(id)
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      setDisplay(from + (to - from) * easeOutCubic(t))
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, durationMs])

  if (value === null || value === undefined) return <>{placeholder}</>
  return (
    <span className="tabular-nums" aria-label={value.toLocaleString('vi-VN', { maximumFractionDigits: decimals })}>
      {display.toLocaleString('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  )
}
