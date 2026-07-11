import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/layout/Layout'
import { aiAPI } from '../services/api'
import toast from 'react-hot-toast'

type ChatTurn = {
  id: string
  question: string
  answer: string
  traceId: number
  groundedness: string
  retrievalQuality: string
  hallucinationRisk: boolean
  answerRelevance: string
  feedback: 'thumbs_up' | 'thumbs_down' | null
}

type TraceRow = {
  TraceID: number
  Question: string
  Model: string
  TotalMs: number
  RetrievalMs: number
  LlmMs: number
  CostUsd: number
  Groundedness: string
  RetrievalQuality: string
  HallucinationRisk: boolean
  AnswerRelevance: string
  UserFeedback: string | null
  CreatedAt: string
}

const LEVEL_COLOR: Record<string, string> = {
  high: '#10b981',
  ok: '#f59e0b',
  low: '#ef4444',
}

function LevelPill({ level }: { level: string }) {
  const color = LEVEL_COLOR[level] || '#6b7280'
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, padding: '2px 8px',
      borderRadius: '10px', background: `${color}1c`, color,
      border: `1px solid ${color}40`, textTransform: 'uppercase',
      letterSpacing: '0.4px',
    }}>{level}</span>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: '#0d1526', border: '1px solid #1e2d45',
      borderRadius: '12px', padding: '18px',
    }}>
      <div style={{
        fontSize: '11px', color: '#6b7280', textTransform: 'uppercase',
        letterSpacing: '1px', marginBottom: '8px', fontWeight: 600,
      }}>{label}</div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 800, color }}>
        {value}
      </div>
    </div>
  )
}

function likelyCause(t: {
  groundedness: string
  retrievalQuality: string
  hallucinationRisk: boolean
  answerRelevance: string
}): string {
  if (t.hallucinationRisk) {
    return 'hallucination_risk: flagged — retrieval_quality and groundedness are both low, so this answer is likely fabricated rather than genuinely unsupported by the data.'
  }
  if (t.groundedness === 'low') {
    return 'groundedness: low — the answer is not well supported by the retrieved chunks, even though relevant context may have been found.'
  }
  if (t.retrievalQuality === 'low') {
    return 'retrieval_quality: low — nothing highly relevant was found for this question (low top-1 similarity).'
  }
  if (t.answerRelevance === 'low') {
    return 'answer_relevance: low — the answer does not closely address the question asked.'
  }
  return 'No quality issues detected — retrieval, groundedness, and relevance all look healthy.'
}

