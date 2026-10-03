export const TYPESAFE_FIXTURE_STORAGE_KEY = 'date-planner-typesafe-fixture'

export function typesafeFixtureRequested() {
  if (typeof window === 'undefined') return false

  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('typesafeFixture') === '1') {
      window.sessionStorage.setItem(TYPESAFE_FIXTURE_STORAGE_KEY, '1')
      return true
    }
    return window.sessionStorage.getItem(TYPESAFE_FIXTURE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
