'use client'

const SCOPE = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly'
const API = 'https://photospicker.googleapis.com/v1'

export interface PickedPhoto {
  baseUrl: string
  filename: string
  mimeType: string
}

export interface GooglePhotosPick {
  token: string
  items: PickedPhoto[]
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { google?: any }
}

function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve()
    const existing = document.getElementById('gis-script') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }
    const s = document.createElement('script')
    s.id = 'gis-script'
    s.src = 'https://accounts.google.com/gsi/client'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google sign-in'))
    document.head.appendChild(s)
  })
}

async function getAccessToken(clientId: string): Promise<string> {
  await loadGis()
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp: any) => {
        if (resp?.access_token) resolve(resp.access_token)
        else reject(new Error(resp?.error || 'Google sign-in failed'))
      },
      error_callback: (err: any) => reject(new Error(err?.message || 'Google sign-in was cancelled')),
    })
    client.requestAccessToken()
  })
}

export async function pickFromGooglePhotos(
  clientId: string,
  onStatus?: (msg: string) => void
): Promise<GooglePhotosPick> {
  const token = await getAccessToken(clientId)
  const auth = { Authorization: `Bearer ${token}` }

  const sessionRes = await fetch(`${API}/sessions`, { method: 'POST', headers: auth })
  const session = await sessionRes.json()
  if (!session.pickerUri) {
    throw new Error(session.error?.message || 'Could not start a Google Photos session')
  }

  const tab = window.open(session.pickerUri, '_blank')
  if (!tab) throw new Error('Popup blocked — allow popups for this site and try again')
  onStatus?.('Select photos in the Google Photos tab, then press Done')

  // Poll the session until the user finishes picking (10 min limit)
  const deadline = Date.now() + 10 * 60 * 1000
  let done = false
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000))
    const s = await (await fetch(`${API}/sessions/${session.id}`, { headers: auth })).json()
    if (s.mediaItemsSet) { done = true; break }
  }
  try { tab.close() } catch { /* ignore */ }
  if (!done) throw new Error('Timed out waiting for photo selection')

  const items: PickedPhoto[] = []
  let pageToken: string | undefined
  do {
    const url = new URL(`${API}/mediaItems`)
    url.searchParams.set('sessionId', session.id)
    url.searchParams.set('pageSize', '100')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const page = await (await fetch(url.toString(), { headers: auth })).json()
    for (const item of page.mediaItems || []) {
      if (item.type && item.type !== 'PHOTO') continue
      items.push({
        baseUrl: item.mediaFile.baseUrl,
        filename: item.mediaFile.filename || `photo-${items.length + 1}.jpg`,
        mimeType: item.mediaFile.mimeType || 'image/jpeg',
      })
    }
    pageToken = page.nextPageToken
  } while (pageToken)

  fetch(`${API}/sessions/${session.id}`, { method: 'DELETE', headers: auth }).catch(() => {})
  return { token, items }
}
