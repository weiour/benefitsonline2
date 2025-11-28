<template>
  <div class="mascot-assistant">
    <div 
      v-if="showMascot && !menuOpen && !showTutorial" 
      class="mascot-main"
      :class="{ 
        'mascot-visible': isVisible, 
        'mascot-hidden': !isVisible,
        'mascot-idle': showIdleState,
        'mascot-leaving': isLeaving
      }"
      @click="openMenu"
    >
      <img 
        v-if="!showIdleState && !isLeaving"
        src="/assets/mascot-wave.gif" 
        alt="Совёнок Тим"
        class="mascot-image"
        @load="handleGifLoad"
      />
      <img 
        v-else-if="showIdleState && !isLeaving"
        src="/assets/mascot-idle.png" 
        alt="Совёнок Тим"
        class="mascot-image idle-image"
      />
      <img 
        v-else-if="isLeaving"
        src="/assets/mascot-leave.gif" 
        alt="Совёнок Тим уходит"
        class="mascot-image leave-image"
        @load="handleLeaveGifLoad"
      />
    </div>

    <!-- <div 
      v-if="showDialog && !menuOpen && !showTutorial" 
      class="comic-dialog"
      :class="{ 'comic-dialog-visible': showDialog }"
    >
      <div class="comic-bubble">
        <div class="comic-tail"></div>
        <div class="comic-content">
          <p class="comic-text">Нужна помощь?</p>
          <div class="comic-buttons">
            <button 
              @click="openMenuFromDialog"
              class="comic-btn comic-btn-yes"
            >
              Да
            </button>
            <button 
              @click="closeDialog"
              class="comic-btn comic-btn-no"
            >
              Нет
            </button>
          </div>
        </div>
      </div>
    </div> -->

    <Dialog 
      v-model:visible="menuOpen" 
      :modal="true"
      :closable="false"
      :dismissableMask="true"
      class="mascot-menu"
      position="bottom"
    >
      <template #header>
        <div class="flex justify-content-between align-items-center w-full">
          <div class="flex align-items-center gap-2">
            <h3 class="m-0">Совёнок Тим</h3>
          </div>
          <Button 
            icon="pi pi-times" 
            @click="closeMenu"
            class="p-button-text"
          />
        </div>
      </template>
      <div class="flex justify-content-center">
        <img 
          src="/assets/mascot-menu-header.png" 
          class="menu-header-image"
        />
      </div>

      <div class="flex flex-column gap-2">
        <Button 
          label="Обучение" 
          icon="pi pi-graduation-cap"
          @click="openTutorial"
          class="p-button-text p-button-plain justify-start p-3 menu-item"
        />
        
        <Button 
          label="Голосовой помощник" 
          icon="pi pi-microphone"
          @click="openVoiceAssistant"
          class="p-button-text p-button-plain justify-start p-3 menu-item"
        />

        <Button 
          label="Описание контента на экране" 
          icon="pi pi-info-circle"
          @click="describeContent"
          class="p-button-text p-button-plain justify-start p-3 menu-item"
        />

        <Button 
          label="Открыть настройки" 
          icon="pi pi-cog"
          @click="openSettings"
          class="p-button-text p-button-plain justify-start p-3 menu-item"
        />

        <Button 
          label="Спасибо, на этом всё" 
          icon="pi pi-check"
          @click="closeMascot"
          class="p-button-text p-button-plain justify-start p-3 menu-item close-btn p-button p-button-primary p-button-outlined p-button-sm"
        />
      </div>
    </Dialog>

    <TutorialOverlay 
      :is-active="showTutorial"
      @complete="completeTutorial"
      @skip="skipTutorial"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import TutorialOverlay from './TutorialOverlay.vue'

