<template>
  <div class="register-container">
    <div class="container mx-auto px-4">
      <div class="grid justify-content-center">
        <div class="col-12 md:col-6 lg:col-5">
          <Card class="shadow-4 border-round-2xl">
            <template #content>
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
                  <label for="full_name" class="font-semibold mb-2 block">ФИО</label>
                  <InputText 
                    id="full_name"
                    v-model="form.full_name"
                    placeholder="Введите имя"
                    class="w-full border-round-xl"
                  />
                </div>

                <div class="field">
                  <label for="phone" class="font-semibold mb-2 block">Телефон</label>
                  <InputText
                    id="phone"
                    v-model="form.phone"
                    placeholder="Введите номер"
                    class="w-full border-round-xl"
                    :class="{ 'p-invalid': registerErrors.phone }"
                  />
                  <small v-if="registerErrors.phone" class="p-error">{{ registerErrors.phone }}</small>
                  <small v-else class="text-color-secondary text-xs mt-1">
                    На этот номер будет отправлен код подтверждения
                  </small>
                </div>

                <div class="field">
                  <label for="email" class="font-semibold mb-2 block">Email</label>
                  <InputText 
                    id="email"
                    v-model="form.email"
                    type="email"
                    placeholder="you@example.com"
                    class="w-full border-round-xl"
                  />
                </div>

                <div class="field">
                  <label for="snils" class="font-semibold mb-2 block">СНИЛС</label>
                  <InputMask 
                    id="snils"
                    v-model="form.snils"
                    mask="999-999-999 99"
                    placeholder="000-000-000 00"
                    class="w-full border-round-xl"
                  />
                </div>

                <div class="field">
                  <label for="category" class="font-semibold mb-2 block">Категория</label>
                  <Dropdown 
                    id="category"
                    v-model="form.category"
                    :options="categories"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Выберите категорию"
                    class="w-full border-round-xl"
                  />
                </div>

                <div class="field">
                  <label for="region" class="font-semibold mb-2 block">Регион</label>
                  <Dropdown
                    id="region"
                    v-model="form.region"
                    :options="regions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Выберите регион"
                    class="w-full border-round-xl"
                  />
                </div>

                <div class="field">
                  <label for="password" class="font-semibold mb-2 block">Пароль</label>
                  <Password 
                    id="password"
                    v-model="form.password"
                    placeholder="Придумайте пароль"
                    :feedback="false"
                    toggleMask
                    class="w-full"
                    inputClass="w-full border-round-xl"
                    :class="{ 'p-invalid': registerErrors.password }"
                  />
                  <small v-if="registerErrors.password" class="p-error">{{ registerErrors.password }}</small>
                </div>

                <div class="field">
                  <label for="password_confirm" class="font-semibold mb-2 block">Повторите пароль</label>
                  <Password 
                    id="password_confirm"
                    v-model="form.passwordConfirm"
                    placeholder="Повторите пароль"
                    :feedback="false"
                    toggleMask
                    class="w-full"
                    inputClass="w-full border-round-xl"
                  />
                </div>

                <Button 
                  label="Зарегистрироваться" 
                  icon="pi pi-user-plus"
                  class="w-full border-round-xl p-button-primary"
                  :loading="loading"
                  @click="handleRegister"
                />

                <div class="text-center mt-3">
                  <span class="text-color-secondary">Уже есть аккаунт? </span>
                  <Button 
                    label="Войти" 
                    link
                    class="p-0 text-primary font-semibold"
                    @click="goToLogin"
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
import { useRouter } from 'vue-router'
import api from '../services/api'
import { ref, computed, onMounted } from 'vue'
import { ThemeManager } from '../utils/theme'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import InputMask from 'primevue/inputmask'
import { regionOptions } from '../data/regions'
import PhoneInput from '../components/PhoneInput.vue'

