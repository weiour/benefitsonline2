export const ThemeManager = {
  init() {
    this.loadTheme()
    this.loadAccessibility()
    this.loadFontSize()
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.getCurrentTheme() === 'auto') {
        this.applyTheme('auto')
      }
    })
  },

  getCurrentTheme() {
    return localStorage.getItem('theme') || 'light'
  },

  getAccessibilityModes() {
    try {
      return JSON.parse(localStorage.getItem('accessibilityModes')) || {
        highContrast: false,
        largeText: false
      }
    } catch {
      return {
        highContrast: false,
        largeText: false
      }
    }
  },

  getFontSize() {
    return parseInt(localStorage.getItem('fontSize')) || 100
  },

  setTheme(theme) {
    localStorage.setItem('theme', theme)
    this.applyTheme(theme)
  },

  setFontSize(size) {
    localStorage.setItem('fontSize', size.toString())
    this.applyFontSize(size)
  },

  applyTheme(theme) {
    const html = document.documentElement
    
    html.removeAttribute('data-theme')
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      html.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      html.setAttribute('data-theme', theme)
    }
    
  },

  applyFontSize(size) {
    const html = document.documentElement
    
    if (size === 100) {
      html.removeAttribute('data-font-size')
      html.style.setProperty('--custom-font-size', null)
      html.style.setProperty('--custom-font-size-multiplier', null)
    } else {
      html.setAttribute('data-font-size', 'true')
      html.style.setProperty('--custom-font-size', `${size}%`)
      html.style.setProperty('--custom-font-size-multiplier', (size / 100))
    }
    
  },

  updateAccessibility(modes) {
    localStorage.setItem('accessibilityModes', JSON.stringify(modes))
    this.applyAccessibility(modes)
  },

  applyAccessibility(modes) {
    const html = document.documentElement
    
    html.removeAttribute('data-accessibility')
    
    const activeModes = Object.entries(modes)
      .filter(([_, value]) => value === true)
      .map(([key]) => key)
    
    if (activeModes.length > 0) {
      html.setAttribute('data-accessibility', activeModes.join(' '))
    }
    
  },

  loadTheme() {
    const theme = this.getCurrentTheme()
    this.applyTheme(theme)
  },

  loadAccessibility() {
    const modes = this.getAccessibilityModes()
    this.applyAccessibility(modes)
  },

  loadFontSize() {
    const fontSize = this.getFontSize()
    this.applyFontSize(fontSize)
  },

  reset() {
    localStorage.removeItem('theme')
    localStorage.removeItem('accessibilityModes')
    localStorage.removeItem('fontSize')
    
    const html = document.documentElement
    html.removeAttribute('data-theme')
    html.removeAttribute('data-accessibility')
    html.removeAttribute('data-font-size')
    html.style.removeProperty('--custom-font-size')
    html.style.removeProperty('--custom-font-size-multiplier')
    
    this.applyTheme('light')
    this.applyAccessibility({ highContrast: false, largeText: false })
    this.applyFontSize(100)
  }
}