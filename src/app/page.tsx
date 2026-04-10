'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [tone, setTone] = useState(50);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getToneLabel = (value: number) => {
    if (value <= 10) return 'Lv.1 超平和・癒やし';
    if (value <= 20) return 'Lv.2 優しさ満点';
    if (value <= 30) return 'Lv.3 ほのぼの日常';
    if (value <= 40) return 'Lv.4 軽めのユーモア';
    if (value <= 50) return 'Lv.5 王道ネタツイ';
    if (value <= 60) return 'Lv.6 シュール・個性的';
    if (value <= 70) return 'Lv.7 勢い・ハイテンション';
    if (value <= 80) return 'Lv.8 毒舌・皮肉';
    if (value <= 90) return 'Lv.9 ブラック・過激';
    return 'Lv.10 混沌・狂気';
  };

  const handleSubmit = async () => {
    if (!image) return;

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, context, tone }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert('エラー: ' + (data.error || response.statusText));
        return;
      }

      // SSEストリーミング読み取り
      const reader = response.body!.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const chunk = JSON.parse(line.slice(6));
            if (chunk.error) { alert('エラー: ' + chunk.error); return; }
            if (chunk.text) { accumulated += chunk.text; setResult(accumulated); }
          } catch { /* skip */ }
        }
      }
    } catch (error) {
      console.error(error);
      alert('予期せぬエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (image) {
      const link = document.createElement('a');
      link.href = image;
      link.download = 'hikafuwa_image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <main className="container">
      <h1>HIKAFUWA BOX</h1>
      <p className="subtitle">だれでもネタツイクリエイター！</p>

      <section className="glass-card" aria-label="ネタツイ作成フォーム">
        <h2 className="hidden">作成フォーム</h2>
        <div className="input-group">
          <label htmlFor="image-upload">1. 画像をアップロード</label>
          <div
            className={`file-upload relative ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              aria-label="画像アップロード"
            />
            {image ? (
              <div className="relative">
                <img src={image} alt="アップロードされた画像のプレビュー" className="preview-image" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadImage();
                  }}
                  className="download-btn"
                  aria-label="画像をダウンロード"
                >
                  ⬇ 画像を保存
                </button>
              </div>
            ) : (
              <div className="text-muted">
                <p>クリックまたはドラッグ＆ドロップで画像をアップロード</p>
                <p className="text-sm mt-10">JPG, PNG, WEBP</p>
              </div>
            )}
          </div>
        </div>

        <div className="input-group">
          <div className="flex-between mb-8">
            <label htmlFor="context-input" className="mb-0">2. 補足情報（オプション）</label>
            <button
              onClick={() => setContext(prev => prev + (prev ? '\n\n' : '') + "【人物名】\n\n【状況】\n\n【言わせたいセリフ・雰囲気】\n")}
              className="template-btn"
              aria-label="テンプレートを挿入"
            >
              テンプレートを挿入
            </button>
          </div>
          <textarea
            id="context-input"
            rows={6}
            placeholder="例：ヒカキン、変顔、ラーメン屋にて"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="textarea-resize"
            aria-label="補足情報入力欄"
          />
          <p className="text-sm text-muted mt-5">
            人物の名前や状況を書くと、より精度の高いネタツイが作れます。
          </p>
        </div>



        <div className="input-group">
          <label htmlFor="tone-slider">3. 雰囲気（トーン）調整</label>
          <div className="tone-container">
            <input
              id="tone-slider"
              type="range"
              min="0"
              max="100"
              value={tone}
              onChange={(e) => setTone(Number(e.target.value))}
              className="tone-slider"
              aria-label="雰囲気調整スライダー"
            />
            <div className="tone-labels">
              <span>優しめ</span>
              <span className="tone-label-active">{getToneLabel(tone)}</span>
              <span>過激め</span>
            </div>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!image || loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              AIがネタツイを作成中...
            </>
          ) : (
            'ネタツイートを作成！'
          )}
        </button>
      </section>

      {result && (
        <div className="glass-card fade-in">
          <label>生成されたネタツイート</label>
          <div className="result-box">
            {result}
          </div>

          <button
            className="btn-secondary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner loading-spinner-sm"></span>
                再生成中...
              </>
            ) : (
              <>
                🔄 同じ画像で再生成する
              </>
            )}
          </button>

          <div className="mt-20">
            <p className="warning-text">
              ⚠ シェアする際は、画像を保存して手動で添付してください！
            </p>

            <div className="share-btn-group">
              <button
                className="share-btn btn-copy"
                onClick={() => {
                  const shareText = `${result}\n\n${window.location.href}`;
                  navigator.clipboard.writeText(shareText);
                  alert('コピーしました！');
                }}
              >
                コピー
              </button>
              <button
                className="share-btn btn-x"
                onClick={() => {
                  const shareText = `${result}\n\n${window.location.href}`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
                }}
              >
                Xでシェア
              </button>
              <button
                className="share-btn btn-bluesky"
                onClick={() => {
                  const shareText = `${result}\n\n${window.location.href}`;
                  window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`, '_blank');
                }}
              >
                Bluesky
              </button>
              <button
                className="share-btn btn-line"
                onClick={() => {
                  const shareText = `${result}\n\n${window.location.href}`;
                  window.open(`https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`, '_blank');
                }}
              >
                LINE
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
