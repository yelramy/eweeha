'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  SparklesIcon,
  ArrowRightIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import PhoneInput from '@/components/PhoneInput'
import QuoteCard from '@/components/booking/QuoteCard'
import QuoteActions from '@/components/booking/QuoteActions'
import { useConfig } from '@/hooks/useConfig'
import { events } from '@/lib/posthog'
import toast from 'react-hot-toast'
import type { QuoteResponse } from '@/app/api/ai/booking/interpret/route'

type State = 'chat' | 'freetext' | 'loading' | 'quote'

interface ChatMessage {
  role: 'bot' | 'user'
  text: string
}

const CHAT_QUESTIONS = [
  {
    id: 'passengers',
    botMessage: 'When is the wedding? (date, or roughly)',
    placeholder: 'e.g. Saturday July 18, or next summer',
  },
  {
    id: 'dates',
    botMessage: 'Where is the ceremony, and where is the venue?',
    placeholder: 'e.g. ceremony in Mar Mikhael, venue in Broummana',
  },
  {
    id: 'plan',
    botMessage: 'What do you need on wheels?\n• Bridal car only\n• Bridal car + family convoy cars\n• Classic or convertible for photos\n• Guest shuttle vans',
    placeholder: 'e.g. bridal car + 3 family cars + shuttle for 60 guests',
  },
  {
    id: 'location',
    botMessage: 'Where does the day start? (bride\'s prep location)',
    placeholder: 'e.g. family home in Achrafieh, hotel in Jounieh',
  },
  {
    id: 'preference',
    botMessage: 'Any car preference? Classic, convertible, luxury sedan, SUV — or no preference?',
    placeholder: 'e.g. white convertible, or recommend something',
  },
  {
    id: 'extras',
    botMessage: 'Anything else we should know? (flower decoration, zaffe timing, photographer plan — or just say "no")',
    placeholder: 'e.g. fresh flowers to match bouquet, zaffe at 3pm',
  },
]

const EXAMPLE_PROMPTS = [
  { label: 'Bridal car + convoy', text: 'Wedding on Saturday June 20: bridal car from Achrafieh, ceremony in Mar Mikhael, venue in Broummana, plus 3 family cars.' },
  { label: 'بدي سيارة للعرس', text: 'بدي سيارة مزينة للعروس مع شوفير، الكنيسة بجونية والعشاء بفقرا، عرسنا بشهر تموز' },
  { label: 'Voitures pour notre mariage', text: 'Je cherche une voiture décorée avec chauffeur pour notre mariage le 15 août: église à Harissa, réception à Faqra, avec 2 voitures pour la famille.' },
  { label: 'Classic for the photoshoot', text: 'We want a classic convertible for our wedding photoshoot in old Byblos, around 4 hours in the afternoon, plus a bridal car for the ceremony.' },
]

interface AIBookingAssistantProps {
  className?: string
}

