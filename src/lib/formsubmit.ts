// Forms on the site post to FormSubmit, which emails each submission on to `to`. No account
// needed, but every new address (per site) stays inactive until the activation email that its
// first live submission sends has been clicked.

/** Sends a form's fields to `to`. Resolves true once FormSubmit has accepted it. */
export async function sendForm(to: string, subject: string, fields: Record<string, unknown>, replyTo?: unknown) {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${to}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...fields, _subject: subject, _replyto: replyTo, _template: 'table', _captcha: 'false' }),
    })
    const json = res.ok ? await res.json().catch(() => null) : null
    return json?.success === 'true' || json?.success === true
  } catch {
    return false
  }
}
