<template>
  <div class="voice-assistant">
    <transition name="assistant-mask">
      <div 
        v-if="panelVisible" 
        class="assistant-mask"
        @click="closePanel"
      ></div>
    </transition>

    <transition name="assistant-panel">
      <div v-if="panelVisible" class="assistant-panel surface-card shadow-4 border-round-2xl">
        <div class="assistant-header flex justify-content-between align-items-center p-4 pb-3 surface-border">
          <div class="flex align-items-center gap-3">
            <div class="assistant-avatar flex align-items-center justify-content-center border-circle">
              <i class="pi pi-microphone"></i>
            </div>
            <div>
              <h3 class="m-0 text-lg font-bold text-primary">Голосовой помощник</h3>
            </div>
          </div>
          <Button 
            icon="pi pi-times" 
            @click="closePanel" 
            text 
            rounded 
            class="p-button-text p-button-plain text-color-secondary"
          />
        </div>

        <div class="assistant-body p-4 pt-1">
          <div v-if="!isAuthenticated" class="auth-required-section text-center py-4">
            <i class="pi pi-lock text-6xl m-4 text-primary"></i>
            <h4 class="text-lg font-bold text-primary mb-2">Требуется авторизация</h4>
            <p class="text-color-secondary mb-4">
              Чтобы пользоваться голосовым помощником, войдите в приложение
            </p>
            <Button 
              label="Войти в приложение" 
              icon="pi pi-sign-in"
              @click="navigateToLogin"
              class="p-button-primary"
            />
          </div>

          <template v-else>
            <Message
              v-if="!isSupported"
              severity="warn"
              :closable="false"
              class="mb-4"
            >
              Ваш браузер не поддерживает распознавание речи. Попробуйте Chrome.
            </Message>

            <template v-else>
              <div class="status-indicator flex align-items-center gap-3 mb-4 p-3 surface-border border-round-2xl" 
                   :class="{ 'listening': listening }">
                <div class="status-dot" :class="{ 'pulse': listening }"></div>
                <div class="flex flex-column">
                  <span class="font-medium text-sm text-primary">{{ statusText }}</span>
                  <small class="text-color-secondary text-sm text-primary">
                    {{ listening ? 'Говорите сейчас' : 'Нажмите кнопку ниже' }}
                  </small>
                </div>
              </div>

              <Card class="mb-4 shadow-1">
                <template #content>
                  <div class="flex flex-column gap-2">
                    <label class="text-sm text-color-secondary font-medium">Помощник:</label>
                    <p class="m-0 text-color-secondary" :class="{ 'text-primary': lastResponse }">
                      {{ lastResponse || 'Могу помочь найти льготы, открыть разделы приложения или рассказать о возможностях.' }}
                    </p>
                  </div>
                </template>
              </Card>

              <div class="examples-section">
                <h4 class="text-sm text-color-secondary font-medium mb-3">Попробуйте сказать:</h4>
                  <div 
                    v-for="example in examples" 
                    :key="example"
                    class="p-1"
                  >
                    <Button
                      :label="example"
                      @click="speakExample(example)"
                      class="p-button-outlined p-button-sm w-full text-sm border-round-xl"
                    />
                  </div>
              </div>
            </template>
          </template>
        </div>

        <div class="assistant-footer p-4 surface-border" v-if="isAuthenticated && isSupported">
          <div class="flex gap-2 justify-content-between grid">
            <Button
              icon="pi pi-question-circle"
              @click="explainCapabilities"
              class="p-button-outlined p-button-sm border-round-2xl"
            />
            <Button
              :label="listening ? 'Остановить' : 'Говорить'"
              :icon="listening ? 'pi pi-stop-circle' : 'pi pi-microphone'"
              :severity="listening ? 'secondary' : 'primary'"
              @click="toggleListening"
              :disabled="!isSupported"
              class="p-button-sm border-round-2xl flex-1"
              :class="{ 'p-button-primary': !listening, 'p-button-outlined': listening }"
            />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Card from 'primevue/card'

