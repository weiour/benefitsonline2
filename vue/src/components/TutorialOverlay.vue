<template>
  <div v-if="isActive" class="tutorial-overlay">
    <div class="tutorial-backdrop"></div>
    
    <div 
      v-if="currentStep.highlightElement && currentStep.isElementReady"
      class="highlighted-element"
      :style="currentStep.highlightStyle"
    ></div>
    
    <div 
      class="tutorial-tooltip" 
      :class="[currentStep.position, currentStep.tooltipClass]"
      :style="currentStep.style"
      ref="tooltipRef"
    >
      <div class="tooltip-content">
        <div class="tooltip-header">
          <span class="step-counter">Шаг {{ currentStepNumber }} из {{ totalSteps }}</span>
          <Button 
            icon="pi pi-times" 
            @click="skipTutorial"
            class="p-button-text p-button-plain close-tutorial-btn"
          />
        </div>
        
        <p class="tooltip-text">{{ currentStep.text }}</p>
        
        <div class="tooltip-footer">
          <Button 
            v-if="currentStepNumber > 1"
            label="Назад" 
            @click="prevStep"
            class="p-button-text p-button-sm"
          />
          
          <div class="flex gap-2">
            <Button 
              v-if="currentStepNumber < totalSteps"
              :label="currentStep.buttonText || 'Понятно'"
              @click="nextStep"
              class="p-button-primary p-button-sm"
            />
            <Button 
              v-else
              label="Начать поиск льгот!" 
              @click="completeTutorial"
              class="p-button-primary p-button-sm"
            />
          </div>
        </div>
      </div>
      
      <div class="tooltip-arrow" :class="currentStep.arrowDirection"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import Button from 'primevue/button'

