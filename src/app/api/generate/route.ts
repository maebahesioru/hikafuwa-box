import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'
import { callOpenAIStream } from '@/lib/openaiStream'
import fs from 'fs'
import path from 'path'

function buildPrompt(image: string, context: string, tone: number): string {
  const toneValue = Number(tone) || 50
  let toneInstruction = ''
  if (toneValue <= 10) toneInstruction = '【レベル1: 超平和・癒やし】\n見る人全員が幸せになるような、圧倒的な癒やしと平和を提供してください。争いも毒も一切ない、浄化されるようなツイートにしてください。'
  else if (toneValue <= 20) toneInstruction = '【レベル2: 優しさ満点】\nとても優しく、温かい気持ちになれる内容にしてください。肯定的な言葉を選び、読み手を励ますような雰囲気を大切にしてください。'
  else if (toneValue <= 30) toneInstruction = '【レベル3: ほのぼの日常】\n日常の些細な幸せや、あるあるネタを、ほのぼのとしたトーンで描いてください。リラックスして読める内容にしてください。'
  else if (toneValue <= 40) toneInstruction = '【レベル4: 軽めのユーモア】\nクスッと笑える程度の、軽快なユーモアを交えてください。誰にでも伝わる、爽やかな面白さを目指してください。'
  else if (toneValue <= 50) toneInstruction = '【レベル5: 王道ネタツイ】\n多くの人が共感し、笑える、王道のネタツイートにしてください。ボケとツッコミのバランスが取れた、バズりやすい内容にしてください。'
  else if (toneValue <= 60) toneInstruction = '【レベル6: シュール・個性的】\n少し視点をずらした、シュールで個性的なボケを入れてください。「なんでそうなった？」と思わせるような、独特な世界観を展開してください。'
  else if (toneValue <= 70) toneInstruction = '【レベル7: 勢い重視・ハイテンション】\n細かいことは気にせず、勢いとノリで押し切るようなツイートにしてください。テンション高く、読み手を圧倒するようなパワーワードを使ってください。'
  else if (toneValue <= 80) toneInstruction = '【レベル8: 毒舌・皮肉】\n世の中の矛盾や、画像のツッコミどころを、鋭く指摘してください。少しピリッとするような、毒舌や皮肉を効かせてください。'
  else if (toneValue <= 90) toneInstruction = '【レベル9: ブラックジョーク・過激】\nギリギリを攻めるような、ブラックジョークや過激な表現を交えてください。常識にとらわれない、尖った笑いを提供してください。'
  else toneInstruction = '【レベル10: 混沌・狂気】\n意味不明だがなぜか面白い、狂気を感じるような内容にしてください。論理を飛躍させ、予測不可能な展開で読み手を混乱と爆笑の渦に巻き込んでください。'

  const promptData = fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'hikafuwa.txt'), 'utf-8')
  return `${promptData}

## ユーザーからの補足情報:
${context || '特になし'}

## ツイートの雰囲気（トーン）指定:
${toneInstruction}

## 重要なお知らせ:
1. 「ユーザーからの補足情報」に人物名が記載されている場合は、その名前を使用してください。
2. 画像内の人物が「ヒカキン」「セイキン」「デカキン」「マスオ」などの有名人に見える場合は、その名前を積極的に使用してください。

## 指示:
- 上記のマニュアルに従って、画像の内容をよく観察し、面白くてバズりそうなツイート文面を作成してください。
- ハッシュタグは不要です。
- 出力はツイートの本文のみにしてください。余計な説明は不要です。
- 出力は必ず全角140文字（半角280文字）以内に収めてください。`
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (!rateLimit(ip, 20, 60_000)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const { image, context, tone } = body

    if (!image) return NextResponse.json({ error: '画像が必要です' }, { status: 400 })

    const prompt = buildPrompt(image, context || '', tone ?? 50)
    const stream = await callOpenAIStream(prompt, image)
    if ('error' in stream) return NextResponse.json({ error: stream.error }, { status: 503 })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
  } catch (e: unknown) {
    console.error('[Generate POST]', e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
