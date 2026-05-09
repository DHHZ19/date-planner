const isInvalidStateError = (error: unknown) =>
  error instanceof DOMException && error.name === 'InvalidStateError'

const handleViewTransitionRejection = (error: unknown) => {
  if (isInvalidStateError(error)) {
    return
  }

  globalThis.setTimeout(() => {
    throw error
  })
}

export const startSafeViewTransition = (
  updateCallback: () => void | Promise<void>,
) => {
  if (
    typeof document === 'undefined' ||
    !('startViewTransition' in document)
  ) {
    void updateCallback()
    return
  }

  const transition = document.startViewTransition(updateCallback)

  void transition.ready.catch(handleViewTransitionRejection)
  void transition.updateCallbackDone.catch(handleViewTransitionRejection)
  void transition.finished.catch(handleViewTransitionRejection)
}
