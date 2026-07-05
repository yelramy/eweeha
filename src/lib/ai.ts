/**
 * AI Integration Module
 * Supports OpenAI and Anthropic APIs for content generation and SEO optimization
 */

interface AIConfig {
  provider: 'openai' | 'anthropic'
  apiKey: string
  model?: string
}

interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Get AI configuration from environment
 */
function getAIConfig(): AIConfig | null {
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (openaiKey) {
    return {
      provider: 'openai',
      apiKey: openaiKey,
      // gpt-5.4-mini: strongest small model (Mar 2026) — handles Arabic/Arabizi/French
      // booking messages reliably; ~$0.002 per interpret call. Override with OPENAI_MODEL.
      model: process.env.OPENAI_MODEL || 'gpt-5.4-mini'
    }
  }

  if (anthropicKey) {
    return {
      provider: 'anthropic',
      apiKey: anthropicKey,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
    }
  }

  return null
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  prompt: string,
  systemPrompt: string,
  config: AIConfig,
  options?: { jsonMode?: boolean }
): Promise<AIResponse> {
  const isGPT5 = config.model?.includes('gpt-5') || config.model?.includes('gpt-4.1')
  
  const requestBody: Record<string, unknown> = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  }
  
  if (!isGPT5) {
    requestBody.temperature = 0.7
  }
  
  if (isGPT5) {
    requestBody.max_completion_tokens = options?.jsonMode ? 8000 : 4000
  } else {
    requestBody.max_tokens = 2000
  }

  if (options?.jsonMode) {
    requestBody.response_format = { type: 'json_object' }
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()

  const choice = data.choices?.[0]
  const finishReason = choice?.finish_reason
  const content = choice?.message?.content ?? ''
  
  if (!content && choice?.message?.refusal) {
    throw new Error(`OpenAI refused: ${choice.message.refusal}`)
  }

  if (!content) {
    console.error('OpenAI empty response. finish_reason:', finishReason, '| model:', data.model, '| choices:', JSON.stringify(data.choices))
    throw new Error(`OpenAI returned empty content (finish_reason: ${finishReason}). Model: ${data.model || config.model}`)
  }
  
  return {
    content,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    }
  }
}

/**
 * Call Anthropic API
 */
async function callAnthropic(prompt: string, systemPrompt: string, config: AIConfig): Promise<AIResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  
  return {
    content: data.content[0].text,
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    }
  }
}

/**
 * Main AI completion function
 */
export async function generateAICompletion(
  prompt: string,
  systemPrompt: string = 'You are a helpful assistant.',
  options?: { jsonMode?: boolean }
): Promise<AIResponse> {
  const config = getAIConfig()
  
  if (!config) {
    throw new Error('No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.')
  }

  try {
    console.log(`🤖 AI call: provider=${config.provider}, model=${config.model}, jsonMode=${options?.jsonMode ?? false}`)
    if (config.provider === 'openai') {
      return await callOpenAI(prompt, systemPrompt, config, options)
    } else {
      return await callAnthropic(prompt, systemPrompt, config)
    }
  } catch (error) {
    console.error('AI completion error:', error)
    throw error
  }
}

/**
 * Generate SEO optimized meta title
 */
