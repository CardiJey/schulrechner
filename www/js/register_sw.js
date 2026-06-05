if (!is_electron && typeof navigator.serviceWorker !== 'undefined') {
    navigator.serviceWorker.register('sw.js')
}