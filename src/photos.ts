// Generated from the "Portfolio Photos" folder in iCloud Drive: web-sized WebP copies live in
// public/media/photos (full size) and public/media/photos/thumb (grid). Originals stay in iCloud.
// A curated fifteen, shown on /photography in this order; reorder freely.

export type Photo = {
  id: string
  w: number
  h: number
  alt?: string
  /** Local capture time from the original's EXIF, 'YYYY-MM-DDTHH:mm'. */
  taken?: string
  /** Neighbourhood or landmark only, never an exact spot. Left out where it isn't known. */
  place?: string
}

export const photos: Photo[] = [
  { id: 'mood-1789776637747', w: 1797, h: 2400, taken: '2026-09-18T20:10', place: 'Midtown, Manhattan' },
  { id: 'img-9427', w: 1800, h: 2400, taken: '2026-08-09T16:41', place: 'Yellowstone National Park' },
  { id: 'img-6313', w: 1797, h: 2400, taken: '2026-02-28T19:49', place: 'Hudson Theatre, Midtown, Manhattan' },
  { id: 'img-8672', w: 1797, h: 2400, taken: '2026-07-11T21:37', place: 'Greenpoint, Brooklyn' },
  { id: 'img-7636', w: 2400, h: 1797, taken: '2026-05-28T20:36', place: 'Upper East Side, Manhattan' },
  { id: 'img-8182', w: 1797, h: 2400, taken: '2026-06-24T20:48', place: 'Greenpoint, Brooklyn' },
  { id: 'mood-1790377592875', w: 1797, h: 2400, taken: '2026-09-25T19:06', place: 'Long Island City, Queens' },
  { id: 'mood-1789933170499', w: 1797, h: 2400, taken: '2026-09-20T15:39', place: 'David H. Koch Theater, Upper West Side, Manhattan' },
  { id: 'img-8317', w: 1797, h: 2400, taken: '2026-06-28T22:46', place: 'Chinatown, Manhattan' },
  { id: 'img-9334', w: 1797, h: 2400, taken: '2026-08-08T23:10', place: 'Livingston, Montana' },
  { id: 'img-7402', w: 1797, h: 2400, taken: '2026-05-23T16:26', place: 'The Met, Upper East Side, Manhattan' },
  { id: 'img-0029', w: 1800, h: 2400, taken: '2026-09-18T14:08', place: 'World Trade Center, Financial District, Manhattan' },
  { id: 'img-7847', w: 1797, h: 2400, taken: '2026-06-09T20:12', place: 'DUMBO, Brooklyn' },
  { id: 'mood-1789933540577', w: 1797, h: 2400, taken: '2026-09-20T15:45', place: 'David H. Koch Theater, Upper West Side, Manhattan' },
  { id: 'img-7974', w: 1797, h: 2400, taken: '2026-06-14T00:38', place: 'Washington Square Park, Greenwich Village, Manhattan' },
]

export const photoSrc = (p: Photo) => `/media/photos/${p.id}.webp`
export const thumbSrc = (p: Photo) => `/media/photos/thumb/${p.id}.webp`
