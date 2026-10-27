// Pulls the newest Account Signals episode into src/latest-episode.json before each build.
// The Lovable app has no public API and blocks cross-origin calls, so the browser can't ask it
// directly; instead we call the same server function its home page uses, from Node at build time.
// If anything fails, the committed JSON stays as-is and the build carries on.
import { writeFile } from 'node:fs/promises'

const APP = 'https://account-audio-briefing.lovable.app'
const OUT = new URL('../src/latest-episode.json', import.meta.url)
const headers = { Origin: APP, Referer: `${APP}/` }

// Seroval keeps JS escapes (\n, <) inside its strings.
function unescape(s) {
  try {
    return JSON.parse(`"${s}"`)
  } catch {
    return s
  }
}

// Server function responses are seroval-encoded; we only need strings, numbers, arrays, and objects.
function decode(node) {
  if (!node || typeof node !== 'object') return undefined
  switch (node.t) {
    case 0: return node.s
    case 1: return unescape(node.s)
    case 9: return node.a.map(decode)
    case 10: return Object.fromEntries(node.p.k.map((k, i) => [k, decode(node.p.v[i])]))
    default: return undefined
  }
}

async function latestEpisode() {
  const html = await (await fetch(APP)).text()
  const entry = html.match(/\/assets\/index-[\w-]+\.js/)?.[0]
  if (!entry) throw new Error('entry bundle not found')
  const js = await (await fetch(APP + entry)).text()
  // The function id is a content hash that changes on every Lovable deploy, so find it fresh.
  const id = js.match(/Gs\(`([0-9a-f]{64})`\)\),\w+=\w+\(\{queryKey:\[`live-briefings`\]/)?.[1]
    ?? js.match(/`([0-9a-f]{64})`/)?.[1]
  if (!id) throw new Error('briefings function not found')

  const res = await fetch(`${APP}/_serverFn/${id}`, { headers })
  if (!res.ok) throw new Error(`briefings ${res.status}`)
  const episodes = decode(await res.json())?.result?.episodes
  if (!episodes?.length) throw new Error('no episodes')

  const ep = episodes
    .filter((e) => e.audio_bytes > 0 && e.script_text)
    .sort((a, b) => b.generated_at.localeCompare(a.generated_at))[0]
  if (!ep) throw new Error('no episode with audio')

  return {
    id: ep.briefing_id,
    account: ep.account_id,
    title: ep.episode_title,
    generatedAt: ep.generated_at,
    audio: `${APP}/api/databricks/audio/${ep.account_id}/${ep.briefing_id}`,
    takeaways: ep.takeaways ?? [],
    script: ep.script_text,
  }
}

try {
  const ep = await latestEpisode()
  await writeFile(OUT, JSON.stringify(ep, null, 2) + '\n')
  console.log(`latest episode: ${ep.id} · ${ep.title}`)
} catch (err) {
  console.warn(`Couldn't refresh the latest episode (${err.message}); keeping the saved one.`)
}