export default {
  name: 'TutorialOverlay',
  components: {
    Button
  },
  props: {
    isActive: {
      type: Boolean,
      default: false
    }
  },
  emits: ['complete', 'skip'],
  setup(props, { emit }) {
    const currentStepNumber = ref(1)
    const tooltipRef = ref(null)
    const isElementReady = ref(false)
    
    const tutorialSteps = [
      {
        id: 1,
        text: 'Добро пожаловать в приложение "Льготы Онлайн"! Я помогу вам быстро разобраться, как найти подходящие льготы.',
        position: 'center',
        buttonText: 'Начать обучение'
      },
      {
        id: 2,
        text: 'Здесь вы можете искать льготы по ключевым словам. Просто введите то, что ищете!',
        position: 'bottom',
        target: '#search-benefits',
        highlightElement: true,
        arrowDirection: 'bottom',
        requiresPreparation: false
      },
      {
        id: 3,
        text: 'Это фильтры - здесь можно настроить поиск именно под ваши нужды. Рекомендую ими пользоваться!',
        position: 'bottom',
        target: '.mobile-filter-btn',
        highlightElement: true,
        arrowDirection: 'bottom',
        requiresPreparation: false
      },
      {
        id: 4,
        text: 'В приложении есть два типа льгот: специальные предложения от магазинов и государственные льготы. Смотрите оба раздела!',
        position: 'bottom',
        target: '.tab-btn2',
        highlightElement: true,
        arrowDirection: 'bottom',
        requiresPreparation: false,
        action: () => {
          const sponsoredTab = document.querySelector('.tab-btn:first-child')
          if (sponsoredTab && !sponsoredTab.classList.contains('active')) {
            sponsoredTab.click()
          }
        }
      },
      {
        id: 5,
        text: 'Это партнерские предложения - скидки и акции от магазинов специально для льготников. Они обновляются регулярно!',
        position: 'top',
        target: '.partner-offer-card:first-child',
        highlightElement: true,
        arrowDirection: 'top',
        requiresPreparation: true
      },
      {
        id: 6,
        text: 'А это государственные льготы - то, что положено вам по закону. Нажмите на любую карточку для подробностей.',
        position: 'top',
        target: '.benefit-card:first-child',
        highlightElement: true,
        arrowDirection: 'top',
        requiresPreparation: true,
        action: () => {
          const regularTab = document.querySelector('.tab-btn:last-child')
          if (regularTab && !regularTab.classList.contains('active')) {
            regularTab.click()
          }
        }
      },
      {
        id: 7,
        text: 'Внизу экрана находится навигация. Здесь вы можете перейти в профиль, настройки и другие разделы приложения.',
        position: 'top',
        target: '.app-footer',
        highlightElement: true,
        arrowDirection: 'top',
        requiresPreparation: false
      },
      {
        id: 8,
        text: 'Поздравляю! Теперь вы знаете все основы приложения. Не забывайте проверять оба раздела льгот!',
        position: 'center',
        buttonText: 'Начать поиск льгот!'
      }
    ]

    const totalSteps = computed(() => tutorialSteps.length)

    const executeStepAction = async (step) => {
      if (step.action) {
        await new Promise(resolve => setTimeout(resolve, 300))
        await step.action()
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    const prepareElement = async (step) => {
      isElementReady.value = false
      
      await executeStepAction(step)
      
      if (step?.target) {
        let element = document.querySelector(step.target)
        
        if (!element) {
          await new Promise(resolve => setTimeout(resolve, 300))
          element = document.querySelector(step.target)
        }
        
        if (element) {
          if (step.requiresPreparation) {
            await scrollToElement(element)
          }
          
          isElementReady.value = true
        } else {
          console.warn(`Элемент не найден: ${step.target}`)
          isElementReady.value = false
        }
      } else {
        isElementReady.value = true
      }
    }

    const scrollToElement = async (element) => {
      if (element) {
        const rect = element.getBoundingClientRect()
        const isElementVisible = (
          rect.top >= 100 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight - 150) &&
          rect.right <= window.innerWidth
        )
        
        if (!isElementVisible) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          })
          
          await new Promise(resolve => setTimeout(resolve, 400))
        }
      }
    }

    const getElementPosition = (element) => {
      if (!element) return null
      
      const rect = element.getBoundingClientRect()
      return {
        top: rect.top + window.pageYOffset,
        left: rect.left + window.pageXOffset,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom + window.pageYOffset,
        right: rect.right + window.pageXOffset
      }
    }

    const updatePositions = () => {
      if (currentStep.value?.target && isElementReady.value) {
        const element = document.querySelector(currentStep.value.target)
        if (element) {
          const rect = getElementPosition(element)
          if (rect) {
            if (tooltipRef.value) {
              const tooltipRect = tooltipRef.value.getBoundingClientRect()
              const viewportHeight = window.innerHeight
              
              let topPosition
              if (currentStep.value.position === 'top') {
                topPosition = Math.max(20, rect.top - tooltipRect.height - 20)
              } else if (currentStep.value.position === 'bottom') {
                topPosition = Math.min(viewportHeight - tooltipRect.height - 20, rect.bottom + 20)
              }
              
              tooltipRef.value.style.left = `${rect.left + rect.width / 2}px`
              tooltipRef.value.style.top = `${topPosition}px`
            }
          }
        }
      }
    }

    const currentStep = computed(() => {
      const step = tutorialSteps.find(s => s.id === currentStepNumber.value)
      
      if (step?.target) {
        const element = document.querySelector(step.target)
        if (element && isElementReady.value) {
          const rect = getElementPosition(element)
          
          if (rect) {
            let topPosition
            let leftPosition = rect.left + rect.width / 2
            
            if (step.position === 'top') {
              topPosition = Math.max(100, rect.top - 200)
            } else if (step.position === 'bottom') {
              topPosition = Math.min(window.innerHeight - 250, rect.bottom + 20)
            } else {
              topPosition = rect.top + rect.height / 2
            }
            
            leftPosition = Math.max(200, Math.min(window.innerWidth - 200, leftPosition))
            
            return {
              ...step,
              style: {
                left: `${leftPosition}px`,
                top: `${topPosition}px`,
                transform: 'translateX(-50%)'
              },
              highlightStyle: {
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                left: `${rect.left}px`,
                top: `${rect.top}px`
              },
              isElementReady: isElementReady.value
            }
          }
        }
        
        return {
          ...step,
          isElementReady: false
        }
      }
      
      if (step?.position === 'center') {
        return {
          ...step,
          style: {
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          },
          isElementReady: true
        }
      }
      
      return {
        ...step,
        isElementReady: true
      }
    })

    const nextStep = async () => {
      if (currentStepNumber.value < totalSteps.value) {
        currentStepNumber.value++
        
        const step = tutorialSteps.find(s => s.id === currentStepNumber.value)
        if (step) {
          await prepareElement(step)
        }
        
        nextTick(() => {
          updatePositions()
        })
      } else {
        completeTutorial()
      }
    }

    const prevStep = async () => {
      if (currentStepNumber.value > 1) {
        currentStepNumber.value--
        
        const step = tutorialSteps.find(s => s.id === currentStepNumber.value)
        if (step) {
          await prepareElement(step)
        }
        
        nextTick(() => {
          updatePositions()
        })
      }
    }

    const completeTutorial = () => {
      localStorage.setItem('tutorialCompleted', 'true')
      emit('complete')
    }

    const skipTutorial = () => {
      emit('skip')
    }

    const setupScrollListener = () => {
      window.addEventListener('scroll', updatePositions, { passive: true })
      window.addEventListener('resize', updatePositions, { passive: true })
    }

    const removeScrollListener = () => {
      window.removeEventListener('scroll', updatePositions)
      window.removeEventListener('resize', updatePositions)
    }

    const lockScroll = () => {
      document.body.classList.add('tutorial-active')
      setupScrollListener()
    }

    const unlockScroll = () => {
      document.body.classList.remove('tutorial-active')
      removeScrollListener()
    }

    onMounted(() => {
      if (props.isActive) {
        lockScroll()
        const firstStep = tutorialSteps.find(s => s.id === currentStepNumber.value)
        if (firstStep) {
          prepareElement(firstStep)
        }
      }
    })

    onUnmounted(() => {
      unlockScroll()
    })

    watch(() => props.isActive, (newVal) => {
      if (newVal) {
        lockScroll()
        const firstStep = tutorialSteps.find(s => s.id === currentStepNumber.value)
        if (firstStep) {
          prepareElement(firstStep)
        }
      } else {
        unlockScroll()
      }
    })

    return {
      currentStepNumber,
      totalSteps,
      currentStep,
      tooltipRef,
      nextStep,
      prevStep,
      completeTutorial,
      skipTutorial
    }
  }
}
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
}

