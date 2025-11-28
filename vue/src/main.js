import { createApp } from 'vue'
import App from './App.vue'
import router from './routes'
import Tooltip from 'primevue/tooltip';

import './assets/theme.css'
import { ThemeManager } from './utils/theme'

const app = createApp(App);
app.directive('tooltip', Tooltip);

app.use(router)

import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Card from 'primevue/card'
import Chip from 'primevue/chip'
import Badge from 'primevue/badge'
import ProgressSpinner from 'primevue/progressspinner'
import Avatar from 'primevue/avatar'
import Menubar from 'primevue/menubar'
import ScrollPanel from 'primevue/scrollpanel'
import Tag from 'primevue/tag'
import Sidebar from 'primevue/sidebar'
import Message from 'primevue/message'

app.component('Button', Button)
app.component('InputText', InputText)
app.component('Card', Card)
app.component('Chip', Chip)
app.component('Badge', Badge)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Avatar', Avatar)
app.component('Menubar', Menubar)
app.component('ScrollPanel', ScrollPanel)
app.component('Tag', Tag)
app.component('Sidebar', Sidebar)
app.component('Message', Message)

app.use(PrimeVue)
app.use(ToastService)

console.log('Инициализация менеджера тем...')

setTimeout(() => {
  console.log('Текущие атрибуты HTML:', {
    theme: document.documentElement.getAttribute('data-theme'),
    accessibility: document.documentElement.getAttribute('data-accessibility'),
    classList: document.documentElement.classList.toString()
  })
}, 100)

ThemeManager.init()

app.mount('#app')

async function checkBackendConnection() {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/benefits/`)
    console.log('Backend connection:', response.ok ? 'OK' : 'Failed')
  } catch (error) {
    console.error('Cannot connect to backend:', error)
  }
}
checkBackendConnection()