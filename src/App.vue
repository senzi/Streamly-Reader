<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useSettingsStore } from './stores/settings'
import { createMarkdownRenderer } from './lib/markdown'
import { loadAllFonts, registerFontFace, saveFont } from './lib/fontDb'

const settings = useSettingsStore()
const inputText = ref('')
const displayedText = ref('')
const renderedHtml = ref('')
const isRunning = ref(false)
const isCompleted = ref(false)
const readerRef = ref(null)
const customFonts = ref([])
const md = createMarkdownRenderer()

const systemFont = {
  key: 'system',
  label: '系统默认',
  family: '"LXGW WenKai", "STSong", "SimSun", "Microsoft YaHei", "Noto Serif SC", serif',
}

const normalizeInput = (text) => text.replace(/\r\n/g, '\n')

let tokens = []
let cursorIndex = 0
let timer = null
let renderRaf = null

const speedToInterval = (speed) => Math.max(20, Math.round(320 - speed * 3))
const chunkSizeForSpeed = (speed) => {
  if (speed >= 85) return 5
  if (speed >= 65) return 3
  if (speed >= 45) return 2
  return 1
}

const scheduleRender = () => {
  if (renderRaf) return
  renderRaf = requestAnimationFrame(() => {
    renderedHtml.value = md.render(displayedText.value)
    renderRaf = null
    nextTick(scrollToBottom)
  })
}

const scrollToBottom = () => {
  if (!readerRef.value) return
  const offset = 170
  readerRef.value.scrollTop =
    readerRef.value.scrollHeight - readerRef.value.clientHeight + offset
}

const stopTimer = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

const jitterInterval = (base) => {
  const factor = 1 + (Math.random() * 0.2 - 0.1)
  return Math.max(20, Math.round(base * factor))
}

const runTick = () => {
  if (!isRunning.value) return
  const interval = jitterInterval(speedToInterval(settings.speed))
  let chunkSize = chunkSizeForSpeed(settings.speed)
  if (tokens.length > 20000 && settings.speed >= 50) {
    chunkSize = Math.max(chunkSize, 6)
  }
  const nextIndex = Math.min(cursorIndex + chunkSize, tokens.length)
  displayedText.value += tokens.slice(cursorIndex, nextIndex).join('')
  cursorIndex = nextIndex
  if (cursorIndex >= tokens.length) {
    isRunning.value = false
    isCompleted.value = true
    return
  }
  timer = window.setTimeout(runTick, interval)
}

const start = () => {
  if (!inputText.value.trim()) return
  stopTimer()
  displayedText.value = ''
  renderedHtml.value = ''
  tokens = Array.from(normalizeInput(inputText.value))
  cursorIndex = 0
  isCompleted.value = false
  isRunning.value = true
  runTick()
}

const handleInputKeydown = (event) => {
  if (event.key !== 'Enter') return
  if (event.shiftKey) return
  event.preventDefault()
  start()
}

const refreshFonts = async () => {
  const fonts = await loadAllFonts()
  customFonts.value = fonts
}

const handleFontUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const saved = await saveFont(file)
  await registerFontFace(saved)
  await refreshFonts()
  settings.fontKey = String(saved.id)
  event.target.value = ''
}

const fontOptions = computed(() => [
  systemFont,
  ...customFonts.value.map((font) => ({
    key: String(font.id),
    label: font.name.replace(/\.[^/.]+$/, ''),
    family: font.family,
  })),
])

const activeFontFamily = computed(() => {
  const match = fontOptions.value.find((font) => font.key === settings.fontKey)
  return match?.family || systemFont.family
})

const outputHtml = computed(
  () => `${renderedHtml.value}${isRunning.value ? '<span class="cursor">▍</span>' : ''}`
)

const statusLabel = computed(() => {
  if (isRunning.value) return '正在流式输出'
  if (isCompleted.value) return '输出完成'
  if (displayedText.value) return '已暂停'
  return '等待开始'
})

watch(displayedText, scheduleRender)
watch(
  () => settings.speed,
  () => settings.persist()
)
watch(
  () => settings.fontKey,
  () => settings.persist()
)

onMounted(async () => {
  settings.hydrate()
  await refreshFonts()
})
</script>

<template>
  <div class="app">
    <header class="top-bar">
      <div class="brand">
        <span class="brand-title">流式阅读器</span>
        <div class="brand-sub meta">
          <a
            class="brand-sub link"
            href="https://github.com/senzi/Streamly-Reader"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <span class="brand-sub text">MIT协议 · vibe coding</span>
        </div>
      </div>
      <div class="status">
        <span class="status-dot" :class="{ running: isRunning, done: isCompleted }"></span>
        <span>{{ statusLabel }}</span>
      </div>
    </header>

    <main class="reader-shell">
      <section class="reader-panel">
        <div class="reader" ref="readerRef">
          <div v-if="!displayedText" class="empty">
            <p>在下方输入文本，回车开始流式输出。</p>
            <p>支持标题、列表、代码块以及行内/块级公式。</p>
            <p>Shift + 回车可以换行。</p>
          </div>
          <div
            v-else
            class="reader-content"
            :style="{ fontFamily: activeFontFamily }"
            v-html="outputHtml"
          ></div>
        </div>
      </section>
    </main>

    <footer class="input-bar">
      <div class="controls">
        <div class="control">
          <label for="speed">速度</label>
          <input id="speed" type="range" min="1" max="100" v-model.number="settings.speed" />
          <span class="value">{{ settings.speed }}</span>
        </div>
        <div class="control">
          <label for="font">字体</label>
          <select id="font" v-model="settings.fontKey">
            <option v-for="option in fontOptions" :key="option.key" :value="option.key">
              {{ option.label }}
            </option>
          </select>
        </div>
        <label class="upload">
          上传字体
          <input type="file" accept=".ttf,.otf,.woff" @change="handleFontUpload" />
        </label>
      </div>
      <textarea
        v-model="inputText"
        placeholder="粘贴或输入要阅读的文本，支持 Markdown 与 LaTeX…"
        rows="5"
        @keydown="handleInputKeydown"
      ></textarea>
    </footer>
  </div>
</template>
