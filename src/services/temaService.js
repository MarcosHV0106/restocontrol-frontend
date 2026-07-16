const THEME_KEY = 'tema'

export function obtenerTema() {
    return localStorage.getItem(THEME_KEY) || 'light'
}

export function guardarTema(tema) {
    localStorage.setItem(THEME_KEY, tema)
}

export function aplicarTema(tema) {

    if (tema === 'dark') {
        document.body.classList.add('dark-theme')
    } else {
        document.body.classList.remove('dark-theme')
    }

    document.querySelector('meta[name="theme-color"]')?.setAttribute(
        'content',
        tema === 'dark' ? '#242425' : '#cf633d'
    )

    guardarTema(tema)
}

export function inicializarTema() {
    aplicarTema(obtenerTema())
}
