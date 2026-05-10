import { useState, useRef, useEffect } from "react";

// const API = "https://rag-chatbot-1-t0bt.onrender.com";
const API = import.meta.env.VITE_API_URL ;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileRef = useRef();
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadSuccess(false);
    setFileName(file.name);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API}/upload`, { method: "POST", body: form });
      if (res.ok) {
        setUploadSuccess(true);
        setMessages([{
          role: "assistant",
          text: `📄 "${file.name}" uploaded and indexed. Ask me anything about it!`
        }]);
      } else {
        setMessages([{ role: "assistant", text: "Upload failed. Please try again." }]);
      }
    } catch {
      setMessages([{ role: "assistant", text: "Could not connect to backend." }]);
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk() {
    if (!question.trim() || asking) return;
    const q = question.trim();
    setQuestion("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setAsking(true);

    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      console.log("FULL RESPONSE:", data);        // ADD THIS
      console.log("RESULT FIELD:", data.result);  // 
        setMessages(prev => [...prev, { role: "assistant", text: data.answer?.result || data.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Error getting response." }]);
    } finally {
      setAsking(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logo}>⬡</div>
            <div>
              <div style={styles.title}>DocMind</div>
              <div style={styles.subtitle}>RAG-powered document intelligence</div>
            </div>
          </div>
          <button style={styles.uploadBtn} onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? (
              <span style={styles.spinner} />
            ) : (
              <>
                <span style={styles.uploadIcon}>↑</span>
                {fileName ? "Re-upload" : "Upload PDF"}
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleUpload} />
        </div>

        {/* Status bar */}
        {fileName && (
          <div style={{ ...styles.statusBar, background: uploadSuccess ? "#0f2a1a" : "#1a1a0f" }}>
            <span style={{ color: uploadSuccess ? "#4ade80" : "#facc15" }}>
              {uploadSuccess ? "●" : "○"}
            </span>
            <span style={styles.statusText}>
              {uploadSuccess ? `Indexed: ${fileName}` : `Processing: ${fileName}`}
            </span>
          </div>
        )}

        {/* Messages */}
        <div style={styles.messages}>
          {messages.length === 0 && (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>⬡</div>
              <div style={styles.emptyTitle}>Upload a PDF to begin</div>
              <div style={styles.emptyHint}>Ask questions, extract insights, summarize content</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ ...styles.messageRow, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "assistant" && <div style={styles.avatar}>⬡</div>}
              <div style={m.role === "user" ? styles.userBubble : styles.aiBubble}>
                {m.text}
              </div>
            </div>
          ))}
          {asking && (
            <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
              <div style={styles.avatar}>⬡</div>
              <div style={styles.aiBubble}>
                <span style={styles.thinking}>Thinking</span>
                <span style={styles.dots}>...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={styles.inputRow}>
          <textarea
            style={styles.input}
            placeholder={uploadSuccess ? "Ask a question about your document..." : "Upload a PDF first..."}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKey}
            disabled={!uploadSuccess || asking}
            rows={1}
          />
          <button
            style={{ ...styles.sendBtn, opacity: (!uploadSuccess || asking || !question.trim()) ? 0.4 : 1 }}
            onClick={handleAsk}
            disabled={!uploadSuccess || asking || !question.trim()}
          >
            ↑
          </button>
        </div>
        <div style={styles.footer}>Press Enter to send · Built with LangChain + ChromaDB + Gemini</div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080c0f; }
        textarea { resize: none; font-family: 'DM Mono', monospace; }
        textarea:focus { outline: none; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#080c0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'DM Mono', monospace",
  },
  container: {
    width: "100%",
    maxWidth: "760px",
    height: "90vh",
    background: "#0d1117",
    border: "1px solid #1e2d3d",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid #1e2d3d",
    background: "#0d1117",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logo: {
    fontSize: "28px",
    color: "#38bdf8",
    lineHeight: 1,
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "20px",
    fontWeight: 800,
    color: "#e2e8f0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "11px",
    color: "#4a6fa5",
    letterSpacing: "0.5px",
    marginTop: "2px",
  },
  uploadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 18px",
    background: "transparent",
    border: "1px solid #38bdf8",
    color: "#38bdf8",
    borderRadius: "8px",
    fontSize: "12px",
    fontFamily: "'DM Mono', monospace",
    fontWeight: 500,
    cursor: "pointer",
    letterSpacing: "0.3px",
    transition: "all 0.2s",
  },
  uploadIcon: {
    fontSize: "14px",
    fontWeight: 700,
  },
  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid #38bdf8",
    borderTopColor: "transparent",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },
  statusBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 24px",
    borderBottom: "1px solid #1e2d3d",
  },
  statusText: {
    fontSize: "11px",
    color: "#94a3b8",
    letterSpacing: "0.3px",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    scrollbarWidth: "thin",
    scrollbarColor: "#1e2d3d transparent",
  },
  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "60px 0",
  },
  emptyIcon: {
    fontSize: "48px",
    color: "#1e2d3d",
  },
  emptyTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "18px",
    fontWeight: 700,
    color: "#2d3f55",
  },
  emptyHint: {
    fontSize: "12px",
    color: "#1e2d3d",
    letterSpacing: "0.3px",
  },
  messageRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    animation: "fadeUp 0.3s ease",
  },
  avatar: {
    fontSize: "18px",
    color: "#38bdf8",
    marginTop: "2px",
    flexShrink: 0,
  },
  userBubble: {
    maxWidth: "70%",
    padding: "10px 16px",
    background: "#1a3a5c",
    border: "1px solid #1e4a7a",
    borderRadius: "12px 2px 12px 12px",
    color: "#e2e8f0",
    fontSize: "13px",
    lineHeight: "1.6",
    letterSpacing: "0.2px",
  },
  aiBubble: {
    maxWidth: "80%",
    padding: "10px 16px",
    background: "#111827",
    border: "1px solid #1e2d3d",
    borderRadius: "2px 12px 12px 12px",
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: "1.7",
    letterSpacing: "0.2px",
    whiteSpace: "pre-wrap",
  },
  thinking: {
    color: "#38bdf8",
  },
  dots: {
    animation: "blink 1.2s step-start infinite",
    color: "#38bdf8",
  },
  inputRow: {
    display: "flex",
    gap: "10px",
    padding: "16px 24px",
    borderTop: "1px solid #1e2d3d",
    background: "#0d1117",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    background: "#111827",
    border: "1px solid #1e2d3d",
    borderRadius: "10px",
    color: "#e2e8f0",
    fontSize: "13px",
    lineHeight: "1.5",
    letterSpacing: "0.2px",
    maxHeight: "120px",
    overflowY: "auto",
  },
  sendBtn: {
    width: "42px",
    height: "42px",
    background: "#38bdf8",
    border: "none",
    borderRadius: "10px",
    color: "#080c0f",
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.2s",
  },
  footer: {
    textAlign: "center",
    padding: "8px",
    fontSize: "10px",
    color: "#1e2d3d",
    letterSpacing: "0.3px",
  },
};
