import MarkdownIt from 'markdown-it'
import katex from 'katex'
import hljs from 'highlight.js/lib/common'

const renderKatex = (content, displayMode) => {
  try {
    return katex.renderToString(content, {
      throwOnError: false,
      displayMode,
    })
  } catch {
    return content
  }
}

const mathPlugin = (md) => {
  const isEscaped = (src, pos) => {
    let backslashes = 0
    let i = pos - 1
    while (i >= 0 && src[i] === '\\') {
      backslashes += 1
      i -= 1
    }
    return backslashes % 2 === 1
  }

  const inlineMath = (state, silent) => {
    const start = state.pos
    if (state.src[start] !== '$') return false
    if (state.src[start + 1] === '$') return false
    let pos = start + 1
    while (pos < state.posMax) {
      pos = state.src.indexOf('$', pos)
      if (pos === -1) return false
      if (!isEscaped(state.src, pos)) break
      pos += 1
    }
    if (pos <= start + 1) return false
    if (!silent) {
      const token = state.push('math_inline', 'math', 0)
      token.content = state.src.slice(start + 1, pos)
    }
    state.pos = pos + 1
    return true
  }

  const blockMath = (state, startLine, endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const maxPos = state.eMarks[startLine]
    if (state.src.slice(startPos, startPos + 2) !== '$$') return false

    let nextLine = startLine
    let content = ''
    let found = false

    if (startPos + 2 < maxPos) {
      const firstLine = state.src.slice(startPos + 2, maxPos)
      const closingIndex = firstLine.indexOf('$$')
      if (closingIndex !== -1) {
        content = firstLine.slice(0, closingIndex)
        found = true
      }
    }

    while (!found) {
      nextLine += 1
      if (nextLine >= endLine) return false
      const lineStart = state.bMarks[nextLine] + state.tShift[nextLine]
      const lineMax = state.eMarks[nextLine]
      if (state.src.slice(lineStart, lineStart + 2) === '$$') {
        found = true
        break
      }
      content += `${state.src.slice(lineStart, lineMax)}\n`
    }

    if (silent) return true
    state.line = nextLine + 1
    const token = state.push('math_block', 'math', 0)
    token.block = true
    token.content = content.trimEnd()
    return true
  }

  md.inline.ruler.after('escape', 'math_inline', inlineMath)
  md.block.ruler.after('fence', 'math_block', blockMath, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })

  md.renderer.rules.math_inline = (tokens, idx) =>
    renderKatex(tokens[idx].content, false)
  md.renderer.rules.math_block = (tokens, idx) =>
    `<div class="math-block">${renderKatex(tokens[idx].content, true)}</div>`
}

export const createMarkdownRenderer = () => {
  const md = new MarkdownIt({
    html: false,
    linkify: false,
    breaks: true,
    highlight(code, language) {
      if (language && hljs.getLanguage(language)) {
        return `<pre class="hljs"><code>${hljs.highlight(code, { language }).value}</code></pre>`
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`
    },
  })
  md.use(mathPlugin)
  return md
}
