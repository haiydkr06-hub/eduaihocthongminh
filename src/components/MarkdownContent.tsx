import { Fragment, type ReactNode } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/**
 * Hiển thị Markdown rút gọn + công thức LaTeX cho nội dung bài học và câu trả lời AI.
 * Hỗ trợ: ### tiêu đề, danh sách (-, *, 1.), **đậm**, *nghiêng*, `code`, $inline$ và $$khối$$.
 * Công thức nằm bên trong **đậm** vẫn hiển thị đúng.
 * An toàn: văn bản thường được React escape; công thức do KaTeX render (trust: false).
 */

function Math({ tex, block }: { tex: string; block?: boolean }) {
  let html: string
  try {
    html = katex.renderToString(tex, { displayMode: !!block, throwOnError: false, trust: false, strict: 'ignore' })
  } catch {
    return <code>{tex}</code>
  }
  const Tag = block ? 'div' : 'span'
  return <Tag className={block ? 'my-2 overflow-x-auto' : undefined} dangerouslySetInnerHTML={{ __html: html }} />
}

type Token =
  | { kind: 'text'; value: string }
  | { kind: 'math'; value: string; block: boolean }
  | { kind: 'bold' | 'italic'; children: Token[] }
  | { kind: 'code'; value: string }

/** Tách công thức trước (để ** bên ngoài không cắt ngang công thức), sau đó mới xử lý định dạng. */
function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  let buffer = ''
  const flush = () => {
    if (buffer) tokens.push({ kind: 'text', value: buffer })
    buffer = ''
  }
  while (i < text.length) {
    const rest = text.slice(i)
    // $$ khối $$
    if (rest.startsWith('$$')) {
      const end = text.indexOf('$$', i + 2)
      if (end > i + 2) {
        flush()
        tokens.push({ kind: 'math', value: text.slice(i + 2, end), block: true })
        i = end + 2
        continue
      }
    }
    // $ inline $
    if (rest.startsWith('$')) {
      const end = text.indexOf('$', i + 1)
      if (end > i + 1 && !text.slice(i + 1, end).includes('\n')) {
        flush()
        tokens.push({ kind: 'math', value: text.slice(i + 1, end), block: false })
        i = end + 1
        continue
      }
    }
    // `code`
    if (rest.startsWith('`')) {
      const end = text.indexOf('`', i + 1)
      if (end > i + 1) {
        flush()
        tokens.push({ kind: 'code', value: text.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }
    // **đậm** (có thể chứa công thức)
    if (rest.startsWith('**')) {
      const end = findClosing(text, i + 2, '**')
      if (end > i + 2) {
        flush()
        tokens.push({ kind: 'bold', children: tokenize(text.slice(i + 2, end)) })
        i = end + 2
        continue
      }
    }
    // *nghiêng*
    if (rest.startsWith('*') && !rest.startsWith('**')) {
      const end = findClosing(text, i + 1, '*')
      if (end > i + 1 && !text.slice(i + 1, end).includes('\n')) {
        flush()
        tokens.push({ kind: 'italic', children: tokenize(text.slice(i + 1, end)) })
        i = end + 1
        continue
      }
    }
    buffer += text[i]
    i++
  }
  flush()
  return tokens
}

/** Tìm dấu đóng, bỏ qua các dấu nằm trong công thức $...$. */
function findClosing(text: string, from: number, marker: string): number {
  let inMath = false
  for (let k = from; k < text.length; k++) {
    if (text[k] === '$') inMath = !inMath
    if (!inMath && text.startsWith(marker, k)) {
      if (marker === '*' && text.startsWith('**', k)) {
        k++
        continue
      }
      return k
    }
  }
  return -1
}

function renderTokens(tokens: Token[], prefix = 't'): ReactNode[] {
  return tokens.map((t, i) => {
    const key = `${prefix}-${i}`
    switch (t.kind) {
      case 'math':
        return <Math key={key} tex={t.value} block={t.block} />
      case 'code':
        return (
          <code key={key} className="px-1 py-0.5 rounded bg-black/10 font-mono text-[0.9em]">
            {t.value}
          </code>
        )
      case 'bold':
        return <strong key={key}>{renderTokens(t.children, key)}</strong>
      case 'italic':
        return <em key={key}>{renderTokens(t.children, key)}</em>
      default:
        return <Fragment key={key}>{t.value}</Fragment>
    }
  })
}

const renderInline = (text: string) => renderTokens(tokenize(text))

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'math'; tex: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'p'; lines: string[] }

const LIST_ITEM = /^([-*]|\d+[.)])\s+/

