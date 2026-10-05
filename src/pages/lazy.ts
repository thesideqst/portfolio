// The project pages' code, by route. App.tsx loads each page on demand; opening a
// project's summary on the wheel starts fetching its page early, so it's usually
// ready by the time "more" is clicked. Same import paths, so the same chunks.
const pageLoaders: Record<string, () => Promise<unknown>> = {
  '/resume': () => import('@/components/Resume'),
  '/account-signals': () => import('@/components/AccountSignals'),
  '/mirorra': () => import('@/components/Mirorra'),
  '/photography': () => import('@/components/Life'),
  '/fora': () => import('@/components/Travel'),
}

export function preloadPage(href: string) {
  void pageLoaders[href]?.().catch(() => {})
}
