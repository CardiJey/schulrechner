if (!is_electron && typeof navigator.serviceWorker !== 'undefined') {
    console.log(is_electron)
    navigator.serviceWorker.register('sw.js')
}