export async function generateMetaTitle(content: {
  pageName: string
  businessName: string
  keywords?: string[]
  targetAudience?: string
}): Promise<string> {
  const systemPrompt = `You are an expert SEO copywriter. Generate compelling, SEO-optimized meta titles that:
- Are 50-60 characters long
- Include primary keywords naturally
- Are compelling and click-worthy
- Follow best SEO practices
- Include brand name at the end
Only return the title text, nothing else.`

  const prompt = `Generate an SEO meta title for:
Page: ${content.pageName}
Business: ${content.businessName}
${content.keywords ? `Keywords: ${content.keywords.join(', ')}` : ''}
${content.targetAudience ? `Target Audience: ${content.targetAudience}` : ''}`

  const response = await generateAICompletion(prompt, systemPrompt)
  return response.content.trim().replace(/^["']|["']$/g, '') // Remove quotes if present
}

/**
 * Generate SEO optimized meta description
 */
export async function generateMetaDescription(content: {
  pageName: string
  pageContent: string
  keywords?: string[]
  callToAction?: string
}): Promise<string> {
  const systemPrompt = `You are an expert SEO copywriter. Generate compelling meta descriptions that:
- Are 150-160 characters long
- Include primary keywords naturally
- Have a clear call-to-action
- Are engaging and informative
- Follow best SEO practices
Only return the description text, nothing else.`

  const prompt = `Generate an SEO meta description for:
Page: ${content.pageName}
Content Summary: ${content.pageContent}
${content.keywords ? `Keywords: ${content.keywords.join(', ')}` : ''}
${content.callToAction ? `CTA: ${content.callToAction}` : ''}`

  const response = await generateAICompletion(prompt, systemPrompt)
  return response.content.trim().replace(/^["']|["']$/g, '')
}

/**
 * Generate keyword suggestions
 */
export async function generateKeywords(content: {
  topic: string
  industry: string
  location?: string
  targetAudience?: string
}): Promise<string[]> {
  const systemPrompt = `You are an SEO keyword research expert. Generate a list of relevant, high-value keywords that:
- Are actually searched by users
- Have commercial intent when appropriate
- Include long-tail variations
- Consider local SEO when location is provided
Return ONLY a comma-separated list of keywords, nothing else.`

  const prompt = `Generate SEO keywords for:
Topic: ${content.topic}
Industry: ${content.industry}
${content.location ? `Location: ${content.location}` : ''}
${content.targetAudience ? `Target Audience: ${content.targetAudience}` : ''}`

  const response = await generateAICompletion(prompt, systemPrompt)
  return response.content
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0)
}

/**
 * Generate content for vehicle description
 */
export async function generateVehicleDescription(vehicle: {
  name: string
  type: string
  capacity: number
  features: string[]
  priceRange?: string
}): Promise<string> {
  const systemPrompt = `You are a professional automotive copywriter. Write compelling, benefit-focused vehicle descriptions that:
- Highlight key features and benefits
- Are 150-200 words
- Use persuasive language
- Include practical use cases
- Are formatted in clear paragraphs
Return only the description text.`

  const prompt = `Write a vehicle description for:
Name: ${vehicle.name}
Type: ${vehicle.type}
Capacity: ${vehicle.capacity} passengers
Features: ${vehicle.features.join(', ')}
${vehicle.priceRange ? `Price Range: ${vehicle.priceRange}` : ''}`

  const response = await generateAICompletion(prompt, systemPrompt)
  return response.content.trim()
}

/**
 * Generate blog post content
 */
export async function generateBlogPost(params: {
  title: string
  outline?: string[]
  keywords?: string[]
  wordCount?: number
  tone?: 'professional' | 'casual' | 'informative'
}): Promise<string> {
  const systemPrompt = `You are a professional content writer specializing in ${params.tone || 'informative'} blog posts. Write high-quality, engaging content that:
- Is well-structured with clear sections
- Includes relevant keywords naturally
- Provides value to readers
- Is formatted in markdown
- Has a compelling introduction and conclusion
Return only the blog post content in markdown format.`

  const prompt = `Write a blog post:
Title: ${params.title}
${params.outline ? `Outline:\n${params.outline.map((item, i) => `${i + 1}. ${item}`).join('\n')}` : ''}
${params.keywords ? `Keywords to include: ${params.keywords.join(', ')}` : ''}
Target length: ${params.wordCount || 800} words`

  const response = await generateAICompletion(prompt, systemPrompt)
  return response.content.trim()
}

/**
 * Analyze page for SEO improvements
 */
export async function analyzePageSEO(page: {
  url: string
  title?: string
  description?: string
  content: string
  keywords?: string[]
}): Promise<{
  score: number
  issues: Array<{ severity: 'high' | 'medium' | 'low'; message: string }>
  suggestions: string[]
}> {
  const systemPrompt = `You are an expert SEO auditor. Analyze the provided page and return a JSON object with:
- score: SEO score from 0-100
- issues: array of objects with severity ('high', 'medium', 'low') and message
- suggestions: array of actionable improvement suggestions

Return ONLY valid JSON, no markdown formatting or additional text.`

  const prompt = `Analyze this page for SEO:
URL: ${page.url}
Title: ${page.title || 'Not set'}
Description: ${page.description || 'Not set'}
Target Keywords: ${page.keywords?.join(', ') || 'None specified'}
Content (first 1000 chars): ${page.content.substring(0, 1000)}

Evaluate:
- Title optimization
- Description quality
- Keyword usage
- Content structure
- Meta tags
- Overall SEO health`

  const response = await generateAICompletion(prompt, systemPrompt)
  
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response.content)
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    throw new Error('Failed to parse SEO analysis response')
  }
}

/**
 * Interpret a free-text booking request into structured booking data.
 * Accepts input in any language (Arabic, French, English, etc.) and always returns English.
 */
export async function interpretBookingRequest(
  userMessage: string,
  vehicleCatalog: Array<{
    id: string
    name: string
    maxPassengers?: number
    maxLuggage?: number
    price6h?: number
    price10h?: number
    price24h?: number
    availableExtras?: Array<{ id: string; name: string; price: number; perDay: boolean }>
  }>
): Promise<BookingInterpretation> {
  const today = new Date().toISOString().split('T')[0]

  // Build compact catalog — only include IDs, names, capacity, and pricing
  const catalogText = vehicleCatalog.map(v => {
    const p = [v.price6h && `6h:$${v.price6h}`, v.price10h && `10h:$${v.price10h}`, v.price24h && `24h:$${v.price24h}`].filter(Boolean).join(' ')
    return `${v.id}|${v.name}|${v.maxPassengers || 0}pax|${p}`
  }).join('\n')

  // Collect unique extras across all vehicles
  const extrasSet = new Map<string, string>()
  for (const v of vehicleCatalog) {
    for (const e of v.availableExtras || []) {
      if (!extrasSet.has(e.id)) extrasSet.set(e.id, e.name)
    }
  }
  const extrasText = extrasSet.size > 0 ? '\nExtras: ' + [...extrasSet.entries()].map(([id, name]) => `${id}=${name}`).join(', ') : ''

  const systemPrompt = `Eweeha booking assistant. Driver+fuel included. Today: ${today}
Vehicles (id|name|capacity|rates):
${catalogText}${extrasText}
Services: "airport"=one-way airport pickup/dropoff (half the 6h price), "6h"=half day up to 6 hours, "10h"=full day up to 10 hours, "full-day"=24 hours overnight/extended

Input may be ANY language. Output ONLY JSON in English:
{"days":[{"date":"YYYY-MM-DD","serviceType":"airport|6h|10h|full-day","label":"description"}],"vehicleRecommendations":[{"vehicleId":"id","vehicleName":"name","reason":"why","quantity":1}],"passengers":null,"startingLocation":null,"extras":[],"notes":"summary","clarifications":["questions"]}

Rules: recommend vehicles by passenger count, use multiple if needed, guess vague dates from today, default serviceType "10h". Use "airport" for airport pickups/dropoffs, "6h" for half day, "10h" for full day, "full-day" for 24h. List missing info in clarifications.`

  const response = await generateAICompletion(userMessage, systemPrompt, { jsonMode: true })
  const raw = response.content || ''

  if (!raw.trim()) {
    console.error('AI returned empty content for booking interpretation')
    throw new Error('AI returned an empty response. Please try again.')
  }

  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON object found in AI response:', raw)
      throw new Error('parse')
    }
    const parsed = JSON.parse(jsonMatch[0])
    return {
      days: Array.isArray(parsed.days) ? parsed.days : [],
      vehicleRecommendations: Array.isArray(parsed.vehicleRecommendations) ? parsed.vehicleRecommendations : [],
      passengers: typeof parsed.passengers === 'number' ? parsed.passengers : null,
      startingLocation: parsed.startingLocation || null,
      extras: Array.isArray(parsed.extras) ? parsed.extras : [],
      notes: parsed.notes || '',
      clarifications: Array.isArray(parsed.clarifications) ? parsed.clarifications : [],
    }
  } catch (error) {
    console.error('Failed to parse booking interpretation. Raw AI response:', raw)
    throw new Error('Failed to interpret booking request. Please try rephrasing.')
  }
}

export interface BookingInterpretation {
  days: Array<{ date: string; serviceType: 'airport' | '6h' | '10h' | 'full-day'; label: string }>
  vehicleRecommendations: Array<{ vehicleId: string; vehicleName: string; reason: string; quantity: number }>
  passengers: number | null
  startingLocation: string | null
  extras: string[]
  notes: string
  clarifications: string[]
}

/**
 * Check if AI is configured
 */
export function isAIConfigured(): boolean {
  return getAIConfig() !== null
}

/**
 * Get current AI provider
 */
export function getAIProvider(): string | null {
  const config = getAIConfig()
  return config?.provider || null
}