export default {
  name: 'VoiceAssistant',
  components: {
    Button,
    Message,
    Card
  },
  setup() {
    const router = useRouter()
    const panelVisible = ref(false)
    const listening = ref(false)
    const lastCommand = ref('')
    const lastResponse = ref('')
    const error = ref(null)
    const examples = ref([
      'Найди льготы на транспорт',
      'Покажи мои льготы',
      'Открой профиль',
      'Ищи медицинские льготы',
    ])

    const isAuthenticated = computed(() => {
      return Boolean(localStorage.getItem('accessToken'))
    })

    let recognition = null
    const SpeechRecognition = typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null
    const isSupported = Boolean(SpeechRecognition)

    const initRecognition = () => {
      if (!SpeechRecognition) return
      recognition = new SpeechRecognition()
      recognition.lang = 'ru-RU'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        listening.value = true
        error.value = null
      }

      recognition.onend = () => {
        listening.value = false
      }

      recognition.onerror = (event) => {
        error.value = event.error
        listening.value = false
        if (event.error !== 'aborted') {
          setResponse('Произошла ошибка распознавания. Попробуйте ещё раз.')
        }
      }

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript.trim()
        lastCommand.value = text
        processCommand(text.toLowerCase())
      }
    }

    const statusText = computed(() => {
      if (!isSupported) return 'Не поддерживается'
      if (listening.value) return 'Слушаю команду'
      return 'Готова к работе'
    })

    const speak = (text) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ru-RU'
      utterance.rate = 0.9
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    }

    const setResponse = (text) => {
      lastResponse.value = text
      speak(text)
    }

    const toggleListening = () => {
      if (!isAuthenticated.value) {
        setResponse('Для использования голосового помощника необходимо войти в приложение.')
        return
      }

      if (!isSupported) {
        setResponse('К сожалению, ваш браузер не поддерживает голосовые команды.')
        return
      }
      
      if (!panelVisible.value) {
        panelVisible.value = true
      }
      
      if (!recognition) {
        initRecognition()
      }
      
      if (listening.value) {
        recognition.stop()
        setResponse('Остановил прослушивание.')
      } else {
        try {
          recognition.start()
          lastCommand.value = ''
          lastResponse.value = 'Слушаю вашу команду...'
        } catch (e) {
          console.error('Recognition start error:', e)
        }
      }
    }

    const closePanel = () => {
      panelVisible.value = false
      if (listening.value && recognition) {
        recognition.stop()
      }
    }

    const navigateToLogin = () => {
      closePanel()
      router.push('/login')
    }

    const lockBodyScroll = () => {
      document.body.classList.add('assistant-open');
    }

    const unlockBodyScroll = () => {
      document.body.classList.remove('assistant-open');
    }

    watch(panelVisible, (visible) => {
      if (visible) {
        lockBodyScroll()
      } else {
        unlockBodyScroll()
      }
    })

    const dispatchSearch = (query) => {
      if (typeof window === 'undefined') return
      window.dispatchEvent(
        new CustomEvent('voice-search', { detail: { query } })
      )
    }

    const dispatchFilter = (filterType, filterValue) => {
      if (typeof window === 'undefined') return
      window.dispatchEvent(
        new CustomEvent('voice-filter', { detail: { type: filterType, value: filterValue } })
      )
    }

    const dispatchAction = (actionType, actionData = {}) => {
      if (typeof window === 'undefined') return
      window.dispatchEvent(
        new CustomEvent('voice-action', { detail: { type: actionType, ...actionData } })
      )
    }

    const speakExample = (example) => {
      lastCommand.value = example
      processCommand(example.toLowerCase())
    }

    const processCommand = (text) => {
      if (!text) {
        setResponse('Не расслышал запрос. Повторите, пожалуйста.')
        return
      }

      if (text.includes('останови') || text.includes('хватит')) {
        if (recognition && listening.value) recognition.stop()
        setResponse('Хорошо, прекращаю слушать.')
        return
      }

      const navCommands = [
        {
          keywords: ['профиль', 'мой профиль', 'страница профиля'],
          action: () => navigateTo('/profile', 'Открываю ваш профиль.')
        },
        {
          keywords: ['главн', 'домой', 'домашнюю', 'домашняя', 'на главную', 'главная страница'],
          action: () => navigateTo('/', 'Возвращаю на главную страницу.')
        },
        {
          keywords: ['мои льготы', 'мои льгот', 'мои заявки', 'заявки'],
          action: () => navigateTo('/my-benefits', 'Показываю ваши льготы.')
        },
        {
          keywords: ['настройк', 'настройки', 'параметры'],
          action: () => navigateTo('/settings', 'Открываю настройки профиля.')
        },
        {
          keywords: ['войти', 'логин', 'авторизация', 'авторизоваться'],
          action: () => navigateTo('/login', 'Перехожу на страницу входа.')
        },
        {
          keywords: ['регистрация', 'зарегистрироваться', 'создать аккаунт'],
          action: () => navigateTo('/register', 'Перехожу на страницу регистрации.')
        },
        {
          keywords: ['выйти', 'выход', 'разлогиниться', 'выйти из аккаунта'],
          action: () => {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            navigateTo('/', 'Вы вышли из аккаунта. Возвращаю на главную страницу.')
          }
        }
      ]

      const matchedNav = navCommands.find(({ keywords }) =>
        keywords.some((keyword) => text.includes(keyword))
      )

      if (matchedNav) {
        matchedNav.action()
        return
      }

      const categoryCommands = [
        { keywords: ['медицин', 'медицина', 'лекарств', 'здоровье'], value: 'medicine', label: 'медицина' },
        { keywords: ['транспорт', 'проезд', 'проездной'], value: 'transport', label: 'транспорт' },
        { keywords: ['жкх', 'коммунал', 'коммунальные', 'жилье', 'жилищн'], value: 'housing', label: 'ЖКХ' },
        { keywords: ['образован', 'учеба', 'школа', 'университет'], value: 'education', label: 'образование' },
        { keywords: ['налог', 'налогов'], value: 'tax', label: 'налоги' },
        { keywords: ['культур', 'досуг', 'развлечен'], value: 'culture', label: 'культура' },
        { keywords: ['спорт', 'спортивн'], value: 'sport', label: 'спорт' },
        { keywords: ['детск', 'дети', 'ребенок'], value: 'childcare', label: 'детские программы' },
        { keywords: ['связь', 'интернет', 'телефон'], value: 'communication', label: 'связь и интернет' },
        { keywords: ['работ', 'занятость', 'трудоустройство'], value: 'employment', label: 'занятость' },
        { keywords: ['социальн', 'соцподдержка', 'социальная поддержка'], value: 'social_support', label: 'социальная поддержка' }
      ]

      const matchedCategory = categoryCommands.find(({ keywords }) =>
        keywords.some((keyword) => text.includes(keyword))
      )

      if (matchedCategory) {
        dispatchFilter('category', matchedCategory.value)
        setResponse(`Применяю фильтр по категории «${matchedCategory.label}».`)
        return
      }

      const typeCommands = [
        { keywords: ['федеральн', 'федеральные'], value: 'federal', label: 'федеральные' },
        { keywords: ['региональн', 'региональные'], value: 'regional', label: 'региональные' },
        { keywords: ['муниципальн', 'муниципальные', 'местные'], value: 'municipal', label: 'муниципальные' },
        { keywords: ['коммерческ', 'коммерческие', 'частные'], value: 'commercial', label: 'коммерческие' }
      ]

      const matchedType = typeCommands.find(({ keywords }) =>
        keywords.some((keyword) => text.includes(keyword))
      )

      if (matchedType) {
        dispatchFilter('type', matchedType.value)
        setResponse(`Применяю фильтр по типу «${matchedType.label} льготы».`)
        return
      }

      if (text.includes('доступн') && (text.includes('мне') || text.includes('для меня'))) {
        dispatchAction('toggle-filter', { filter: 'availableForMe', value: true })
        setResponse('Показываю только льготы, доступные вам.')
        return
      }

      if (text.includes('неполучен') || text.includes('не получен')) {
        dispatchAction('toggle-filter', { filter: 'notReceived', value: true })
        setResponse('Показываю только неполученные льготы.')
        return
      }

      if (text.includes('сброс фильтр') || text.includes('убрать фильтр') || text.includes('очистить фильтр')) {
        dispatchAction('clear-filters')
        setResponse('Сбрасываю все фильтры.')
        return
      }

      const searchMatch = text.match(/(?:найди|поиск|искать|покажи|поискай|поищи|найти)\s+(.+)/)
      if (searchMatch) {
        const query = searchMatch[1].trim()
        if (query) {
          dispatchSearch(query)
          setResponse(`Ищу льготы по запросу «${query}».`)
        } else {
          setResponse('Не удалось распознать запрос для поиска.')
        }
        return
      }

      if (text.includes('очист') || text.includes('сброс') || text.includes('очистить поиск')) {
        dispatchSearch('')
        setResponse('Очищаю поисковый запрос.')
        return
      }

      if ((text.includes('что') && text.includes('умеешь')) || 
          (text.includes('помощь') && text.includes('команды')) ||
          text.includes('что ты можешь') ||
          text.includes('какие команды')) {
        explainCapabilities()
        return
      }

      if (text.includes('фильтр') || text.includes('открыть фильтр')) {
        dispatchAction('open-filters')
        setResponse('Открываю панель фильтров.')
        return
      }

      if (text.includes('закрыть фильтр') || text.includes('убрать фильтр')) {
        dispatchAction('close-filters')
        setResponse('Закрываю панель фильтров.')
        return
      }

      setResponse('Пока не знаю, как выполнить эту команду. Попробуйте поиск льгот, фильтрацию по категориям или навигацию по разделам.')
    }

    const navigateTo = (path, response) => {
      router.push(path)
      setResponse(response)
    }

    const explainCapabilities = () => {
      const message = `Я могу помочь вам:
      • Найти льготы по названию или категории,
      • Открыть различные разделы,
      • Работать с фильтрами,
      • Очистить поиск или сбросить фильтры
      Просто скажите что вам нужно!`
      setResponse(message)
    }

     const handleExternalActivation = () => {
      if (!isAuthenticated.value) {
        panelVisible.value = true
        setResponse('Для использования голосового помощника необходимо войти в приложение.')
        return
      }
      
      panelVisible.value = true
      if (!listening.value) {
        toggleListening()
      }
    }

    onMounted(() => {
      if (typeof window !== 'undefined') {
        window.addEventListener('voice-assistant-activate', handleExternalActivation)
      }
    })

    onUnmounted(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('voice-assistant-activate', handleExternalActivation)
      }
      if (recognition) {
        recognition.stop()
      }
      unlockBodyScroll()
    })

    return {
      panelVisible,
      listening,
      isSupported,
      isAuthenticated,
      lastCommand,
      lastResponse,
      examples,
      statusText,
      toggleListening,
      closePanel,
      explainCapabilities,
      speakExample,
      navigateToLogin
    }
  }
}
</script>