export default {
  name: 'Register',
  components: {
    PhoneInput,
    Card,
    InputText,
    Password,
    Button,
    Avatar,
    Dropdown,
    Message,
    InputMask
  },
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const errorMessage = ref('')
    
    const form = ref({
      full_name: '',
      phone: '',
      email: '',
      snils: '',
      category: null,
      region: regionOptions[0]?.value || '77',
      password: '',
      passwordConfirm: ''
    })
    
    const registerErrors = ref({
      phone: '',
      password: ''
    })

    const categories = ref([
      { label: 'Пенсионер', value: 'pensioner' },
      { label: 'Инвалид', value: 'disabled' },
      { label: 'Малоимущий', value: 'low_income' },
      { label: 'Ветеран', value: 'veteran' },
      { label: 'Многодетная семья', value: 'family' },
      { label: 'Студент', value: 'student' }
    ])

    const regions = ref(regionOptions)

    const normalizePhone = (value) => {
      if (!value) return ''
      const digits = value.replace(/\D/g, '')
      return digits
    }
    
    const validatePhone = (phone) => {
      if (!phone || phone.trim() === '') {
        return 'Введите номер телефона'
      }
      
      const digitsOnly = phone.replace(/\D/g, '')
      if (digitsOnly.length !== 11) {
        return 'Введите корректный номер телефона (11 цифр)'
      }
      
      return ''
    }
    
    const handlePhoneValidate = (error) => {
      registerErrors.value.phone = error
    }

    const handleRegister = async () => {
      registerErrors.value.phone = ''
      registerErrors.value.password = ''
      
      let hasErrors = false
      
      const phoneError = validatePhone(form.value.phone)
      if (phoneError) {
        registerErrors.value.phone = phoneError
        hasErrors = true
      }
      
     if (!form.value.password) {
        registerErrors.value.password = 'Введите пароль'
        hasErrors = true
      }
      
      if (!form.value.full_name || !form.value.passwordConfirm) {
        errorMessage.value = 'Заполните обязательные поля'
        hasErrors = true
      }

      if (form.value.password !== form.value.passwordConfirm) {
        errorMessage.value = 'Пароли не совпадают'
        hasErrors = true
      }
      
      if (hasErrors) return

      errorMessage.value = ''
      loading.value = true

      try {
        const normalizeSnils = (value) => {
          if (!value) return ''
          return value.replace(/\D/g, '')
        }

        const payload = {
          username: normalizePhone(form.value.phone),
          password: form.value.password,
          full_name: form.value.full_name,
          email: form.value.email,
          snils: normalizeSnils(form.value.snils) || null,
          category: form.value.category,
          region: form.value.region || regionOptions[0]?.value || '77'
        }

        sessionStorage.removeItem('user')
        sessionStorage.removeItem('accessToken')
        sessionStorage.removeItem('refreshToken')

        const { data } = await api.post('/register/', payload)

        sessionStorage.setItem('accessToken', data.access)
        sessionStorage.setItem('refreshToken', data.refresh)
        sessionStorage.setItem('user', JSON.stringify(data.user))

        router.push('/')
      } catch (error) {
        if (error.response?.status === 400) {
          const detail = Object.values(error.response.data)[0]
          errorMessage.value = Array.isArray(detail) ? detail[0] : detail
        } else {
          errorMessage.value = 'Не удалось создать аккаунт. Попробуйте позже.'
        }
      } finally {
        loading.value = false
      }
    }

    const goToLogin = () => {
      router.push('/login')
    }

    const currentTheme = ref(localStorage.getItem('app-theme') || 'light')
    
    const toggleTheme = () => {
      currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
      ThemeManager.setTheme(currentTheme.value)
      localStorage.setItem('app-theme', currentTheme.value)
    }

    const accessibilityModes = ref({
      highContrast: JSON.parse(localStorage.getItem('app-high-contrast') || 'false')
    })

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
      categories,
      regions,
      registerErrors,
      handleRegister,
      goToLogin,
      handlePhoneValidate,
      toggleTheme,
      themeIcon,
      themeTooltip,
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
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 2rem;
  padding-bottom: 2rem;
  min-height: 100vh;
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

:deep([data-theme="dark"] .register-container) {
  background: linear-gradient(135deg, #4a9e7a 0%, #5a7ca9 100%);
}

:deep([data-theme="dark"] .p-card) {
  background: rgba(30, 30, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.high-contrast .register-container) {
  background: #000000 !important;
}

:deep(.high-contrast .p-card) {
  background: #000000 !important;
  border: 2px solid #ffffff !important;
}
</style>