export default {
  name: 'MascotAssistant',
  components: {
    Dialog,
    Button,
    TutorialOverlay
  },
  setup() {
    const router = useRouter()
    
    const showMascot = ref(false)
    const isVisible = ref(false)
    const showDialog = ref(false)
    const menuOpen = ref(false)
    const showIdleState = ref(false)
    const showTutorial = ref(false)
    const isLeaving = ref(false)
    
    let appearanceTimer
    let dialogTimer
    let gifTimer
    let leaveTimer

    const checkTutorialStatus = () => {
      return localStorage.getItem('tutorialCompleted') === 'true'
    }

    const showMascotAfterDelay = () => {
      appearanceTimer = setTimeout(() => {
        showMascot.value = true
        setTimeout(() => {
          isVisible.value = true
          if (!checkTutorialStatus()) {
            dialogTimer = setTimeout(() => {
              showDialog.value = true
            }, 1000)
          }
        }, 100)
      }, 3000)
    }

    const openTutorial = () => {
      menuOpen.value = false
      showTutorial.value = true
    }

    const completeTutorial = () => {
      showTutorial.value = false
    }

    const skipTutorial = () => {
      showTutorial.value = false
    }

    const handleGifLoad = () => {
      gifTimer = setTimeout(() => {
        showIdleState.value = true
      }, 1800)
    }

    const openMenu = () => {
      menuOpen.value = true
      showDialog.value = false
    }

    const openMenuFromDialog = () => {
      showDialog.value = false
      showIdleState.value = true
      setTimeout(() => {
        menuOpen.value = true
      }, 300)
    }

    const closeMenu = () => {
      menuOpen.value = false
      setTimeout(() => {
        isVisible.value = true
        showMascot.value = true
      }, 300)
    }

    const closeDialog = () => {
      showDialog.value = false
      setTimeout(() => {
        isVisible.value = false
        setTimeout(() => {
          showMascot.value = false
        }, 500)
      }, 300)
    }

    const openSettings = () => {
      menuOpen.value = false
      router.push('/settings')
    }

    const describeContent = () => {
      menuOpen.value = false
      const currentRoute = router.currentRoute.value.path
      let description = ''
      
      switch(currentRoute) {
        case '/':
          description = 'Главная страница со списком льгот. Здесь вы можете искать и фильтровать доступные льготы.'
          break
        case '/profile':
          description = 'Страница вашего профиля. Здесь отображается ваша информация и статистика по льготам.'
          break
        case '/my-benefits':
          description = 'Страница "Мои льготы". Здесь отображаются льготы, которые вы уже оформили.'
          break
        case '/settings':
          description = 'Настройки приложения. Здесь вы можете настроить тему, доступность и другие параметры.'
          break
        default:
          description = 'Текущая страница приложения "Льготы Онлайн".'
      }
      
      alert(description)
    }

    const openVoiceAssistant = () => {
      menuOpen.value = false
      window.dispatchEvent(new Event('voice-assistant-activate'))
    }

    const resetMascot = () => {
      clearTimeout(appearanceTimer)
      clearTimeout(dialogTimer)
      clearTimeout(gifTimer)
      showMascot.value = false
      isVisible.value = false
      showDialog.value = false
      menuOpen.value = false
      showIdleState.value = false
      
      setTimeout(showMascotAfterDelay, 1000)
    }

    const closeMascot = () => {
      menuOpen.value = false
      isLeaving.value = true
      leaveTimer = setTimeout(() => {
        showMascot.value = false
        isLeaving.value = false
        showDialog.value = false
        isVisible.value = false
        
        localStorage.setItem('mascotClosed', 'true')
      }, 900)
    }

    onMounted(() => {
      showMascotAfterDelay()
      
      const unwatch = router.afterEach(() => {
        resetMascot()
      })
    })

    onUnmounted(() => {
      clearTimeout(appearanceTimer)
      clearTimeout(dialogTimer)
      clearTimeout(gifTimer)
    })

    return {
      showMascot,
      isVisible,
      showDialog,
      menuOpen,
      showIdleState,
      showTutorial,
      isLeaving,
      openMenu,
      openMenuFromDialog,
      closeMenu,
      closeDialog,
      openSettings,
      openTutorial,
      describeContent,
      openVoiceAssistant,
      handleGifLoad,
      completeTutorial,
      skipTutorial,
      closeMascot
    }
  }
}
</script>

<style scoped>
.mascot-assistant {
  position: fixed;
  bottom: 100px;
  right: 0px;
  z-index: 9998;
}

.mascot-main {
  position: fixed;
  bottom: 100px;
  right: 0px;
  width: 110px;
  height: 110px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 9999;
}

.mascot-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.idle-image {
  animation: breath 3s ease-in-out infinite;
}

.mascot-visible {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.mascot-hidden {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.mascot-idle {
  cursor: pointer;
}

.menu-header-image {
  width: 180px;
  height: 180px;
  object-fit: contain;
}

.menu-item {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background-color: var(--surface-hover) !important;
  transform: translateX(5px);
}

@keyframes breath {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.mascot-main:hover {
  animation: pulse 1s infinite;
}

[data-theme="dark"] .mascot-image {
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
}

[data-theme="dark"] .comic-bubble {
  background: var(--surface-card);
  border-color: var(--surface-border);
}

[data-theme="dark"] .comic-tail {
  border-top-color: var(--surface-border);
}

[data-theme="dark"] .comic-tail::after {
  border-top-color: var(--surface-card);
}

[data-theme="dark"] .comic-text {
  color: var(--text-color);
}

html[data-accessibility~="highContrast"] .mascot-image {
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.8)) contrast(200%);
  border: 2px solid var(--surface-border);
  border-radius: 50%;
}

html[data-accessibility~="highContrast"] .comic-bubble {
  border-width: 4px;
  border-color: var(--surface-border);
  background: var(--surface-card);
}

html[data-accessibility~="highContrast"] .comic-tail {
  border-top-color: var(--surface-border);
}

html[data-accessibility~="highContrast"] .comic-tail::after {
  border-top-color: var(--surface-card);
}

@media (max-height: 600px) {
  .mascot-main {
    bottom: 70px;
    width: 70px;
    height: 70px;
  }
  
  .comic-dialog {
    bottom: 160px;
  }
}

.mascot-main,
.mascot-image,
.menu-item,
.comic-dialog {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
[file content end]