function parse(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const trimmed = lines[i].trim()

    if (!trimmed) {
      i++
      continue
    }
    // Khối công thức $$ ... $$ (một hoặc nhiều dòng)
    if (trimmed.startsWith('$$')) {
      const rest = trimmed.slice(2)
      if (rest.endsWith('$$') && rest.length >= 2) {
        blocks.push({ kind: 'math', tex: rest.slice(0, -2) })
        i++
        continue
      }
      const texLines = [rest]
      i++
      while (i < lines.length && !lines[i].includes('$$')) texLines.push(lines[i++])
      if (i < lines.length) texLines.push(lines[i++].replace('$$', ''))
      blocks.push({ kind: 'math', tex: texLines.join('\n') })
      continue
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] })
      i++
      continue
    }
    if (LIST_ITEM.test(trimmed)) {
      const ordered = /^\d+[.)]\s+/.test(trimmed)
      const items: string[] = []
      while (i < lines.length) {
        const raw = lines[i]
        const t = raw.trim()
        const isIndented = /^\s{2,}/.test(raw)
        const m = ordered ? /^\d+[.)]\s+(.*)$/.exec(t) : /^[-*]\s+(.*)$/.exec(t)
        if (m && !isIndented) {
          items.push(m[1])
          i++
        } else if (t && isIndented && items.length) {
          // Dòng thụt lề (kể cả danh sách con) -> thuộc mục trước
          items[items.length - 1] += '\n' + t
          i++
        } else break
      }
      blocks.push({ kind: ordered ? 'ol' : 'ul', items })
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\$\$)/.test(lines[i].trim()) && !LIST_ITEM.test(lines[i].trim())) {
      para.push(lines[i].trim())
      i++
    }
    blocks.push({ kind: 'p', lines: para })
  }
  return blocks
}

function renderLines(lines: string[]) {
  return lines.map((line, i) => {
    const sub = /^[-*]\s+(.*)$/.exec(line)
    return (
      <Fragment key={i}>
        {i > 0 && <br />}
        {sub ? <span className="inline-block pl-3">• {renderInline(sub[1])}</span> : renderInline(line)}
      </Fragment>
    )
  })
}

export function MarkdownContent({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`space-y-2 leading-relaxed break-words ${className}`}>
      {parse(text).map((b, i) => {
        switch (b.kind) {
          case 'heading': {
            const size = b.level <= 2 ? 'text-base' : 'text-sm'
            return (
              <p key={i} role="heading" aria-level={b.level} className={`${size} font-bold mt-3 first:mt-0`}>
                {renderInline(b.text)}
              </p>
            )
          }
          case 'math':
            return <Math key={i} tex={b.tex} block />
          case 'ul':
            return (
              <ul key={i} className="list-disc pl-5 space-y-1">
                {b.items.map((it, j) => (
                  <li key={j}>{renderLines(it.split('\n'))}</li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="list-decimal pl-5 space-y-1">
                {b.items.map((it, j) => (
                  <li key={j}>{renderLines(it.split('\n'))}</li>
                ))}
              </ol>
            )
          default:
            return <p key={i}>{renderLines(b.lines)}</p>
        }
      })}
    </div>
  )
}

export default MarkdownContent
