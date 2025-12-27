import Dexie from 'dexie'

export const db = new Dexie('streamly-fonts')

db.version(1).stores({
  fonts: '++id, name, family, createdAt',
})

const loadedFamilies = new Set()

export const registerFontFace = async (font) => {
  if (!font?.family || !font?.data) return
  if (loadedFamilies.has(font.family)) return
  try {
    const buffer = await font.data.arrayBuffer()
    const face = new FontFace(font.family, buffer)
    await face.load()
    document.fonts.add(face)
    loadedFamilies.add(font.family)
  } catch {
    // Ignore invalid font files.
  }
}

export const loadAllFonts = async () => {
  const fonts = await db.fonts.toArray()
  for (const font of fonts) {
    await registerFontFace(font)
  }
  return fonts
}

export const saveFont = async (file) => {
  const family = `用户字体-${Date.now()}`
  const id = await db.fonts.add({
    name: file.name,
    type: file.type,
    data: file,
    family,
    createdAt: Date.now(),
  })
  return { id, name: file.name, type: file.type, data: file, family }
}
