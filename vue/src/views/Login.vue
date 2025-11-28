<template>
  <div class="login-container">
    <div class="container mx-auto px-4">
      <div class="grid justify-content-center">
        <div class="col-12 md:col-6 lg:col-5">
          <Card class="shadow-4 border-round-2xl">
            <template #content>
              <div class="my-8 app-logo w-full" style="width: 180px; height: 180px; margin: 0 auto;"></div>
                <div class="flex justify-content-end align-items-center mb-3">
                  <Button 
                    :icon="contrastIcon" 
                    @click="toggleContrast"
                    class="p-button-text p-button-plain contrast-toggle-btn"
                    :class="{ 'active': highContrast }"
                    v-tooltip="contrastTooltip"
                  />
                  <Button 
                    :icon="themeIcon" 
                    @click="toggleTheme"
                    class="p-button-text p-button-plain theme-toggle-btn"
                    v-tooltip="themeTooltip"
                  />
                </div>
              
              <!-- <div class="text-center mb-5 mt-5">
                <h2 class="text-3xl font-bold m-0 text-primary">Войдите в аккаунт</h2>
                <p class="text-color-secondary text-lg">Получайте доступ к персональным льготам</p>
              </div> -->

              <div class="flex flex-column gap-1">
                <Message 
                  v-if="errorMessage" 
                  severity="error"
                  :closable="false"
                  class="mb-2"
                >
                  {{ errorMessage }}
                </Message>

                <div class="field">
                  <InputText
                    id="phone"
                    v-model="form.phone"
                    placeholder="Введите телефон"
                    class="w-full border-round-xl"
                    :class="{ 'p-invalid': loginErrors.phone }"
                  />
                  <small v-if="loginErrors.phone" class="p-error">{{ loginErrors.phone }}</small>
                </div>

                <div class="field">
                  <Password 
                    id="password"
                    v-model="form.password"
                    placeholder="Введите пароль"
                    :feedback="false"
                    toggleMask
                    class="w-full"
                    inputClass="w-full border-round-xl"
                    :class="{ 'p-invalid': loginErrors.password }"
                  />
                  <small v-if="loginErrors.password" class="p-error">{{ loginErrors.password }}</small>
                </div>

                <div class="flex justify-content-between align-items-center mb-3">
                  <div class="flex align-items-center">
                    <Checkbox 
                      v-model="form.remember" 
                      binary
                      inputId="remember"
                      class="mr-2"
                    />
                    <label for="remember" class="text-sm text-color-secondary">Запомнить меня</label>
                  </div>
                  
                  <Button 
                    label="Забыли пароль?" 
                    link
                    class="p-0 text-sm text-primary font-semibold"
                    @click="showForgotPassword"
                  />
                </div>

                <Button 
                  label="Войти" 
                  icon="pi pi-sign-in"
                  class="w-full border-round-xl p-button-primary"
                  :loading="loading"
                  @click="handleLogin"
                />

                <Divider align="center">
                  <span class="text-color-secondary px-3 text-sm">или</span>
                </Divider>

                <div class="flex flex-column gap-3">
                  <div 
                    class="gosuslugi-login-btn cursor-pointer border-round-xl overflow-hidden"
                    @click="loginWithGosuslugi"
                  >
                    <img 
                      src="../assets/Gosuslugi.png" 
                      alt="Войти через Госуслуги" 
                      class="w-full h-auto"
                      style="max-height: 39px; object-fit: contain;"
                    >
                  </div>
                </div>

                <div class="text-center mt-3">
                  <span class="text-color-secondary">Еще нет аккаунта? </span>
                  <Button 
                    label="Зарегистрироваться" 
                    link
                    @click="goToRegister"
                    class="p-0 text-primary font-semibold"
                  />
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { ThemeManager } from '../utils/theme'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Divider from 'primevue/divider'
import Avatar from 'primevue/avatar'
import Message from 'primevue/message'
import InputMask from 'primevue/inputmask'

