const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'http://localhost:2048/v1'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

// モデルを順番に試す（新しいフォルダーと同じ方式）
export const OPENAI_MODELS = [
  'gemini-3-flash-preview',
  'gemini-flash-latest',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
]

export async function callOpenAIStream(
  prompt: string,
  imageBase64?: string,
): Promise<ReadableStream | { error: string }> {
  for (const model of OPENAI_MODELS) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000)
    try {
      const content: unknown[] = [{ type: 'text', text: prompt }]
      if (imageBase64) {
        content.push({ type: 'image_url', image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } })
      }
      const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content }], stream: true }),
        signal: controller.signal,
      })
      if (res.ok && res.body) return transformStream(res.body)
      if ([429, 503, 500, 404].includes(res.status)) continue
    } catch {
      /* try next model */
    } finally {
      clearTimeout(timeout)
    }
  }
  return { error: 'AI応答に失敗しました。しばらく待ってから再試行してください。' }
}

export function transformStream(input: ReadableStream): ReadableStream {
  const enc = new TextEncoder()
  const dec = new TextDecoder()
  let buf = ''
  let hasContent = false
  return new ReadableStream({
    async start(ctrl) {
      const reader = input.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() || ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const json = line.slice(6).trim()
            if (!json || json === '[DONE]') continue
            try {
              const data = JSON.parse(json)
              const delta = data.choices?.[0]?.delta || {}
              if (delta.content) {
                hasContent = true
                ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ text: delta.content })}\n\n`))
              }
            } catch { /* skip bad chunk */ }
          }
        }
        if (!hasContent) ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ text: '(応答を生成できませんでした)' })}\n\n`))
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        ctrl.close()
      } catch {
        try {
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ error: 'ストリームエラー' })}\n\n`))
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          ctrl.close()
        } catch { ctrl.error(new Error('stream error')) }
      }
    },
  })
}