.tutorial-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.highlighted-element {
  position: fixed;
  border: 4px solid #2E8B95;
  border-radius: 16px;
  z-index: 2;
  animation: pulseHighlight 2s infinite;
  pointer-events: none;
  transition: all 0.3s ease-in-out;
  box-shadow: 
    inset 0 0 20px rgba(46, 139, 149, 0.2),
    0 0 30px rgba(46, 139, 149, 0.4);
  background: transparent !important;
}

.tutorial-tooltip {
  position: fixed;
  background: white;
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  min-width: 350px;
  z-index: 3;
  animation: tooltipAppear 0.3s ease-out;
  word-wrap: break-word;
}

.tooltip-content {
  padding: 1.5rem;
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.step-counter {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  font-weight: 600;
}

.close-tutorial-btn {
  width: 2rem;
  height: 2rem;
}

.tooltip-text {
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-color);
  word-break: break-word;
  overflow-wrap: break-word;
}

.tooltip-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}

.tooltip-arrow.bottom {
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 10px 10px 10px;
  border-color: transparent transparent white transparent;
}

.tooltip-arrow.top {
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 10px 10px 0 10px;
  border-color: white transparent transparent transparent;
}

.tutorial-tooltip.center {
  left: 45% !important;
  top: 50% !important;
  transform: translate(-50%, -50%) !important;
}

.tutorial-tooltip.top,
.tutorial-tooltip.bottom {
  transform: translateX(-50%) !important;
}

@keyframes tooltipAppear {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulseHighlight {
  0%, 100% {
    border-color: #2E8B95;
    box-shadow: 
      inset 0 0 20px rgba(46, 139, 149, 0.2),
      0 0 30px rgba(46, 139, 149, 0.4);
    transform: scale(1);
  }
  50% {
    border-color: #4db5c0;
    box-shadow: 
      inset 0 0 30px rgba(77, 181, 192, 0.3),
      0 0 40px rgba(77, 181, 192, 0.6);
    transform: scale(1.01);
  }
}

@media (max-width: 480px) {
  .tutorial-tooltip {
    max-width: 90vw !important;
    min-width: 85vw !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    margin: 0 5%;
  }
  
  .tooltip-content {
    padding: 1.25rem;
  }
  
  .tooltip-text {
    font-size: 0.95rem;
  }
}

@media (max-width: 768px) {
  .tutorial-tooltip {
    max-width: 85vw;
    min-width: 80vw;
  }
}

[data-theme="dark"] .tutorial-tooltip {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
}

[data-theme="dark"] .tooltip-arrow.bottom {
  border-color: transparent transparent var(--surface-card) transparent;
}

[data-theme="dark"] .tooltip-arrow.top {
  border-color: var(--surface-card) transparent transparent transparent;
}

[data-theme="dark"] .highlighted-element {
  border-color: var(--p-primary-400);
}

[data-theme="dark"] .tutorial-backdrop {
  background: rgba(0, 0, 0, 0.6);
}

html[data-accessibility~="highContrast"] .highlighted-element {
  border: 4px solid yellow !important;
  background: transparent !important;
}

html[data-accessibility~="highContrast"] .tutorial-tooltip {
  border: 3px solid yellow !important;
}

html[data-accessibility~="highContrast"] .tutorial-backdrop {
  background: rgba(0, 0, 0, 0.7) !important;
}
</style>