export default function AIBookingAssistant({ className = '' }: AIBookingAssistantProps) {
  const { appConfig } = useConfig()

  const [state, setState] = useState<State>('chat')
  const [phone, setPhone] = useState('')
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [error, setError] = useState('')

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: CHAT_QUESTIONS[0].botMessage },
  ])
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chatInput, setChatInput] = useState('')
  const [chatDone, setChatDone] = useState(false)
  const [editingMsgIndex, setEditingMsgIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  // Freetext state
  const [freeTextMessage, setFreeTextMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Quote refinement state
  const [refineInput, setRefineInput] = useState('')
  const [refining, setRefining] = useState(false)

  // Available vehicles (fetched once for the vehicle picker)
  const [availableVehicles, setAvailableVehicles] = useState<Array<{ id: string; name: string; image: string; maxPassengers?: number; maxLuggage?: number }>>([])
  const vehiclesFetched = useRef(false)

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const quoteRef = useRef<HTMLDivElement>(null)
  const whatsappNumber = appConfig?.contact?.whatsapp || '96170971841'

  // Auto-scroll chat container to bottom (without moving the page)
  useEffect(() => {
    const el = chatContainerRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [chatMessages, chatDone])

  // Auto-focus chat input after bot message
  useEffect(() => {
    if (state === 'chat' && !chatDone) {
      setTimeout(() => chatInputRef.current?.focus({ preventScroll: true }), 150)
    }
  }, [currentStep, state, chatDone])

  // Scroll to quote
  useEffect(() => {
    if (state === 'quote' && quoteRef.current) {
      quoteRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [state])

  // Fetch available vehicles for the picker (once)
  useEffect(() => {
    if (state === 'quote' && !vehiclesFetched.current) {
      vehiclesFetched.current = true
      fetch('/api/vehicles?available=true')
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setAvailableVehicles(data.data.map((v: Record<string, unknown>) => ({
              id: v.id as string,
              name: v.name as string,
              image: ((v.images as Record<string, unknown>)?.main as string) || '',
              maxPassengers: v.maxPassengers as number | undefined,
              maxLuggage: v.maxLuggage as number | undefined,
            })))
          }
        })
        .catch(() => {})
    }
  }, [state])

  // ─── Chat: submit an answer ───
  const handleChatAnswer = useCallback(() => {
    const text = chatInput.trim()
    if (!text) return

    const nextAnswers = { ...answers, [CHAT_QUESTIONS[currentStep].id]: text }
    setAnswers(nextAnswers)
    setChatInput('')

    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: 'user', text },
    ]

    const nextStep = currentStep + 1
    if (nextStep < CHAT_QUESTIONS.length) {
      newMessages.push({ role: 'bot', text: CHAT_QUESTIONS[nextStep].botMessage })
      setChatMessages(newMessages)
      setCurrentStep(nextStep)
    } else {
      newMessages.push({ role: 'bot', text: 'Great! Just need your phone number and we\'ll build your quote.' })
      setChatMessages(newMessages)
      setChatDone(true)
    }
  }, [chatInput, answers, chatMessages, currentStep])

  // ─── Chat: start editing a prior answer in-place ───
  const handleStartEdit = useCallback((msgIndex: number) => {
    const msg = chatMessages[msgIndex]
    if (msg?.role !== 'user') return
    setEditingMsgIndex(msgIndex)
    setEditValue(msg.text)
  }, [chatMessages])

  // ─── Chat: save an in-place edit ───
  const handleSaveEdit = useCallback(() => {
    if (editingMsgIndex === null) return
    const newText = editValue.trim()
    if (!newText) return

    const stepIndex = Math.floor(editingMsgIndex / 2)
    const questionId = CHAT_QUESTIONS[stepIndex]?.id
    if (!questionId) return

    setAnswers(prev => ({ ...prev, [questionId]: newText }))
    setChatMessages(prev => prev.map((msg, i) => i === editingMsgIndex ? { ...msg, text: newText } : msg))
    setEditingMsgIndex(null)
    setEditValue('')
  }, [editingMsgIndex, editValue])

  // ─── Build message string from chat answers ───
  function buildMessageFromAnswers(ans: Record<string, string>): string {
    const lines: string[] = []
    if (ans.passengers) lines.push(`Passengers: ${ans.passengers}`)
    if (ans.dates) lines.push(`Dates: ${ans.dates}`)
    if (ans.plan) lines.push(`Plan: ${ans.plan}`)
    if (ans.location) lines.push(`Starting from: ${ans.location}`)
    if (ans.preference) lines.push(`Vehicle preference: ${ans.preference}`)
    if (ans.extras) lines.push(`Extras: ${ans.extras}`)
    return lines.join('\n')
  }

  // ─── Submit to API (shared by both modes) ───
  const handleSubmit = async (messageText: string) => {
    if (!messageText.trim()) {
      toast.error('Please describe what you need')
      return
    }
    if (!phone) {
      toast.error('Please enter your phone number')
      return
    }

    setError('')
    setState('loading')

    try {
      const res = await fetch('/api/ai/booking/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText.trim() }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Something went wrong')
      }

      setQuote(data.data)
      setState('quote')
      events.bookingStarted()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to process. Please try again.'
      setError(msg)
      setState(chatDone ? 'chat' : 'freetext')
      toast.error(msg)
    }
  }

  const handleChatSubmit = () => handleSubmit(buildMessageFromAnswers(answers))

  const handleFreeTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(freeTextMessage)
  }

  const handleQuoteUpdate = async (updated: QuoteResponse) => {
    setQuote(updated)

    try {
      const res = await fetch('/api/ai/booking/interpret', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interpretation: updated.interpretation }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setQuote(data.data)
      }
    } catch {
      // Keep the client-side update even if repricing fails
    }
  }

  const handleRefineQuote = async () => {
    const text = refineInput.trim()
    if (!text || !quote) return

    setRefining(true)
    try {
      const context = `IMPORTANT: The customer already has a quote. They want to MODIFY it, not start over. Keep everything the same EXCEPT what they specifically ask to change. Do NOT add extra vehicles or days unless explicitly requested.

Current quote:
- Days: ${quote.interpretation.days.map(d => `${d.date} ${d.serviceType} (${d.label})`).join(', ')}
- Vehicle: ${quote.vehicles.map(v => `${v.name}${v.quantity > 1 ? ' x' + v.quantity : ''}`).join(', ')}
- Passengers: ${quote.interpretation.passengers || 'not specified'}
- Location: ${quote.interpretation.startingLocation || 'not specified'}

Customer's modification request: ${text}`

      const res = await fetch('/api/ai/booking/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: context }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update quote')
      }

      setQuote(data.data)
      setRefineInput('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update the quote. Try again.')
    } finally {
      setRefining(false)
    }
  }

  const handleReset = () => {
    setState('chat')
    setQuote(null)
    setError('')
    setChatMessages([{ role: 'bot', text: CHAT_QUESTIONS[0].botMessage }])
    setCurrentStep(0)
    setAnswers({})
    setChatInput('')
    setChatDone(false)
    setEditingMsgIndex(null)
    setEditValue('')
    setRefineInput('')
    setRefining(false)
    setFreeTextMessage('')
    setPhone('')
  }

  // ─── Render ───
  return (
    <div className={`${className}`}>

      {/* ═══ CHAT MODE ═══ */}
      {state === 'chat' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in-up flex flex-col" style={{ maxHeight: '70vh', minHeight: '380px' }}>
          {/* Header */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Book Your Wedding Car</h2>
            </div>
            <button
              onClick={() => setState('freetext')}
              className="text-[11px] sm:text-xs text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
            >
              <PencilSquareIcon className="w-3.5 h-3.5" />
              Type it all at once
            </button>
          </div>

          {/* Chat messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <SparklesIcon className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                  </div>
                )}
                {msg.role === 'user' && editingMsgIndex !== i && (
                  <button
                    onClick={() => handleStartEdit(i)}
                    className="p-1 mr-1.5 self-center text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 opacity-60 hover:opacity-100 transition-opacity"
                    aria-label="Edit answer"
                    title="Edit this answer"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5" />
                  </button>
                )}
                {editingMsgIndex === i ? (
                  <div className="max-w-[80%] flex gap-1.5 items-center">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit() } if (e.key === 'Escape') { setEditingMsgIndex(null) } }}
                      className="flex-1 min-w-0 px-3 py-2 text-sm border border-[#742F38] rounded-full focus:ring-2 focus:ring-[#742F38] dark:bg-gray-700 dark:text-white"
                      dir="auto"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="px-2.5 py-1.5 text-xs font-medium bg-[#742F38] text-white rounded-full hover:bg-[#5C262D] transition-colors flex-shrink-0"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMsgIndex(null)}
                      className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'bot'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-md'
                        : 'bg-[#742F38] text-white rounded-tr-md'
                    }`}
                    dir="auto"
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            ))}

            {/* Phone input (after all questions) */}
            {chatDone && (
              <div className="pt-2 space-y-3">
                <div className="max-w-[85%]">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Phone or WhatsApp *
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    placeholder="+961 XX XXX XXX"
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                <button
                  onClick={handleChatSubmit}
                  className="w-full bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium py-3 px-5 rounded-lg transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-2 text-sm tracking-wider border border-primary-700"
                >
                  <SparklesIcon className="w-4 h-4" />
                  Get My Quote
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div />
          </div>

          {/* Chat input bar (hidden after all questions answered) */}
          {!chatDone && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2.5 flex gap-2 items-center flex-shrink-0 bg-white dark:bg-gray-800">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatAnswer() } }}
                placeholder={CHAT_QUESTIONS[currentStep]?.placeholder || 'Type your answer...'}
                className="flex-1 min-w-0 px-3 py-2.5 text-base border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-[#742F38] focus:border-[#742F38] transition-all dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                dir="auto"
              />
              <button
                onClick={handleChatAnswer}
                disabled={!chatInput.trim()}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#742F38] hover:bg-[#5C262D] text-white transition-colors disabled:opacity-30 disabled:hover:bg-[#742F38] flex-shrink-0"
                aria-label="Send"
              >
                <PaperAirplaneIcon className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ FREE-TEXT MODE ═══ */}
      {state === 'freetext' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in-up">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Tell Us What You Need</h2>
            </div>
            <button
              onClick={() => setState('chat')}
              className="text-[11px] sm:text-xs text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
            >
              <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
              Guided chat
            </button>
          </div>

          <form onSubmit={handleFreeTextSubmit} className="p-4 sm:p-6 space-y-4">
            <div>
              <textarea
                ref={textareaRef}
                value={freeTextMessage}
                onChange={(e) => setFreeTextMessage(e.target.value)}
                placeholder="e.g. Wedding July 18: bridal car from Achrafieh, ceremony in Jounieh, venue in Faqra, plus 3 family cars..."
                rows={4}
                maxLength={2000}
                className="w-full px-3 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#742F38] focus:border-[#742F38] transition-all resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 leading-relaxed"
                dir="auto"
              />
              {freeTextMessage.length > 1500 && (
                <p className="text-xs text-gray-400 mt-1 text-right">{freeTextMessage.length}/2000</p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setFreeTextMessage(ex.text); textareaRef.current?.focus() }}
                  className="px-2.5 py-1 text-[11px] sm:text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-300 transition-colors border border-transparent hover:border-primary-200 dark:hover:border-primary-700"
                  dir="auto"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                Phone or WhatsApp *
              </label>
              <PhoneInput value={phone} onChange={setPhone} placeholder="+961 XX XXX XXX" required />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              className="w-full bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium py-3 px-5 rounded-lg transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-2 text-sm tracking-wider border border-primary-700"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Get My Quote Instantly</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>

            <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">
              AI-powered instant quotes. Write in English, Arabic, French, or any language.
            </p>
          </form>
        </div>
      )}

      {/* ═══ LOADING ═══ */}
      {state === 'loading' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8 sm:p-12 animate-fade-in-up">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-4">
              <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Building your quote...</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Our AI is analyzing your request and finding the best options.</p>
          </div>
        </div>
      )}

      {/* ═══ QUOTE ═══ */}
      {state === 'quote' && quote && (
        <div ref={quoteRef} className="space-y-0 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-t-lg shadow-md border border-b-0 border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  Your Quote
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Review and edit, then choose how to proceed.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 border-x border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 sm:py-5">
            <QuoteCard quote={quote} onUpdate={handleQuoteUpdate} availableVehicles={availableVehicles} />

            {/* Refinement input */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Want to change something? Tell us:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={refineInput}
                  onChange={(e) => setRefineInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefineQuote() } }}
                  placeholder="e.g. make it 3 days instead, or add a baby seat..."
                  disabled={refining}
                  className="flex-1 min-w-0 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#742F38] focus:border-[#742F38] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 disabled:opacity-50"
                  dir="auto"
                />
                <button
                  onClick={handleRefineQuote}
                  disabled={!refineInput.trim() || refining}
                  className="px-3 py-2.5 bg-[#742F38] hover:bg-[#5C262D] text-white rounded-lg transition-colors disabled:opacity-30 flex-shrink-0 flex items-center gap-1.5 text-sm"
                >
                  {refining ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="w-4 h-4" />
                  )}
                  {refining ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>

          <QuoteActions
            quote={quote}
            phone={phone}
            whatsappNumber={whatsappNumber}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  )
}