<style scoped>
.voice-assistant {
  position: fixed;
  right: 1rem;
  bottom: 6rem;
  z-index: 1100;
}

.assistant-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1099;
}

.assistant-panel {
  width: 380px;
  max-width: 90vw;
  background: #ffffff !important;
  border: 1px solid var(--surface-border);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1100;
  position: relative;
}

.status-indicator {
  background: var(--surface-ground);
  transition: all 0.3s ease;
}

.status-indicator.listening {
  border-color: var(--primary-200);
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--green-500);
  transition: all 0.3s ease;
}

.status-dot.pulse {
  animation: pulse 1.5s infinite;
  background: var(--primary-color);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.examples-section {
  margin-top: 1rem;
}

.assistant-mask-enter-active,
.assistant-mask-leave-active {
  transition: opacity 0.3s ease;
}

.assistant-mask-enter-from,
.assistant-mask-leave-to {
  opacity: 0;
}

.assistant-panel-enter-active,
.assistant-panel-leave-active {
  transition: all 0.3s ease;
}

.assistant-panel-enter-from,
.assistant-panel-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@media (max-width: 768px) {
  .voice-assistant {
    bottom: 5.5rem;
    right: 0.5rem;
    left: 0.5rem;
  }
  
  .assistant-panel {
    width: auto;
    max-width: none;
  }
}

.auth-required-section {
  border: 2px dashed var(--surface-border);
  border-radius: 1rem;
  background: var(--surface-ground);
}

/* :deep(.p-card) {
  background: var(--surface-card);
}

:deep(.p-card-content) {
  padding: 1rem;
} */

</style>