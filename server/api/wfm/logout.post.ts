/**
 * POST /api/wfm/logout
 *
 * Clears the WFM session cookies.
 */
export default defineEventHandler((event) => {
  clearWfmSession(event)
  return { success: true }
})