export default {
  name: 'Login',
  components: {
    Card,
    InputText,
    Password,
    Button,
    Checkbox,
    Divider,
    Avatar,
    Message,
    InputMask
  },
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const errorMessage = ref('')
    
    const form = ref({
      phone: '',
      password: '',
      remember: false
    })
    
    const loginErrors = ref({
      phone: '',
      password: ''
    })

    const currentTheme = ref(localStorage.getItem('app-theme') || 'light')
    const accessibilityModes = ref({
      highContrast: JSON.parse(localStorage.getItem('app-high-contrast') || 'false')
    })
    
    const normalizePhone = (value) => {
      if (!value) return ''
      const digits = value.replace(/\D/g, '')
      return digits || value.trim()
    }
    
    const validatePhone = (phone) => {
      if (!phone || phone.trim() === '') {
        return 'Введите номер телефона'
      }
      
      if (phone.includes('_')) {
        return 'Введите номер телефона полностью'
      }
      
      const digitsOnly = phone.replace(/\D/g, '')
      if (digitsOnly.length !== 11) {
        return 'Введите корректный номер телефона'
      }
      
      return ''
    }

    const handleLogin = async () => {
      loginErrors.value.phone = ''
      loginErrors.value.password = ''
      errorMessage.value = ''
      
      let hasErrors = false
      
      const phoneError = validatePhone(form.value.phone)
      if (phoneError) {
        loginErrors.value.phone = phoneError
        hasErrors = true
      }
      
      if (!form.value.password) {
        loginErrors.value.password = 'Введите пароль'
        hasErrors = true
      }
      
      if (hasErrors) {
        errorMessage.value = 'Заполните все обязательные поля'
        return
      }

      loading.value = true

      try {
        const payload = {
          username: normalizePhone(form.value.phone),
          password: form.value.password
        }

        console.log('Отправка запроса на вход:', payload)

        const oldUser = JSON.parse(localStorage.getItem('user') || '{}')
        if (oldUser.id) {
          const { clearNotificationsForUser } = await import('../services/notifications')
          clearNotificationsForUser(oldUser.id)
        }
        
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')

        const { data: tokens } = await api.post('/token/', payload)
        console.log('Получены токены:', tokens)
        
        if (!tokens.access || !tokens.refresh) {
          throw new Error('Неверный формат ответа от сервера')
        }
        
        localStorage.setItem('accessToken', tokens.access)
        localStorage.setItem('refreshToken', tokens.refresh)

        const { data: userData } = await api.get('/users/me/')
        console.log('Получены данные пользователя:', userData)
        
        const userDataWithPhone = {
          ...userData,
          phone: form.value.phone
        }
        
        localStorage.setItem('user', JSON.stringify(userDataWithPhone))

        router.push('/')
      } catch (error) {
        console.error('Login error:', error)
        if (error.response?.status === 401) {
          errorMessage.value = 'Неверный телефон или пароль'
        } else if (error.response?.status === 400) {
          errorMessage.value = 'Неверные данные для входа'
        } else {
          errorMessage.value = 'Не удалось выполнить вход. Попробуйте позже.'
        }
      } finally {
        loading.value = false
      }
    }
    
    const loginWithGosuslugi = async () => {
      errorMessage.value = ''
      loading.value = true

      try {
        const oldUser = JSON.parse(localStorage.getItem('user') || '{}')
        if (oldUser.id) {
          const { clearNotificationsForUser } = await import('../services/notifications')
          clearNotificationsForUser(oldUser.id)
        }
        
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        
        const { data } = await api.post('/auth/gosuslugi/')
        
        localStorage.setItem('accessToken', data.access)
        localStorage.setItem('refreshToken', data.refresh)
        localStorage.setItem('user', JSON.stringify(data.user))

        router.push('/')
      } catch (error) {
        errorMessage.value = 'Не удалось выполнить вход через Госуслуги. Попробуйте позже.'
        console.error('Gosuslugi auth error:', error)
      } finally {
        loading.value = false
      }
    }
    
    const loginWithSber = () => {
      alert('Функция в разработке')
    }
    
    const showForgotPassword = () => {
      alert('Функция в разработке')
    }
    
    const goToRegister = () => {
      router.push('/register')
    }

    const toggleTheme = () => {
      currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
      ThemeManager.setTheme(currentTheme.value)
      localStorage.setItem('app-theme', currentTheme.value)
    }

    const toggleContrast = () => {
      accessibilityModes.value.highContrast = !accessibilityModes.value.highContrast
      ThemeManager.updateAccessibility(accessibilityModes.value)
      localStorage.setItem('app-high-contrast', accessibilityModes.value.highContrast)
    }

    const themeIcon = computed(() => 
      currentTheme.value === 'light' ? 'pi pi-moon' : 'pi pi-sun'
    )

    const contrastIcon = computed(() => 
      accessibilityModes.value.highContrast ? 'pi pi-eye-slash' : 'pi pi-eye'
    )

    const themeTooltip = computed(() => 
      currentTheme.value === 'light' ? 'Переключить на темную тему' : 'Переключить на светлую тему'
    )

    const contrastTooltip = computed(() => 
      accessibilityModes.value.highContrast ? 'Выключить высокую контрастность' : 'Включить высокую контрастность'
    )

    onMounted(() => {
      const savedTheme = localStorage.getItem('app-theme')
      if (savedTheme) {
        currentTheme.value = savedTheme
        ThemeManager.setTheme(savedTheme)
      }

      const savedContrast = localStorage.getItem('app-high-contrast')
      if (savedContrast) {
        accessibilityModes.value.highContrast = JSON.parse(savedContrast)
        ThemeManager.updateAccessibility(accessibilityModes.value)
      }
    })

    return {
      form,
      loading,
      errorMessage,
      loginErrors,
      handleLogin,
      loginWithGosuslugi,
      loginWithSber,
      showForgotPassword,
      goToRegister,
      toggleTheme,
      toggleContrast,
      themeIcon,
      contrastIcon,
      themeTooltip,
      contrastTooltip,
      toggleTheme,
      toggleContrast,
      themeIcon,
      contrastIcon,
      themeTooltip,
      contrastTooltip,
      highContrast: accessibilityModes.value.highContrast
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: -8px;
  padding: 1rem;
  background: linear-gradient(135deg, #63DDA0 0%, #7298D2 100%);
}

::deep() {
  body {
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden;
    background: linear-gradient(135deg, #63DDA0 0%, #7298D2 100%);
  }
  
  html {
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden;
  }
}

::deep(.p-card) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

::deep(.p-card .p-card-content) {
  padding: 1.5rem;
}

::deep(.p-button) {
  padding: 0.75rem 1.25rem;
  border-radius: 1rem;
}

::deep(.p-inputtext) {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

::deep(.p-divider) {
  margin: 1.5rem 0;
}

.theme-toggle-btn,
.contrast-toggle-btn {
  color: var(--text-color-secondary);
  transition: all 0.3s ease;
}

.theme-toggle-btn:hover,
.contrast-toggle-btn:hover {
  color: var(--primary-color);
  transform: scale(1.1);
}

.contrast-toggle-btn.active {
  color: var(--primary-color);
  background-color: var(--primary-100);
  border-radius: 50%;
}

:deep([data-theme="dark"] .login-container) {
  background: linear-gradient(135deg, #4a9e7a 0%, #5a7ca9 100%);
}

:deep([data-theme="dark"] .p-card) {
  background: rgba(30, 30, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.high-contrast .login-container) {
  background: #000000 !important;
}

:deep(.high-contrast .p-card) {
  background: #000000 !important;
  border: 2px solid #ffffff !important;
}
</style>