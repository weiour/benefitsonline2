<template>
  <div class="field">
    <label :for="id" class="font-semibold mb-2 block">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <InputMask
      :id="id"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      mask="+7 (999) 999-99-99"
      placeholder="+7 (___) ___-__-__"
      class="w-full border-round-xl"
      :class="{ 'p-invalid': error }"
      @blur="validatePhone"
      @input="handleInput"
    />
    
    <small v-if="hint && !error" class="text-color-secondary text-xs mt-1">{{ hint }}</small>
    <small v-if="error" class="p-error">{{ error }}</small>
  </div>
</template>

<script>
import { ref } from 'vue'
import InputMask from 'primevue/inputmask'

export default {
  name: 'PhoneInput',
  components: {
    InputMask
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: 'Телефон'
    },
    error: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    hint: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'validate'],
  setup(props, { emit }) {
    const id = ref(`phone-${Math.random().toString(36).substr(2, 9)}`)

    const validatePhone = () => {
      let error = ''
      
      if (props.required && (!props.modelValue || props.modelValue.trim() === '')) {
        error = 'Введите номер телефона'
      } else if (props.modelValue && props.modelValue.includes('_')) {
        error = 'Введите номер телефона полностью'
      } else if (props.modelValue) {
        const digitsOnly = props.modelValue.replace(/\D/g, '')
        if (digitsOnly.length !== 11) {
          error = 'Введите корректный номер телефона'
        }
      }
      
      emit('validate', error)
    }

    const handleInput = () => {
      setTimeout(validatePhone, 100)
    }

    return {
      id,
      validatePhone,
      handleInput
    }
  }
}
</script>