function TraceDetailModal({ traceId, onClose }: { traceId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-trace', traceId],
    queryFn: () => aiAPI.getTraceDetail(traceId).then((r) => r.data),
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#111827', border: '1px solid #1e2d45',
        borderRadius: '16px', padding: '28px',
        width: '100%', maxWidth: '720px', maxHeight: '88vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: '#f0f4ff' }}>
            Trace #{traceId}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#b8c2d6', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>

        {isLoading || !data ? (
          <div style={{ color: '#b8c2d6', fontSize: '13px' }}>Loading…</div>
        ) : (
          <>
            <div style={{
              padding: '12px 14px', borderRadius: '10px', marginBottom: '18px',
              background: data.HallucinationRisk ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.08)',
              border: `1px solid ${data.HallucinationRisk ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.25)'}`,
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f0f4ff', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Likely cause
              </div>
              <div style={{ fontSize: '13px', color: '#c8d8f0', lineHeight: 1.5 }}>
                {likelyCause({
                  groundedness: data.Groundedness,
                  retrievalQuality: data.RetrievalQuality,
                  hallucinationRisk: data.HallucinationRisk,
                  answerRelevance: data.AnswerRelevance,
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '18px' }}>
              {[
                { label: 'Groundedness', value: data.Groundedness },
                { label: 'Retrieval Quality', value: data.RetrievalQuality },
                { label: 'Answer Relevance', value: data.AnswerRelevance },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#0d1526', border: '1px solid #1e2d45', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
                  <LevelPill level={value} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#b8c2d6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Pipeline timeline
              </div>
              <div style={{ display: 'flex', height: '28px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e2d45' }}>
                <div style={{
                  width: `${Math.max(5, (data.RetrievalMs / Math.max(data.TotalMs, 1)) * 100)}%`,
                  background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', color: '#fff', fontWeight: 700,
                }}>{data.RetrievalMs}ms</div>
                <div style={{
                  flex: 1, background: '#00a8d4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', color: '#0a0f1e', fontWeight: 700,
                }}>{data.LlmMs}ms</div>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '11px', color: '#b8c2d6' }}>
                <span>▮ Retrieval</span>
                <span>▮ LLM generation</span>
                <span style={{ marginLeft: 'auto', color: '#6b7280' }}>Total: {data.TotalMs}ms · {data.TokensIn}+{data.TokensOut} tok · ${data.CostUsd.toFixed(6)}</span>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#b8c2d6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Retrieved chunks
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.RetrievedChunks.map((c, i) => (
                  <div key={i} style={{ background: '#0d1526', border: '1px solid #1e2d45', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#f0f4ff' }}>[{i + 1}] {c.kind} — {c.title}</span>
                      <span style={{ fontSize: '11px', color: '#00d4ff' }}>{c.score.toFixed(3)}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#b8c2d6', lineHeight: 1.4 }}>{c.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#b8c2d6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Question &amp; answer
              </div>
              <div style={{ fontSize: '13px', color: '#f0f4ff', marginBottom: '8px' }}><strong>Q:</strong> {data.Question}</div>
              <div style={{ fontSize: '13px', color: '#c8d8f0', lineHeight: 1.5 }}><strong>A:</strong> {data.Answer}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AiObservability() {
  const queryClient = useQueryClient()
  const [question, setQuestion] = useState('')
  const [chat, setChat] = useState<ChatTurn[]>([])
  const [badOnly, setBadOnly] = useState(false)
  const [selectedTraceId, setSelectedTraceId] = useState<number | null>(null)

  const { data: traces = [], isLoading: tracesLoading } = useQuery({
    queryKey: ['ai-traces', badOnly],
    queryFn: () => aiAPI.getTraces(badOnly ? { badOnly: true } : undefined).then((r) => r.data as TraceRow[]),
  })

  const chatMutation = useMutation({
    mutationFn: (q: string) => aiAPI.chat(q).then((r) => r.data),
    onSuccess: (data, q) => {
      setChat((prev) => [
        ...prev,
        {
          id: `${data.traceId}-${Date.now()}`,
          question: q,
          answer: data.answer,
          traceId: data.traceId,
          groundedness: data.groundedness,
          retrievalQuality: data.retrievalQuality,
          hallucinationRisk: data.hallucinationRisk,
          answerRelevance: data.answerRelevance,
          feedback: null,
        },
      ])
      queryClient.invalidateQueries({ queryKey: ['ai-traces'] })
    },
    onError: () => toast.error('Chat failed — is the AI service configured with an API key?'),
  })

  const feedbackMutation = useMutation({
    mutationFn: ({ traceId, feedback }: { traceId: number; feedback: 'thumbs_up' | 'thumbs_down' }) =>
      aiAPI.chatFeedback(traceId, feedback),
    onSuccess: (_data, vars) => {
      setChat((prev) => prev.map((t) => (t.traceId === vars.traceId ? { ...t, feedback: vars.feedback } : t)))
      queryClient.invalidateQueries({ queryKey: ['ai-traces'] })
      toast.success('Feedback recorded')
    },
    onError: () => toast.error('Failed to record feedback'),
  })

  const infra = useMemo(() => {
    if (traces.length === 0) return { count: 0, avgLatency: 0, p95Latency: 0, avgCost: 0 }
    const latencies = traces.map((t) => t.TotalMs).sort((a, b) => a - b)
    const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    const p95Latency = latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))]
    const avgCost = traces.reduce((a, t) => a + t.CostUsd, 0) / traces.length
    return { count: traces.length, avgLatency, p95Latency, avgCost }
  }, [traces])

  const submitQuestion = () => {
    const q = question.trim()
    if (!q) return
    chatMutation.mutate(q)
    setQuestion('')
  }

  return (
    <Layout title="AI Observability" subtitle="Retrieval quality, groundedness, cost, and latency for the RAG chatbot">
      <div style={{ maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Infrastructure health — deliberately separate from answer quality below */}
        <section>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            Infrastructure health <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— is the service up (computed from recent chat requests)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
            <Stat label="Requests" value={String(infra.count)} color="#00d4ff" />
            <Stat label="Avg Latency" value={`${infra.avgLatency}ms`} color="#00d4ff" />
            <Stat label="P95 Latency" value={`${infra.p95Latency}ms`} color="#f59e0b" />
            <Stat label="Avg Cost / Req" value={`$${infra.avgCost.toFixed(5)}`} color="#7c3aed" />
          </div>
        </section>

        {/* Chat widget */}
        <section>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            Ask a question <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— answered from your projects, tasks, and documents</span>
          </div>
          <div style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '360px', overflowY: 'auto', marginBottom: chat.length ? '14px' : 0 }}>
              {chat.map((t) => (
                <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', color: '#f0f4ff' }}>
                    {t.question}
                  </div>
                  <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: '#0d1526', border: '1px solid #1e2d45', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '13px', color: '#c8d8f0', lineHeight: 1.5, marginBottom: '8px' }}>{t.answer}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <LevelPill level={t.groundedness} />
                      <LevelPill level={t.retrievalQuality} />
                      {t.hallucinationRisk && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', padding: '2px 8px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}>
                          ⚠ hallucination risk
                        </span>
                      )}
                      <button
                        onClick={() => setSelectedTraceId(t.traceId)}
                        style={{ marginLeft: 'auto', fontSize: '11px', color: '#00d4ff', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      >View trace</button>
                      <button
                        onClick={() => feedbackMutation.mutate({ traceId: t.traceId, feedback: 'thumbs_up' })}
                        style={{
                          fontSize: '14px', background: 'none', cursor: 'pointer',
                          border: '1px solid #1e2d45', borderRadius: '6px', padding: '2px 8px',
                          color: t.feedback === 'thumbs_up' ? '#10b981' : '#6b7280',
                        }}
                      >👍</button>
                      <button
                        onClick={() => feedbackMutation.mutate({ traceId: t.traceId, feedback: 'thumbs_down' })}
                        style={{
                          fontSize: '14px', background: 'none', cursor: 'pointer',
                          border: '1px solid #1e2d45', borderRadius: '6px', padding: '2px 8px',
                          color: t.feedback === 'thumbs_down' ? '#ef4444' : '#6b7280',
                        }}
                      >👎</button>
                    </div>
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#b8c2d6' }}>Thinking…</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitQuestion()}
                placeholder="e.g. What payment gateway is the e-commerce project using?"
                style={{
                  flex: 1, padding: '10px 12px', background: '#0d1526', border: '1px solid #1e2d45',
                  borderRadius: '8px', outline: 'none', fontSize: '13px', color: '#f0f4ff',
                }}
              />
              <button
                onClick={submitQuestion}
                disabled={chatMutation.isPending || !question.trim()}
                style={{
                  padding: '10px 20px', background: question.trim() ? '#00d4ff' : '#1e2d45',
                  border: 'none', borderRadius: '8px', color: question.trim() ? '#0a0f1e' : '#6b7280',
                  fontSize: '13px', fontWeight: 700, cursor: question.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'Syne, sans-serif',
                }}
              >Ask</button>
            </div>
          </div>
        </section>

        {/* Trace table */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Answer quality <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— was the answer actually good</span>
            </div>
            <button
              onClick={() => setBadOnly((v) => !v)}
              style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                border: badOnly ? 'none' : '1px solid #1e2d45',
                background: badOnly ? '#ef4444' : 'transparent',
                color: badOnly ? '#fff' : '#b8c2d6',
              }}
            >{badOnly ? '✓ Bad answers only' : 'Bad answers only'}</button>
          </div>

          <div style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e2d45' }}>
                    {['Question', 'Latency', 'Cost', 'Groundedness', 'Retrieval', 'Feedback', 'Time'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tracesLoading ? (
                    <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#b8c2d6', fontSize: '13px' }}>Loading…</td></tr>
                  ) : traces.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#b8c2d6', fontSize: '13px' }}>No chat requests yet — ask a question above.</td></tr>
                  ) : (
                    traces.map((t) => (
                      <tr
                        key={t.TraceID}
                        onClick={() => setSelectedTraceId(t.TraceID)}
                        style={{ borderBottom: '1px solid #1a2438', cursor: 'pointer' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#0d1526' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                      >
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: '#f0f4ff', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.Question}</td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: '#b8c2d6' }}>{t.TotalMs}ms</td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: '#b8c2d6' }}>${t.CostUsd.toFixed(5)}</td>
                        <td style={{ padding: '10px 14px' }}><LevelPill level={t.Groundedness} /></td>
                        <td style={{ padding: '10px 14px' }}><LevelPill level={t.RetrievalQuality} /></td>
                        <td style={{ padding: '10px 14px', fontSize: '14px' }}>
                          {t.UserFeedback === 'thumbs_up' ? '👍' : t.UserFeedback === 'thumbs_down' ? '👎' : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: '#6b7280' }}>
                          {new Date(t.CreatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {selectedTraceId != null && (
        <TraceDetailModal traceId={selectedTraceId} onClose={() => setSelectedTraceId(null)} />
      )}
    </Layout>
  )
}
