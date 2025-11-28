<!-- python manage.py migrate -->

<script>
import { 
  usePageSetup, 
  useBenefits, 
  useBenefitModals,
  ref,
  onMounted,
  onUnmounted,
  watch,
  computed
} from '../utils/scripts.js'
import { useRoute } from 'vue-router'

import VoiceAssistant from '../components/VoiceAssistant.vue'
import Footer from '../components/Footer.vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Chip from 'primevue/chip'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import Dropdown from 'primevue/dropdown'
import MascotAssistant from '../components/MascotAssistant.vue'
import api from '../services/api'
import Slider from 'primevue/slider'
import { regionOptions } from '../data/regions'

export default {
  name: 'Home',
  components: {
    MascotAssistant,
    VoiceAssistant, 
    Footer,
    InputText, Button, Chip, Card, Tag, 
    Avatar, Dialog, ProgressSpinner, Message,
    Dropdown,
    Slider,
  },
  setup() {
    const route = useRoute()
    const page = usePageSetup('search') 
    const benefits = useBenefits(page.searchQuery)
    const modals = useBenefitModals(page.router)

    const benefitLevels = ref([
      { value: 'federal', label: 'Федеральная' },
      { value: 'regional', label: 'Региональная' },
      { value: 'municipal', label: 'Муниципальная' },
      { value: 'commercial', label: 'Спецпредложение' }
    ])

    const offerFilters = ref({
      daysToExpire: null, // количество дней до истечения
      targetGroups: [], // категории льготников
      categories: [], // категории льгот
      minDiscount: 0, // минимальная скидка
      partnerType: '' // тип партнера
    })

    const selectedBenefitLevel = ref(null)
    const selectedRegion = ref(null)
    const showFilters = ref(false)
    const activeTab = ref('sponsored')
    const partnerOffers = ref([])
    const loadingOffers = ref(false)
    const showOfferModal = ref(false)
    const selectedOffer = ref(null)
    const loadingOffer = ref(false)

   const expireOptions = ref([
      { value: null, label: 'Любой' },
      { value: 2, label: '2 дня' },
      { value: 3, label: '3 дня' },
      { value: 7, label: '1 неделя' },
      { value: 14, label: '2 недели' },
      { value: 30, label: '1 месяц' },
      { value: 60, label: '2 месяца' },
      { value: 90, label: '3 месяца' }
    ])

    const partnerTypes = ref([
      { value: 'retail', label: 'Розничная торговля' },
      { value: 'services', label: 'Услуги' },
      { value: 'cafe', label: 'Кафе и рестораны' },
      { value: 'health', label: 'Здоровье и красота' },
      { value: 'education', label: 'Образование' }
    ])

    const discountRanges = ref([
      { value: 0, label: '0%' },
      { value: 5, label: '5%' },
      { value: 10, label: '10%' },
      { value: 15, label: '15%' },
      { value: 20, label: '20%' },
      { value: 25, label: '25%' },
      { value: 30, label: '30%' },
      { value: 40, label: '40%' },
      { value: 50, label: '50%' },
      { value: 60, label: '60%' },
      { value: 70, label: '70%' },
      { value: 80, label: '80%' },
      { value: 90, label: '90%' }
    ])

    const allRegions = ref(regionOptions)

    const filteredRegions = computed(() => allRegions.value)

    const search = () => {
      console.log(page.searchQuery.value)
    }

    const clearSearch = () => {
      page.searchQuery.value = ''
    }

    const toggleAvailableForMe = async () => {
      benefits.availableForMe.value = !benefits.availableForMe.value
      if (benefits.availableForMe.value && page.isAuthenticated()) {
        await benefits.fetchAvailableBenefits()
      }
    }
    
    const toggleNotReceived = async () => {
      benefits.notReceived.value = !benefits.notReceived.value
      if (benefits.notReceived.value && page.isAuthenticated()) {
        await benefits.fetchUserRequests()
      }
    }

    const filteredPartnerOffers = computed(() => {
      if (!partnerOffers.value.length) return []

      let filtered = partnerOffers.value.filter(offer => {
        const searchText = page.searchQuery.value?.toLowerCase() || ''
        if (searchText) {
          const matchesMainFields = 
            (offer.title && offer.title.toLowerCase().includes(searchText)) ||
            (offer.description && offer.description.toLowerCase().includes(searchText)) ||
            (offer.partner_name && offer.partner_name.toLowerCase().includes(searchText)) ||
            (offer.partner?.name && offer.partner.name.toLowerCase().includes(searchText))
          
          const matchesTags = searchByTags(offer, searchText)
          
          if (!matchesMainFields && !matchesTags) return false
        }

        if (offerFilters.value.daysToExpire && offer.valid_until) {
          const expireDate = new Date(offer.valid_until)
          const today = new Date()
          const daysDiff = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24))
          if (daysDiff > offerFilters.value.daysToExpire) return false
        }

        const discount = formatDiscount(offer.discount)
        if (discount < offerFilters.value.minDiscount) return false

        if (offerFilters.value.targetGroups.length > 0 && offer.target_groups) {
          const hasMatchingGroup = offer.target_groups.some(group => 
            offerFilters.value.targetGroups.includes(group)
          )
          if (!hasMatchingGroup) return false
        }

        if (offerFilters.value.categories.length > 0 && offer.categories) {
          const hasMatchingCategory = offer.categories.some(category => 
            offerFilters.value.categories.includes(category)
          )
          if (!hasMatchingCategory) return false
        }

        if (offerFilters.value.partnerType && offer.partner_type !== offerFilters.value.partnerType) {
          return false
        }

        return true
      })

      return filtered
    })

    const searchByTags = (offer, searchText) => {
      const tagMap = {
        'транспорт': ['transport', 'транспорт', 'проезд', 'автобус', 'метро', 'такси'],
        'медицина': ['medicine', 'медицина', 'здоровье', 'лекарства', 'врач', 'больница'],
        'коммуналка': ['utilities', 'коммунальные', 'жкх', 'квартплата', 'электричество', 'вода'],
        'образование': ['education', 'образование', 'учеба', 'школа', 'университет', 'курсы'],
        'культура': ['culture', 'культура', 'кино', 'театр', 'музей', 'концерт'],
        
        'пенсионер': ['pensioner', 'пенсионер', 'пенсия', 'пожилой'],
        'инвалид': ['disabled', 'инвалид', 'инвалидность'],
        'ветеран': ['veteran', 'ветеран', 'война'],
        'семья': ['family', 'семья', 'многодетный', 'дети'],
        'студент': ['student', 'студент', 'ученик'],
        'малоимущий': ['low_income', 'малоимущий', 'бедный'],
        
        'ресторан': ['cafe', 'ресторан', 'кафе', 'еда', 'питание'],
        'магазин': ['retail', 'магазин', 'торговля', 'покупки'],
        'услуги': ['services', 'услуги', 'сервис'],
        'здоровье': ['health', 'здоровье', 'красота', 'спа', 'фитнес']
      }

      for (const [tagName, tagVariants] of Object.entries(tagMap)) {
        if (tagVariants.some(variant => searchText.includes(variant))) {
          if (hasTag(offer, tagVariants)) {
            return true
          }
        }
      }

      return false
    }

    const hasTag = (offer, tagVariants) => {
      if (offer.categories) {
        const hasCategory = offer.categories.some(category => 
          tagVariants.includes(category.toLowerCase())
        )
        if (hasCategory) return true
      }

      if (offer.target_groups) {
        const hasTargetGroup = offer.target_groups.some(group => 
          tagVariants.includes(group.toLowerCase())
        )
        if (hasTargetGroup) return true
      }

      if (offer.partner_type && tagVariants.includes(offer.partner_type.toLowerCase())) {
        return true
      }

      return false
    }

    const clearOfferFilters = () => {
      offerFilters.value = {
        daysToExpire: null,
        targetGroups: [],
        categories: [],
        minDiscount: 0,
        partnerType: ''
      }
    }

    const formatCategoryName = (category) => {
      if (!category?.title) return ''
      
      const longNames = {
        'Коммунальные услуги': 'Комм. услуги',
        'Коммунальные льготы': 'Комм. льготы', 
        'Образовательные услуги': 'Образование',
        'Медицинские услуги': 'Медицина',
        'Транспортные услуги': 'Транспорт',
        'Социальные выплаты': 'Соц. выплаты',
        'Налоговые льготы': 'Налоги',
        'Жилищно-коммунальные услуги': 'ЖКУ',
        'Государственные услуги': 'Гос. услуги',
        'Связь и интернет': 'Связь',
        'Детские программы': 'Дет. программы',
        'Социальная поддержка': 'Соц. поддержка',
        'Жильё и ипотека': 'Ипотека',
      }
      
      return longNames[category.title] || category.title
    }

    const handleToggleProfileMenu = (isVisible) => {
      page.showProfileMenu.value = isVisible
    }

    const handleMenuItemClick = (item) => {
      if (item.action) {
        item.action()
      }
    }

    const handleGoToHome = () => {
      if (page.currentPage !== 'benefits') {
        page.router.push('/')
      }
    }

    const handleStartVoiceSearch = () => {
      page.startVoiceSearch()
    }

    const getBenefitRegionsText = (benefit) => {
      if (!benefit?.regions || benefit.regions.length === 0) return 'По всей России'
      
      const regions = benefit.regions
      
      if (regions.includes('all') || regions.includes('ALL') || regions.includes('вся россия')) {
        return 'По всей России'
      }
      
      try {
        const regionNames = regions.map(region => {
          if (region === 'all' || region === 'ALL' || region === 'вся россия') return null
          if (typeof region === 'string') return region
          if (region && typeof region === 'object') return region.name || region.title || null
          return null
        }).filter(name => name !== null)
        
        if (regionNames.length === 0) return 'По всей России'
        if (regionNames.length === 1) return regionNames[0]
        if (regionNames.length <= 3) return regionNames.join(', ')
        return `${regionNames[0]} и еще ${regionNames.length - 1} регионов`
        
      } catch (error) {
        console.error(error)
        return 'По всей России'
      }
    }

    const getCategoryIcon = (category) => {
      const icons = {
        'Медицина': 'pi pi-wave-pulse',
        'Образование': 'pi pi-book',
        'ЖКХ': 'pi pi-home',
        'Транспорт': 'pi pi-car',
        'Налоги': 'pi pi-dollar',
        'Социальные': 'pi pi-users',
        'default': 'pi pi-tag'
      }
      return icons[category?.title] || icons.default
    }

    const getTargetGroupsText = (targetGroups) => {
      if (!targetGroups || targetGroups.length === 0) return 'Не указано'
      
      const groups = targetGroups.map(group => group.title)
      
      if (groups.length === 1) return groups[0]
      if (groups.length === 2) return groups.join(' и ')
      if (groups.length === 3) return `${groups[0]}, ${groups[1]} и ${groups[2]}`
      
      return `${groups.slice(0, 3).join(', ')} и еще ${groups.length - 3} категорий`
    }

    const getCategoryIconForFilter = (categoryValue) => {
      const category = benefitCategoryOptions.value.find(cat => cat.value === categoryValue)
      if (category) return category.icon
      
      const icons = {
        'transport': 'pi pi-car',
        'medicine': 'pi pi-heart', 
        'utilities': 'pi pi-home',
        'education': 'pi pi-book',
        'culture': 'pi pi-ticket',
        'sport': 'pi pi-trophy',
        'nutrition': 'pi pi-shopping-bag',
        'housing': 'pi pi-building',
        'tax': 'pi pi-dollar',
        'social': 'pi pi-users',
        'communication': 'pi pi-phone',
        'legal': 'pi pi-briefcase',
        'tourism': 'pi pi-map',
        'auto': 'pi pi-car',
        'finance': 'pi pi-credit-card'
      }
      return icons[categoryValue] || 'pi pi-tag'
    }

    const getShortCategoryLabel = (label) => {
      const shortLabels = {
        'Транспорт': 'Трансп.',
        'Медицина': 'Мед.',
        'Коммунальные услуги': 'Коммун.',
        'Образование': 'Образ.',
        'Культура и досуг': 'Культ.',
        'Спорт': 'Спорт',
        'Питание': 'Питание',
        'Жильё': 'Жильё',
        'Налоги': 'Налоги',
        'Социальная поддержка': 'Соц.под.',
        'Связь и интернет': 'Связь',
        'Юридические услуги': 'Юрид.',
        'Туризм': 'Туризм',
        'Автомобиль': 'Авто',
        'Финансовые услуги': 'Финансы'
      }
      return shortLabels[label] || label.substring(0, 8)
    }

    const getBenefitLevelIcon = (level) => {
      const icons = {
        federal: 'pi pi-flag',
        regional: 'pi pi-map',
        municipal: 'pi pi-building',
        commercial: 'pi pi-shopping-cart'
      }
      return icons[level] || 'pi pi-tag'
    }

    const getBenefitLevelLabel = (level) => {
      const levelMap = {
        federal: 'Федеральная',
        regional: 'Региональная', 
        municipal: 'Муниципальная',
        commercial: 'Спецпредложение'
      }
      return levelMap[level] || level
    }

    const getRegionLabel = (region) => {
      const regionObj = allRegions.value.find(r => r.value === region)
      return regionObj ? regionObj.label : region
    }

    const selectBenefitLevel = (level) => {
      if (selectedBenefitLevel.value === level) {
        selectedBenefitLevel.value = null
        benefits.selectedTypeFilter.value = ''
        selectedRegion.value = null
        benefits.selectedRegionFilter.value = null
      } else {
        selectedBenefitLevel.value = level
        benefits.selectedTypeFilter.value = level || ''
        
        if (level === 'regional' || level === 'municipal') {
          const userRegion = page.user.value?.region
          if (userRegion) {
            selectedRegion.value = userRegion
            benefits.selectedRegionFilter.value = userRegion
            console.log(userRegion)
          } else {
            selectedRegion.value = null
            benefits.selectedRegionFilter.value = null
          }
        } else {
          selectedRegion.value = null
          benefits.selectedRegionFilter.value = null
        }
      }
    }

    const clearBenefitLevel = () => {
      selectedBenefitLevel.value = null
      selectedRegion.value = null
      benefits.selectedTypeFilter.value = ''
    }

    const clearRegion = () => {
      selectedRegion.value = null
      benefits.selectedRegionFilter.value = null
    }

    const selectRegion = (region) => {
      selectedRegion.value = region
      benefits.selectedRegionFilter.value = region
    }

    const clearAllFilters = () => {
      if (activeTab.value === 'sponsored') {
        clearOfferFilters()
      } else {
        selectedBenefitLevel.value = null
        selectedRegion.value = null
        benefits.clearAllFilters()
      }
    }

    const getActiveFiltersText = computed(() => {
      if (activeTab.value === 'sponsored') {
        const activeFilters = []
        if (offerFilters.value.daysToExpire) {
          const option = expireOptions.value.find(opt => opt.value === offerFilters.value.daysToExpire)
          if (option) activeFilters.push(`Истекает: ${option.label}`)
        }
        if (offerFilters.value.minDiscount > 0) {
          activeFilters.push(`Скидка от ${offerFilters.value.minDiscount}%`)
        }
        if (offerFilters.value.partnerType) {
          const type = partnerTypes.value.find(opt => opt.value === offerFilters.value.partnerType)
          if (type) activeFilters.push(type.label)
        }
        if (offerFilters.value.targetGroups.length > 0) {
          activeFilters.push(`Категории: ${offerFilters.value.targetGroups.length}`)
        }
        if (offerFilters.value.categories.length > 0) {
          activeFilters.push(`Льготы: ${offerFilters.value.categories.length}`)
        }
        return activeFilters
      } else {
        const filters = []
        if (selectedBenefitLevel.value) {
          filters.push(getBenefitLevelLabel(selectedBenefitLevel.value))
        }
        if (benefits.selectedCategoryFilters.value.length > 0) {
          filters.push(`Категории: ${benefits.selectedCategoryFilters.value.length}`)
        }
        if (benefits.availableForMe.value) filters.push('Доступны мне')
        if (benefits.notReceived.value) filters.push('Неполученные')
        return filters
      }
    })

    const showComplaintModal = ref(false)
    const complaintBenefit = ref(null)

    const complaintReasons = ref([
      { value: 'not_working', label: 'Льгота не работает' },
      { value: 'spam', label: 'Спам или misleading информация' },
      { value: 'wrong_info', label: 'Неверная информация' },
      { value: 'duplicate', label: 'Дубликат другой льготы' },
      { value: 'other', label: 'Другая причина' }
    ])

    const openComplaintModal = (benefit, event) => {
      if (event) {
        event.stopPropagation() 
      }
      complaintBenefit.value = benefit
      showComplaintModal.value = true
    }

    const closeComplaintModal = () => {
      showComplaintModal.value = false
      complaintBenefit.value = null
    }

    const submitComplaint = (reason) => {
      if (!complaintBenefit.value) return
      
      console.log({
        benefitId: complaintBenefit.value.id,
        benefitTitle: complaintBenefit.value.title,
        reason: reason,
        timestamp: new Date().toISOString()
      })
      
      alert(`Жалоба на льготу "${complaintBenefit.value.title}" отправлена!`)
      
      closeComplaintModal()
    }

    watch(showFilters, (visible) => {
      if (visible) {
        document.body.classList.add('filters-open')
      } else {
        document.body.classList.remove('filters-open')
      }
    })

    const applyUrlFilters = () => {
      const categoryParam = route.query.category
      if (categoryParam) {
        if (!benefits.selectedCategoryFilters.value.includes(categoryParam)) {
          benefits.selectedCategoryFilters.value.push(categoryParam)
        }
      }
      
      const queryParam = route.query.q
      if (queryParam && page.searchQuery) {
        page.searchQuery.value = decodeURIComponent(queryParam)
      }
      
      const typeParam = route.query.type || route.query.level
      if (typeParam && benefits.selectedTypeFilter) {
        benefits.selectedTypeFilter.value = typeParam
        selectedBenefitLevel.value = typeParam
      }
      
      const urgentParam = route.query.urgent
      if (urgentParam === 'true') {
        showFilters.value = true
      }
    }

    watch(() => benefits.selectedTypeFilter.value, (newValue) => {
      if (selectedBenefitLevel.value !== newValue) {
        selectedBenefitLevel.value = newValue || null
      }
    })

    watch(() => selectedBenefitLevel.value, (newValue, oldValue) => {
      const newFilterValue = newValue || ''
      if (benefits.selectedTypeFilter.value !== newFilterValue) {
        benefits.selectedTypeFilter.value = newFilterValue
      }
      
      if (newValue === 'regional' || newValue === 'municipal') {
        const userRegion = page.user.value?.region
        if (userRegion) {
          selectedRegion.value = userRegion
          benefits.selectedRegionFilter.value = userRegion
          console.log('автоматически выбран регион пользователя:', userRegion)
        } else {
          selectedRegion.value = null
          benefits.selectedRegionFilter.value = null
          console.log('регион не указан в профиле пользователя')
        }
      } else {
        if (selectedRegion.value) {
          selectedRegion.value = null
          benefits.selectedRegionFilter.value = null
        }
      }
    })

    const fetchPartnerOffers = async () => {
      loadingOffers.value = true
      try {
        const { data } = await api.get('/partner-offers/latest/', {
          params: { limit: 10 }
        })
        partnerOffers.value = data || []
      } catch (error) {
        console.error('ошибка предложений партнеров:', error)
        partnerOffers.value = []
      } finally {
        loadingOffers.value = false
      }
    }

    const formatDiscount = (discount) => {
      if (typeof discount === 'number') {
        return discount
      }
      if (typeof discount === 'object' && discount !== null) {
        return discount.percent || discount.value || Object.values(discount)[0] || 0
      }
      return 0
    }

    const formatValidUntil = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    const openOfferModal = async (offer) => {
      selectedOffer.value = offer
      showOfferModal.value = true
      loadingOffer.value = true
      
      try {
        if (!offer.partner || !offer.partner.phone) {
          const { data } = await api.get(`/partner-offers/${offer.id}/`)
          selectedOffer.value = data
        }
      } catch (error) {
        console.error('ошибка при загрузке детальной информации о прелдожении:', error)
      } finally {
        loadingOffer.value = false
      }
    }

    const open2GISRoute = (partner) => {
      if (!partner) return
      
      const partnerName = encodeURIComponent(partner.name)
      const city = 'yakutsk'
      
      if (partner.address) {
        const address = encodeURIComponent(`${partner.name}, ${partner.address}, Якутск`)
        const url = `https://2gis.ru/${city}/search/${address}`
        window.open(url, '_blank')
      } else {
        const url = `https://2gis.ru/${city}/search/${partnerName}`
        window.open(url, '_blank')
      }
    }

    const discountValues = computed(() => discountRanges.value.map(item => item.value))
    const expireValues = computed(() => expireOptions.value.map(item => item.value))

    const getDiscountLabel = (value) => {
      const option = discountRanges.value.find(opt => opt.value === value)
      return option ? option.label : `${value}%`
    }

    const getExpireLabel = (value) => {
      const option = expireOptions.value.find(opt => opt.value === value)
      return option ? option.label : `${value} дн.`
    }

    const getClosestValue = (value, valuesArray) => {
      return valuesArray.reduce((prev, curr) => {
        return (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev)
      })
    }

    const handleDiscountChange = (value) => {
      offerFilters.value.minDiscount = getClosestValue(value, discountValues.value)
    }

    const handleExpireChange = (value) => {
      offerFilters.value.daysToExpire = getClosestValue(value, expireValues.value)
    }

    const sortOptions = ref([
      { value: 'relevance', label: 'По релевантности', icon: 'pi pi-star' },
      { value: 'expiry', label: 'По сроку истечения', icon: 'pi pi-clock' },
      { value: 'discount', label: 'По размеру скидки', icon: 'pi pi-percentage' },
    ])

    const selectedSort = ref('relevance')
    const showSortDropdown = ref(false) 

    const sortedPartnerOffers = computed(() => {
      if (!filteredPartnerOffers.value.length) return []

      const offers = [...filteredPartnerOffers.value]

      switch (selectedSort.value) {
        case 'expiry':
          return offers.sort((a, b) => {
            const aDate = a.valid_until ? new Date(a.valid_until) : new Date('9999-12-31')
            const bDate = b.valid_until ? new Date(b.valid_until) : new Date('9999-12-31')
            return aDate - bDate
          })

        case 'discount':
          return offers.sort((a, b) => {
            const aDiscount = formatDiscount(a.discount)
            const bDiscount = formatDiscount(b.discount)
            return bDiscount - aDiscount
          })

        case 'newest':
          return offers.sort((a, b) => {
            const aDate = a.created_at ? new Date(a.created_at) : new Date(0)
            const bDate = b.created_at ? new Date(b.created_at) : new Date(0)
            return bDate - aDate
          })

        case 'relevance':
        default:
          return sortByRelevance(offers)
      }
    })

    const sortByRelevance = (offers) => {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user?.category) return offers

      const userPriorityGroups = getUserPriorityGroups(user.category)
      
      return offers.sort((a, b) => {
        const aScore = calculateRelevanceScore(a, userPriorityGroups)
        const bScore = calculateRelevanceScore(b, userPriorityGroups)
        return bScore - aScore
      })
    }

    const calculateRelevanceScore = (offer, priorityGroups) => {
      let score = 0
      
      if (offer.target_groups && offer.target_groups.length > 0) {
        const hasMatchingGroup = offer.target_groups.some(group => 
          priorityGroups.includes(group)
        )
        if (hasMatchingGroup) score += 10
      }

      const discount = formatDiscount(offer.discount)
      score += Math.min(discount / 10, 5) 
      if (offer.valid_until) {
        const expireDate = new Date(offer.valid_until)
        const today = new Date()
        const daysDiff = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24))
        if (daysDiff <= 7) score += 3 // срочные предложения
        else if (daysDiff <= 30) score += 1 // скоро истекают
      }

      return score
    }

    const getUserPriorityGroups = (userCategory) => {
      const priorityMap = {
        'pensioner': ['pensioner', 'senior'],
        'disabled': ['disabled', 'handicapped'],
        'disabled_2': ['disabled', 'handicapped'],
        'disabled_3': ['disabled', 'handicapped'],
        'veteran': ['veteran', 'military'],
        'family': ['family', 'large_family', 'children'],
        'student': ['student', 'youth'],
        'low_income': ['low_income', 'poor'],
        'child': ['child', 'children', 'youth']
      }
      
      return priorityMap[userCategory] || []
    }

    const selectSortOption = (option) => {
      selectedSort.value = option.value
      showSortDropdown.value = false
    }

    const getCurrentSortLabel = computed(() => {
      const option = sortOptions.value.find(opt => opt.value === selectedSort.value)
      return option ? option.label : 'Сортировка'
    })

    const toggleSortDropdown = () => {
      showSortDropdown.value = !showSortDropdown.value
    }

    const closeSortDropdown = () => {
      showSortDropdown.value = false
    }

    const favorites = ref({
      benefits: [], 
      offers: []    
    })

    const loadFavorites = () => {
      try {
        const saved = localStorage.getItem('userFavorites')
        if (saved) {
          favorites.value = JSON.parse(saved)
        }
      } catch (e) {
        console.error('ошибка загрузки избранного:', e)
      }
    }

    const saveFavorites = () => {
      try {
        localStorage.setItem('userFavorites', JSON.stringify(favorites.value))
      } catch (e) {
        console.error('ошибка сохранения избранного:', e)
      }
    }

    const isFavorite = (id, type = 'benefit') => {
      return favorites.value[type === 'offer' ? 'offers' : 'benefits'].includes(id)
    }

    const toggleFavorite = (item, type = 'benefit') => {
      const key = type === 'offer' ? 'offers' : 'benefits'
      const index = favorites.value[key].indexOf(item.id)
      
      if (index > -1) {
        favorites.value[key].splice(index, 1)
      } else {
        favorites.value[key].push(item.id)
      }
      
      saveFavorites()
    }

    const handleBenefitRequestCreated = () => {
      if (window.location.pathname.includes('my-benefits')) {
        window.location.reload()
      }
    }

    const formatSnilsInput = (event) => {
      let value = event.target.value.replace(/\D/g, '') 
      
      if (value.length > 11) {
        value = value.slice(0, 11)
      }
      
      let formatted = ''
      if (value.length > 0) {
        formatted = value.slice(0, 3)
        if (value.length > 3) {
          formatted += '-' + value.slice(3, 6)
        }
        if (value.length > 6) {
          formatted += '-' + value.slice(6, 9)
        }
        if (value.length > 9) {
          formatted += ' ' + value.slice(9, 11)
        }
      }
      
      modals.snilsInput.value = formatted
    }

    onMounted(() => {
      loadFavorites()
      applyUrlFilters()
      benefits.fetchBenefits().then(() => {
      })
      fetchPartnerOffers()
      
      window.addEventListener('benefit-request-created', handleBenefitRequestCreated)
    })

    const targetGroupOptions = ref([
      { value: 'pensioner', label: 'Пенсионеры' },
      { value: 'disabled', label: 'Инвалиды' },
      { value: 'disabled_1', label: 'Инвалиды 1 группы' },
      { value: 'disabled_2', label: 'Инвалиды 2 группы' },
      { value: 'disabled_3', label: 'Инвалиды 3 группы' },
      { value: 'veteran', label: 'Ветераны' },
      { value: 'combat_veteran', label: 'Ветераны боевых действий' },
      { value: 'large_family', label: 'Многодетные семьи' },
      { value: 'single_parent', label: 'Одинокие родители' },
      { value: 'student', label: 'Студенты' },
      { value: 'pupil', label: 'Учащиеся' },
      { value: 'low_income', label: 'Малоимущие' },
      { value: 'chernobyl', label: 'Ликвидаторы ЧАЭС' },
      { value: 'orphan', label: 'Дети-сироты' },
      { value: 'pregnant', label: 'Беременные женщины' },
      { value: 'far_north', label: 'Жители Крайнего Севера' }
    ])

    const getTargetGroupLabel = (group) => {
      if (typeof group === 'object') {
        return group.title || group.name || 'Не указано'
      }
      
      const labels = {
        'pensioner': 'Пенсионеры',
        'disabled': 'Инвалиды',
        'disabled_1': 'Инвалиды 1 группы',
        'disabled_2': 'Инвалиды 2 группы', 
        'disabled_3': 'Инвалиды 3 группы',
        'veteran': 'Ветераны',
        'combat_veteran': 'Ветераны боевых действий',
        'large_family': 'Многодетные семьи',
        'single_parent': 'Одинокие родители',
        'student': 'Студенты',
        'pupil': 'Учащиеся',
        'low_income': 'Малоимущие',
        'chernobyl': 'Ликвидаторы ЧАЭС',
        'orphan': 'Дети-сироты',
        'pregnant': 'Беременные женщины',
        'family': 'Семьи',
        'child': 'Дети'
      }
      
      return labels[group] || group
    }

    const benefitCategoryOptions = ref([
      { value: 'transport', label: 'Транспорт', icon: 'pi pi-car' },
      { value: 'medicine', label: 'Медицина', icon: 'pi pi-heart' },
      { value: 'utilities', label: 'Коммунальные услуги', icon: 'pi pi-home' },
      { value: 'education', label: 'Образование', icon: 'pi pi-book' },
      { value: 'culture', label: 'Культура и досуг', icon: 'pi pi-ticket' },
      { value: 'sport', label: 'Спорт', icon: 'pi pi-trophy' },
      { value: 'nutrition', label: 'Питание', icon: 'pi pi-shopping-bag' },
      { value: 'housing', label: 'Жильё', icon: 'pi pi-building' },
      { value: 'tax', label: 'Налоги', icon: 'pi pi-dollar' },
      { value: 'social', label: 'Социальная поддержка', icon: 'pi pi-users' },
      { value: 'communication', label: 'Связь и интернет', icon: 'pi pi-phone' },
      { value: 'legal', label: 'Юридические услуги', icon: 'pi pi-briefcase' },
      { value: 'tourism', label: 'Туризм', icon: 'pi pi-map' },
      { value: 'auto', label: 'Автомобиль', icon: 'pi pi-car' },
      { value: 'finance', label: 'Финансовые услуги', icon: 'pi pi-credit-card' },
      { value: 'childcare', label: 'Детские сады', icon: 'pi pi-user' },
    ])

    const getFilterLabel = (value) => {
      const category = benefitCategoryOptions.value.find(cat => cat.value === value)
      if (category) return category.label
      const targetGroup = targetGroupOptions.value.find(group => group.value === value)
      if (targetGroup) return targetGroup.label
      const existingFilters = {
        'federal': 'Федеральная',
        'regional': 'Региональная', 
        'municipal': 'Муниципальная',
        'commercial': 'Спецпредложение',
        'available': 'Доступны мне',
        'not_received': 'Неполученные'
      }
      
      return existingFilters[value] || value
    }

    const toggleArrayFilter = (array, value) => {
      const index = array.indexOf(value)
      if (index > -1) {
        array.splice(index, 1)
      } else {
        array.push(value)
      }
    }

    const removeFromArray = (array, value) => {
      const index = array.indexOf(value)
      if (index > -1) {
        array.splice(index, 1)
      }
    }
    
    onUnmounted(() => {
      window.removeEventListener('benefit-request-created', handleBenefitRequestCreated)
    })
    watch(() => route.query, () => {
      applyUrlFilters()
    }, { deep: true })

    return {
      ...page, 
      ...benefits,
      ...modals,
      searchQuery: page.searchQuery,
      benefitCategoryOptions,
      targetGroupOptions,
      toggleArrayFilter,
      removeFromArray,
      clearSearch,
      getFilterLabel,
      getPartnerTypeText: benefits.getPartnerTypeText,
      removeFromArray: benefits.removeFromArray,
      toggleArrayFilter: benefits.toggleArrayFilter,
      getFilterLabel: benefits.getFilterLabel,
      isFavorite,
      toggleFavorite,
      activeTab,
      openComplaintModal,
      benefitLevels,
      selectedBenefitLevel,
      selectedRegion,
      filteredRegions,
      formatCategoryName,
      showFilters,
      search,
      toggleAvailableForMe,
      toggleNotReceived,
      getCategoryIcon,
      getBenefitRegionsText,
      handleToggleProfileMenu,
      handleMenuItemClick,
      handleGoToHome,
      handleStartVoiceSearch,
      getTargetGroupsText,
      getShortCategoryLabel,
      getCategoryIconForFilter,
      getBenefitLevelIcon,
      getBenefitLevelLabel,
      getRegionLabel,
      selectBenefitLevel,
      clearBenefitLevel,
      clearRegion,
      clearAllFilters,
      partnerOffers,
      loadingOffers,
      showOfferModal,
      selectedOffer,
      loadingOffer,
      formatDiscount,
      formatValidUntil,
      openOfferModal,
      getTargetGroupLabel,
      open2GISRoute,
      offerFilters,
      expireOptions,
      partnerTypes,
      discountRanges,
      filteredPartnerOffers,
      clearOfferFilters,
      getActiveFiltersText,
      discountValues,
      expireValues,
      getDiscountLabel,
      getExpireLabel,
      handleDiscountChange,
      handleExpireChange,
      sortOptions,
      selectedSort,
      showSortDropdown,
      sortedPartnerOffers,
      selectSortOption,
      getCurrentSortLabel,
      toggleSortDropdown,
      closeSortDropdown,
      targetGroupOptions,
      clearTypeFilter: benefits.clearTypeFilter,
      removeCategoryFilter: benefits.removeCategoryFilter,
      getTypeLabel: benefits.getTypeLabel,
      getTypeSeverity: benefits.getTypeSeverity,
      getTargetGroups: benefits.getTargetGroups,
      openBenefit: modals.openBenefit,
      closeBenefitModal: modals.closeBenefitModal,
      requestSelectedBenefit: modals.requestSelectedBenefit,
      selectedBenefitHasRequest: modals.selectedBenefitHasRequest,
      selectedBenefitRequesting: modals.selectedBenefitRequesting,
      selectedBenefitRequestMessage: modals.selectedBenefitRequestMessage,
      showSnilsModal: modals.showSnilsModal,
      snilsInput: modals.snilsInput,
      snilsError: modals.snilsError,
      savingSnils: modals.savingSnils,
      saveSnils: modals.saveSnils,
      formatSnilsInput,
      openGosuslugi: modals.openGosuslugi,
      openMfc: modals.openMfc,
      getSelectedBenefitRegionsText: modals.getSelectedBenefitRegionsText,
    }
  }
}
</script>

<template>
  <VoiceAssistant />
  <div class="app-layout">
    <header class="app-header">
      <div class="container mx-auto px-4 py-3">
        <div class="flex justify-content mb-4 mt-2">
          <h1 class="text-2xl font-bold m-0 text-primary">Льготы Онлайн</h1>
        </div>
        <section v-if="!user" class="guest-promo surface-card border-round-2xl p-4 mb-4 shadow-2">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-user-plus text-primary text-2xl"></i>
            <div class="flex-1">
              <h3 class="text-lg font-bold m-0 mb-2">Узнайте, какие льготы вам положены</h3>
              <p class="text-color-secondary m-0 mb-3 text-sm">Войдите, чтобы получить персонализированные рекомендации</p>
            </div>
          </div>
          <Button 
            label="Войти" 
            @click="$router.push('/login')"
            class="p-button-primary border-round-xl w-full"
          />
        </section>
        <div class="flex flex-column align-items-start gap-2 w-full">
          <div class="w-full">
            <div class="p-inputgroup border-1 border-round-2xl overflow-hidden">
              <InputText 
                v-model="searchQuery" 
                placeholder="Найдите льготы..."
                class="w-full border-none h-3rem"
                @keyup.enter="search"
                id="search-benefits"
                name="search_benefits"
              />
              <Button 
                v-if="searchQuery" 
                @click="clearSearch" 
                icon="pi pi-times" 
                class="p-button-text p-button-plain border-none h-3rem"
                id="clear-search"
                name="clear_search"
              />
              <Button 
                icon="pi pi-filter"
                @click="showFilters = true" 
                class="p-button p-button-primary border-round-2xl h-3rem flex-shrink-0 text-sm mobile-filter-btn"
                :class="{ 'p-button-primary': showFilters }"
                style="left:1px;"
              />
            </div>
          </div>

            <div v-if="activeTab === 'regular'" class="flex-1 w-full">
              <Button 
                :icon="availableForMe ? 'pi pi-check' : 'pi pi-circle'"
                label="Доступны мне"
                :class="['p-button p-button-outlined border-round-2xl h-3rem w-full text-sm', { 
                  'active-filter': availableForMe,
                  'disabled': !isAuthenticated()
                }]"
                @click="isAuthenticated() ? toggleAvailableForMe() : null"
                :disabled="!isAuthenticated()"
                severity="secondary"
              />
            </div>
            
            <div v-if="activeTab === 'sponsored'" class="sort-container relative flex-1 w-full">
              <Button 
                icon="pi pi-sort-alt" 
                :label="getCurrentSortLabel"
                @click="toggleSortDropdown" 
                class="p-button p-button-outlined border-round-2xl h-3rem w-full text-sm mobile-sort-btn"
                severity="secondary"
                :class="{ 'p-button-primary': showSortDropdown }"
              />
              
              <div 
                v-if="showSortDropdown"
                class="sort-dropdown surface-card border-round-2xl shadow-3 absolute w-full mt-0 z-5"
                style="top: 90%; left: 0;"
              >
                <div class="sort-options flex flex-column p-2 gap-1">
                  <Button 
                    v-for="option in sortOptions"
                    :key="option.value"
                    :icon="option.icon"
                    :label="option.label"
                    :class="[
                      'p-button-text justify-content-start p-3 border-round-2xl w-full text-left',
                      selectedSort === option.value ? 'active-sort-option surface-hover' : ''
                    ]"
                    @click="selectSortOption(option)"
                  />
                </div>
              </div>
            </div>
        </div>
        <div v-if="!showFilters && getActiveFiltersText.length > 0" class="w-full mt-3">
          <div class="flex align-items-center gap-2 flex-wrap text-sm">
            <span class="text-color-secondary">Выбранные теги:</span>
            
            <template v-if="activeTab === 'sponsored'">
              <Tag 
                v-if="offerFilters.daysToExpire"
                :value="`Срок: ${getExpireLabel(offerFilters.daysToExpire)}`"
                icon="pi pi-times"
                @click="offerFilters.daysToExpire = null"
                class="cursor-pointer"
              />
              <Tag 
                v-if="offerFilters.minDiscount > 0"
                :value="`Скидка от ${getDiscountLabel(offerFilters.minDiscount)}`"
                icon="pi pi-times"
                @click="offerFilters.minDiscount = 0"
                class="cursor-pointer"
              />
              <Tag 
                v-if="offerFilters.partnerType"
                :value="getPartnerTypeText(offerFilters.partnerType)"
                icon="pi pi-times"
                @click="offerFilters.partnerType = ''"
                class="cursor-pointer"
              />
              <Tag 
                v-for="group in offerFilters.targetGroups"
                :key="`group-${group}`"
                :value="getTargetGroupLabel(group)"
                icon="pi pi-times"
                @click="removeFromArray(offerFilters.targetGroups, group)"
                class="cursor-pointer"
              />
              <Tag 
                v-for="category in offerFilters.categories"
                :key="`category-${category}`"
                :value="getShortCategoryLabel(getFilterLabel(category))"
                icon="pi pi-times"
                @click="removeFromArray(offerFilters.categories, category)"
                class="cursor-pointer"
              />
            </template>

              <template v-else>
                <Tag 
                  v-if="selectedBenefitLevel"
                  :value="getFilterLabel(selectedBenefitLevel)"
                  icon="pi pi-times"
                  @click="clearTypeFilter"
                  class="cursor-pointer"
                />
                <Tag 
                  v-for="category in selectedCategoryFilters"
                  :key="category"
                  :value="getFilterLabel(category)"
                  icon="pi pi-times"
                  @click="removeCategoryFilter(category)"
                  class="cursor-pointer"
                />
                <Tag 
                  v-if="availableForMe"
                  value="Доступны мне"
                  icon="pi pi-times"
                  @click="toggleAvailableForMe"
                  class="cursor-pointer"
                />
                <Tag 
                  v-if="notReceived"
                  value="Неполученные"
                  icon="pi pi-times"
                  @click="toggleNotReceived"
                  class="cursor-pointer"
                />
              </template>
          </div>
        </div>
        
        <div 
          v-if="showFilters"
          class="filters-mobile-container"
        >
          <div class="filters-header">
            <div class="flex align-items-center justify-content-between w-full">
              <h3 class="text-lg font-bold m-0 text-primary p-2">
                {{ activeTab === 'sponsored' ? 'Фильтры спецпредложений' : 'Фильтры льгот' }}
              </h3>
            </div>
          </div>

          <div class="filters-content">
            <div v-if="activeTab === 'sponsored'" class="filter-section flex flex-column gap-4">
              <div class="filter-subsection">
                <div class="flex justify-content-between align-items-center mb-2">
                  <h4 class="filter-section-title m-0">Срок действия</h4>
                  <span class="text-sm font-semibold text-primary">
                    {{ offerFilters.daysToExpire ? getExpireLabel(offerFilters.daysToExpire) : 'Любой' }}
                  </span>
                </div>
                <div class="slider-container">
                  <Slider
                    v-model="offerFilters.daysToExpire"
                    :min="1"
                    :max="90"
                    :step="1"
                    :range="false"
                    class="w-full expire-slider custom-slider"
                    @change="handleExpireChange"
                  />
                  <div class="slider-labels flex justify-content-between mt-2">
                    <span class="text-xs text-color-secondary">1 день</span>
                    <span class="text-xs text-color-secondary">3 месяца</span>
                  </div>
                </div>
              </div>

              <div class="filter-subsection">
                <div class="flex justify-content-between align-items-center mb-2">
                  <h4 class="filter-section-title m-0">Минимальная скидка</h4>
                  <span class="text-sm font-semibold text-primary">
                    {{ getDiscountLabel(offerFilters.minDiscount) }}
                  </span>
                </div>
                <div class="slider-container">
                  <Slider
                    v-model="offerFilters.minDiscount"
                    :min="0"
                    :max="90"
                    :step="5"
                    :range="false"
                    class="w-full discount-slider custom-slider"
                    @change="handleDiscountChange"
                  />
                  <div class="slider-labels flex justify-content-between mt-2">
                    <span class="text-xs text-color-secondary">0%</span>
                    <span class="text-xs text-color-secondary">90%</span>
                  </div>
                </div>
              </div>

              <div class="filter-subsection">
                <h4 class="filter-section-title">Тип партнера</h4>
                <Dropdown
                  v-model="offerFilters.partnerType"
                  :options="partnerTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Все типы"
                  class="w-full"
                  :showClear="true"
                />
              </div>

              <div class="filter-subsection">
                <h4 class="filter-section-title mb-4">Категории льготников</h4>
                <div class="compact-categories-grid">
                  <div 
                    v-for="group in targetGroupOptions" 
                    :key="group.value"
                    class="category-item"
                  >
                    <Button
                      :icon="offerFilters.targetGroups.includes(group.value) ? 'pi pi-check' : 'pi pi-circle'"
                      :class="[
                        'category-filter-btn',
                        offerFilters.targetGroups.includes(group.value) ? 'active' : ''
                      ]"
                      @click="toggleArrayFilter(offerFilters.targetGroups, group.value)"
                    />
                    <span class="category-label">{{ group.label }}</span>
                  </div>
                </div>
              </div>

              <div class="filter-subsection">
                <h4 class="filter-section-title mb-4">Категории льгот</h4>
                <div class="compact-categories-grid">
                  <div 
                    v-for="category in benefitCategoryOptions" 
                    :key="category.value"
                    class="category-item"
                  >
                    <Button
                      :icon="category.icon"
                      :class="[
                        'category-filter-btn',
                        offerFilters.categories.includes(category.value) ? 'active' : ''
                      ]"
                      @click="toggleArrayFilter(offerFilters.categories, category.value)"
                    />
                    <span class="category-label">{{ getShortCategoryLabel(category.label) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="filter-section flex flex-column gap-4">
              <div class="filter-subsection">
                <h4 class="filter-section-title">Уровень льготы</h4>
                <Dropdown
                  v-model="selectedBenefitLevel"
                  :options="benefitLevels"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Выберите уровень льготы"
                  class="w-full"
                  :showClear="true"
                />
              </div>

              <div v-if="selectedBenefitLevel === 'regional' || selectedBenefitLevel === 'municipal'" 
                  class="filter-subsection">
                <h4 class="filter-section-title">
                  {{ selectedBenefitLevel === 'regional' ? 'Регион' : 'Муниципалитет' }}
                </h4>
                <Dropdown
                  v-model="selectedRegion"
                  :options="filteredRegions"
                  optionLabel="label"
                  optionValue="value"
                  :placeholder="selectedBenefitLevel === 'regional' ? 'Выберите регион' : 'Выберите муниципалитет'"
                  class="w-full"
                  :filter="true"
                  @change="selectRegion(selectedRegion)"
                />
              </div>

              <div class="filter-subsection">
                <h4 class="filter-section-title">Категории</h4>
                <div class="compact-categories-grid">
                  <div 
                    v-for="(filter, index) in categoryFilters" 
                    :key="filter.value"
                    class="category-item"
                  >
                    <Button
                      :icon="getCategoryIconForFilter(filter.value)"
                      :class="[
                        'category-filter-btn',
                        selectedCategoryFilters.includes(filter.value) ? 'active' : ''
                      ]"
                      @click="toggleCategoryFilter(filter.value)"
                    />
                    <span class="category-label">{{ getShortCategoryLabel(filter.label) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="getActiveFiltersText.length > 0" class="selected-filters-section">
              <h4 class="filter-section-title">Выбрано</h4>
              <div class="selected-filters">
                <Tag 
                  v-for="(filter, index) in getActiveFiltersText"
                  :key="index"
                  :value="filter"
                  icon="pi pi-times"
                  @click="clearAllFilters"
                  class="selected-filter-tag cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div class="filters-footer">
            <div class="flex gap-3 w-full">
              <Button 
                label="Очистить"
                @click="clearAllFilters" 
                class="p-button-outlined border-round-xl flex-1"
                icon="pi pi-refresh"
                severity="secondary"
              />
              <Button 
                label="Готово"
                @click="showFilters = false" 
                class="apply-filters-btn flex-1 p-button-primary"
                icon="pi pi-check"
              />
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="content-wrapper pt-2">
        <div class="container mx-auto px-4">
          <div class="flex justify-content-center" v-if="loading">
            <div class="grid w-full">
              <div v-for="n in 6" :key="n" class="col-12 md:col-6 lg:col-4">
                <Card class="skeleton-card">
                  <template #header>
                    <div class="skeleton-line w-6 h-4 mb-2"></div>
                    <div class="skeleton-line w-10 h-6"></div>
                  </template>
                  <template #content>
                    <div class="skeleton-line w-full h-3 mb-2"></div>
                    <div class="skeleton-line w-full h-3 mb-2"></div>
                    <div class="skeleton-line w-8 h-3"></div>
                  </template>
                </Card>
              </div>
            </div>
          </div>
          
          <Message v-else-if="error" severity="error" :closable="false" class="mb-4">
            {{ error }}
            <Button 
              @click="fetchBenefits" 
              label="Попробовать снова" 
              class="p-button-outlined p-button-sm ml-3" 
            />
          </Message>

          <div v-else>
            <div class="my-2">
              <div class="flex justify-content-between gap-2 surface-border pb-2 tab-btn2">
                <Button 
                  label="Скидки и акции" 
                  :class="['tab-btn text-sm w-full', activeTab === 'sponsored' ? 'active' : '']"
                  @click="activeTab = 'sponsored'"
                  :severity="activeTab === 'sponsored' ? 'primary' : 'secondary'"
                  text
                />
                <Button 
                  label="Государственные" 
                  :class="['tab-btn text-sm w-full', activeTab === 'regular' ? 'active' : '']"
                  @click="activeTab = 'regular'"
                  :severity="activeTab === 'regular' ? 'primary' : 'secondary'"
                  text
                />
              </div>
            </div>
              <div v-if="activeTab === 'sponsored' && sortedPartnerOffers.length > 0" class="tab-content">
                <div class="grid">
                  <div 
                    v-for="offer in sortedPartnerOffers" 
                    :key="offer.id" 
                    class="col-12 md:col-6 lg:col-4"
                  >
                    <Card class="partner-offer-card h-full shadow-2 custom-card">
                      <template #content>
                        <div class="flex flex-column gap-3 h-full">
                          <div class="flex align-items-center gap-3">
                            <Avatar 
                              :label="(offer.partner_name || offer.partner?.name || 'П').charAt(0).toUpperCase()" 
                              size="large" 
                              shape="circle" 
                              class="fixed-avatar"
                              style="width: 3rem; height: 3rem; min-width: 3rem;"
                            />
                            <div class="flex-1 min-w-0">
                              <h4 class="text-base font-bold m-0 line-clamp-1">{{ offer.partner_name || offer.partner?.name || 'Партнер' }}</h4>
                              <span class="text-xs text-color-secondary line-clamp-1">{{ getPartnerTypeText(offer.partner_type) }}</span>
                            </div>
                            <Button 
                              :icon="isFavorite(offer.id, 'offer') ? 'pi pi-heart-fill' : 'pi pi-heart'" 
                              @click.stop="toggleFavorite(offer, 'offer')"
                              :class="['p-button-text p-button-plain', isFavorite(offer.id, 'offer') ? 'text-red-500' : 'text-color-secondary']"
                            />
                          </div>
                          
                          <div>
                            <h3 class="text-lg font-bold m-0 mb-2 line-clamp-2 offer-title">
                              {{ offer.title || 'Специальное предложение' }}
                            </h3>
                            <p class="text-sm m-0 line-clamp-2 flex-1 text-color-secondary offer-description">
                              {{ offer.description }}
                            </p>
                          </div>

                          <div class="flex align-items-center flex-wrap gap-2">
                            <Tag :value="`-${formatDiscount(offer.discount)}%`" severity="success" class="text-xs font-bold" />
                            <span class="text-xs text-color-secondary" v-if="offer.valid_until">
                              до {{ formatValidUntil(offer.valid_until) }}
                            </span>
                          </div>
                          
                          <div v-if="offer.target_groups && offer.target_groups.length > 0" class="flex flex-wrap gap-1">
                            <Chip 
                              v-for="group in offer.target_groups.slice(0, 2)" 
                              :key="group"
                              :label="getTargetGroupLabel(group)"
                              class="text-xs"
                            />
                            <span v-if="offer.target_groups.length > 2" class="text-xs text-color-secondary">
                              +{{ offer.target_groups.length - 2 }}
                            </span>
                          </div>
                        </div>
                      </template>
                      
                      <template #footer>
                        <div class="flex justify-content-end align-items-center p-4 pt-0">
                          <Button 
                            @click="openOfferModal(offer)" 
                            label="Подробнее" 
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            class="p-button-outlined p-button-sm text-sm action-button p-button p-button-primary" 
                          />
                        </div>
                      </template>
                    </Card>
                  </div>
                </div>
              </div>

              <div v-else-if="activeTab === 'sponsored' && partnerOffers.length === 0" class="text-center py-8">
                <i class="pi pi-gift text-6xl text-color-secondary mb-4"></i>
                <h3 class="text-xl font-bold text-color mb-2">Нет специальных предложений</h3>
                <p class="text-color-secondary">Специальные предложения появятся здесь позже</p>
              </div>

            <div v-if="regularBenefits.length > 0">
              <div v-if="activeTab === 'regular' && regularBenefits.length > 0" class="tab-content">
                <div class="grid">
                  <div 
                    v-for="benefit in regularBenefits" 
                    :key="benefit.id" 
                    class="col-12 md:col-6 lg:col-4"
                  >
                    <Card class="h-full shadow-2 hover:shadow-4 transition-all transition-duration-300 benefit-card custom-card">
                      <template #content>
                        <!-- Заголовок и избранное -->
                        <div class="flex justify-content-between align-items-center gap-2 pb-2">
                          <div class="flex align-items-center gap-1 flex-wrap">
                            <Tag 
                              :value="getTypeLabel(benefit.type)" 
                              :severity="getTypeSeverity(benefit.type)"
                              class="text-xs"
                            />
                            <!-- Теги категорий льготников -->
                            <template v-if="benefit.target_groups && benefit.target_groups.length > 0">
                              <Chip 
                                v-for="(group, index) in benefit.target_groups.slice(0, 2)" 
                                :key="group.id || group"
                                :label="getTargetGroupLabel(group)"
                                class="text-xs"
                                size="small"
                              />
                              <span 
                                v-if="benefit.target_groups.length > 2" 
                                class="text-xs text-color-secondary"
                              >
                                +{{ benefit.target_groups.length - 2 }}
                              </span>
                            </template>
                          </div>
                          <Button 
                            :icon="isFavorite(benefit.id) ? 'pi pi-heart-fill' : 'pi pi-heart'" 
                            @click.stop="toggleFavorite(benefit)"
                            :class="['p-button-text p-button-plain', isFavorite(benefit.id) ? 'text-red-500' : 'text-color-secondary']"
                          />
                        </div>
                        
                        <!-- Контент -->
                        <div class="mb-3">
                          <h3 class="text-lg font-bold m-0 mb-2 line-clamp-2">{{ benefit.title }}</h3>
                          <p class="text-color-secondary m-0 line-clamp-3 text-sm description-text mb-4">
                            {{ benefit.short_description || benefit.description }}
                          </p>
                        </div>
                        
                        <div class="flex flex-column gap-2">
                          <div class="flex align-items-center gap-2 text-xs text-color-secondary">
                            <i class="pi pi-users"></i>
                            <span>{{ getTargetGroups(benefit.target_groups) }}</span>
                          </div>
                          <div class="flex align-items-center gap-2 text-xs text-color-secondary">
                            <i class="pi pi-map-marker"></i>
                            <span>{{ getBenefitRegionsText(benefit) }}</span>
                          </div>
                        </div>
                      </template>
                      
                      <template #footer>
                        <div class="flex justify-content-between align-items-center p-4 pt-0">
                          <Chip 
                            :label="formatCategoryName(benefit.category)" 
                            :icon="getCategoryIcon(benefit.category)"
                            class="w-fit text-xs category-chip" 
                          />
                          <Button 
                            @click="openBenefit(benefit)" 
                            label="Подробнее" 
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            class="p-button-outlined p-button-sm text-sm action-button p-button p-button-primary" 
                          />
                        </div>
                      </template>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div 
            v-if="!loading && !error && filteredBenefits.length > 0" 
            class="flex flex-column align-items-center justify-content-center text-center my-8 text-primary" 
          >
            <i class="pi pi-check-circle text-4xl mb-3"></i>
            <p class="mb-2">Вы просмотрели все доступные льготы</p>
            <small>Если вы не нашли нужную льготу, попробуйте изменить поисковый запрос</small>
          </div>

          <div 
            v-if="!loading && !error && filteredBenefits.length === 0" 
            class="text-primary flex flex-column align-items-center justify-content-center text-center py-8" 
          >
            <i class="pi pi-search text-6xl text-color-secondary mb-4"></i>
            <h3 class="text-2xl font-bold text-color mb-2">Ничего не найдено</h3>
            <p class="text-color-secondary mb-4">Попробуйте изменить поисковый запрос или фильтры</p>
            <Button 
              v-if="searchQuery || selectedTypeFilter || selectedCategoryFilters.length > 0" 
              @click="clearAllFilters" 
              label="Сбросить фильтры" 
              class="p-button-primary" 
            />
          </div>
        </div>
      </div>
    </main>

    <Footer 
      v-if="!showFilters"
      :current-page="currentPage"
      :user="user"
      :profile-menu-items="profileMenuItems"
      @toggle-profile-menu="handleToggleProfileMenu"
      @menu-item-click="handleMenuItemClick"
      @go-to-home="handleGoToHome"
      @start-voice-search="handleStartVoiceSearch"
    />

    <Dialog 
      v-model:visible="showBenefitModal" 
      :modal="true" 
      :closable="true"
      :dismissableMask="true"
      class="benefit-details-modal"
      :style="{ width: '95vw', maxWidth: '500px', background: 'transparent', boxShadow: 'none' }"
      :showHeader="false"
      :contentStyle="{ padding: '0', margin: '0', background: 'transparent', border: 'none', boxShadow: 'none' }"
      :maskStyle="{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }"
    >
      <template #closeicon>
        <i class="pi pi-times"></i>
      </template>

      <div v-if="selectedBenefitLoading" class="flex justify-content-center py-6">
        <ProgressSpinner />
      </div>

      <Message
        v-else-if="selectedBenefitError"
        severity="error"
        :closable="false"
        class="mb-4 m-3"
      >
        {{ selectedBenefitError }}
        <Button
          v-if="selectedBenefitErrorAction === 'reload'"
          label="Попробовать снова"
          class="p-button-sm ml-3"
          @click="fetchSelectedBenefit"
        />
      </Message>

      <div v-else-if="selectedBenefit" class="relative">
        <Card 
          :class="['shadow-3 overflow-hidden border-none', 
                  { 'sponsored-benefit': selectedBenefit?.is_sponsored }]"
        >
          <template #header>
            <div class="surface-border z-5 p-3 shadow-1">
              <div class="flex justify-content-between align-items-center">
                <h2 class="text-xl font-bold m-0 ml-1">Информация о льготе</h2>
                <div class="flex align-items-center gap-1">
                  <!-- Кнопка жалобы -->
                  <Button 
                    icon="pi pi-flag" 
                    @click="openReportModal(selectedBenefit)"
                    class="p-button-text p-button-plain border-circle text-color-secondary"
                    style="width: 2.5rem; height: 2.5rem;"
                    v-tooltip.top="'Пожаловаться'"
                  />
                  <!-- Кнопка закрытия -->
                  <Button 
                    icon="pi pi-times" 
                    @click="closeBenefitModal"
                    class="p-button-text p-button-plain border-circle"
                    style="width: 2.5rem; height: 2.5rem;"
                  />
               </div>
              </div>
            </div>
            <div class="flex flex-column gap-3 p-4 pb-0 pt-4">
              <div class="flex justify-content-between align-items-center w-full">
                <div class="flex align-items-center gap-2">
                  <Tag 
                    :value="getTypeLabel(selectedBenefit?.type)" 
                    :severity="getTypeSeverity(selectedBenefit?.type)"
                    :class="['text-xs', {'p-tag-commercial': selectedBenefit?.type === 'commercial'}]"
                  />
                  <Chip
                    v-if="selectedBenefit.category"
                    :label="selectedBenefit.category.title"
                    class="text-xs"
                  />
                </div>
                <Button 
                    :icon="isFavorite(selectedBenefit.id) ? 'pi pi-heart-fill' : 'pi pi-heart'" 
                    @click="toggleFavorite(selectedBenefit)"
                    :class="['p-button-text p-button-plain border-circle', isFavorite(selectedBenefit.id) ? 'text-red-500' : 'text-color-secondary']"
                    style="width: 2.5rem; height: 2.5rem;"
                    v-tooltip.top="isFavorite(selectedBenefit.id) ? 'Убрать из избранного' : 'Добавить в избранное'"
                  />
              </div>
              <h1 class="m-0 text-2xl font-bold line-height-3">{{ selectedBenefit.title }}</h1>
              <div v-if="selectedBenefit.sponsor_name" class="flex align-items-center gap-2 text-sm text-color-secondary mt-2">
                <i class="pi pi-building"></i>
                <span class="font-medium">{{ selectedBenefit.sponsor_name }}</span>
              </div>
              <p class="m-0 text-color-secondary">
                {{ selectedBenefit.description }}
              </p>
            </div>
          </template>

          <template #content>
            <div class="px-2 pt-0 flex flex-column gap-2 mb-4">
              <section>
                <h3 class="text-lg font-bold mb-2 mt-0">Кому доступна льгота</h3>
                <p class="text-color-secondary m-0 line-height-3">
                  {{ getTargetGroupsText(selectedBenefit.target_groups) }}
                </p>
              </section>

              <section>
                <h3 class="text-lg font-bold mb-2">Где действует</h3>
                <p class="text-color-secondary m-0">
                  {{ getSelectedBenefitRegionsText }}
                </p>
              </section>

              <section>
                <h3 class="text-lg font-bold mb-2">Как получить</h3>
                <p class="text-color-secondary m-0">
                  {{ selectedBenefit.how_to_get }}
                </p>
              </section>



              <section v-if="selectedBenefitRequestMessage || selectedBenefitRequestError">
                <Message
                  v-if="selectedBenefitRequestMessage"
                  severity="success"
                  :closable="false"
                >
                  {{ selectedBenefitRequestMessage }}
                </Message>
                <Message
                  v-else-if="selectedBenefitRequestError"
                  severity="error"
                  :closable="false"
                >
                  {{ selectedBenefitRequestError }}
                </Message>
              </section>
            </div>
            <div class="flex flex-column gap-3 w-full">
              <Button
                v-if="selectedBenefit?.is_sponsored"
                :label="selectedBenefitHasRequest ? 'Заявка отправлена' : 'Отправить запрос'"
                :disabled="selectedBenefitHasRequest"
                :loading="selectedBenefitRequesting"
                icon="pi pi-send"
                class="p-button-lg w-full p-button-primary p-tag-commercial"
                @click="requestSelectedBenefit"
              />
              
              <template v-else>
                <Button
                  :label="selectedBenefitHasRequest ? 'Заявка отправлена' : 'Оставить заявку'"
                  :disabled="selectedBenefitHasRequest"
                  :loading="selectedBenefitRequesting"
                  class="p-button-lg w-full p-button-primary gosuslugi"
                  @click="requestSelectedBenefit"
                />
                <Button
                  label="Оформить через МФЦ"
                  icon="pi pi-building"
                  class="p-button-lg w-full p-button-outlined"
                  style="height: 54px;"
                  @click="openMfc"
                />
              </template>
            </div>
          </template>
        </Card>
      </div>
    </Dialog>

    <Dialog 
      v-model:visible="showOfferModal" 
      :modal="true" 
      :closable="true"
      :dismissableMask="true"
      class="offer-details-modal"
      :style="{ width: '95vw', maxWidth: '500px', background: 'transparent', boxShadow: 'none' }"
      :showHeader="false"
      :contentStyle="{ padding: '0', margin: '0', background: 'transparent', border: 'none', boxShadow: 'none' }"
      :maskStyle="{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }"
    >
      <template #closeicon>
        <i class="pi pi-times"></i>
      </template>

      <div v-if="loadingOffer" class="flex justify-content-center py-6">
        <ProgressSpinner />
      </div>

      <div v-else-if="selectedOffer" class="relative">
        <Card 
          :class="['shadow-3 overflow-hidden border-none offer-modal-card']"
        >
          <template #header>
            <div class="surface-border z-5 p-3 shadow-1">
              <div class="flex justify-content-between align-items-center">
                <h2 class="text-xl font-bold m-0 ml-1">Специальное предложение</h2>
                <div class="flex align-items-center gap-1">
                  <Button 
                    icon="pi pi-times" 
                    @click="showOfferModal = false"
                    class="p-button-text p-button-plain border-circle"
                    style="width: 2.5rem; height: 2.5rem;"
                  />
                </div>
              </div>
            </div>
            
            <div class="flex flex-column gap-3 p-4 pb-0 pt-4">
              <div class="flex justify-content-between align-items-start gap-3">
                <div class="flex-1">
                  <div class="flex justify-content-between">
                    <h1 class="m-0 text-2xl font-bold line-height-3">{{ selectedOffer.title || 'Специальное предложение' }}</h1>
                    <Button 
                      :icon="isFavorite(selectedOffer.id, 'offer') ? 'pi pi-heart-fill' : 'pi pi-heart'" 
                      @click="toggleFavorite(selectedOffer, 'offer')"
                      :class="['p-button-text p-button-plain border-circle', isFavorite(selectedOffer.id, 'offer') ? 'text-red-500' : 'text-color-secondary']"
                      style="width: 2.5rem; height: 2.5rem;"
                      v-tooltip.top="isFavorite(selectedOffer.id, 'offer') ? 'Убрать из избранного' : 'Добавить в избранное'"
                    />
                  </div>
                  <div class="flex align-items-center gap-2 mt-2">
                    <Tag :value="`-${formatDiscount(selectedOffer.discount)}%`" severity="success" class="text-sm font-bold" />
                    <span class="text-sm text-color-secondary" v-if="selectedOffer.valid_until">
                      до {{ formatValidUntil(selectedOffer.valid_until) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex align-items-center gap-3 surface-100 border-round-2xl">
                <Avatar 
                  :label="(selectedOffer.partner_name || selectedOffer.partner?.name || 'П').charAt(0).toUpperCase()" 
                  size="large" 
                  shape="circle" 
                  class="flex-shrink-0"
                  style="width: 3.5rem; height: 3.5rem; font-size: 1.2rem;"
                />
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-bold m-0 line-clamp-1 mb-1">{{ selectedOffer.partner_name || selectedOffer.partner?.name || 'Партнер' }}</h3>
                  <div v-if="selectedOffer.partner?.description" class="text-sm text-color-secondary line-clamp-2">
                    {{ selectedOffer.partner.description }}
                  </div>
                  <div v-else class="text-sm text-color-secondary">
                    {{ getPartnerTypeText(selectedOffer.partner_type) }}
                  </div>
                </div>
              </div>

              <div>
                <p class="m-0 text-color-secondary line-height-3 text-sm">
                  {{ selectedOffer.description }}
                </p>
              </div>
            </div>
          </template>

          <template #content>
            <div class="pt-0 flex flex-column gap-2 mb-2">
              <section v-if="selectedOffer.partner && (selectedOffer.partner.address || selectedOffer.partner.phone || selectedOffer.partner.website)">
                <h3 class="text-lg font-bold mb-3 mt-0">Контактная информация</h3>
                <div class="flex flex-column gap-3 border-round-2xl">
                  <div v-if="selectedOffer.partner.address" class="flex align-items-start gap-2">
                    <i class="pi pi-map-marker text-primary mt-1"></i>
                    <div>
                      <strong class="text-sm">Адрес:</strong>
                      <p class="m-0 text-sm text-color-secondary">{{ selectedOffer.partner.address }}</p>
                    </div>
                  </div>
                  <div v-if="selectedOffer.partner.phone" class="flex align-items-center gap-2">
                    <i class="pi pi-phone text-primary"></i>
                    <div class="flex">
                      <strong class="text-sm">Телефон: </strong>
                      <p class="m-0 text-sm text-color-secondary">{{ selectedOffer.partner.phone }}</p>
                    </div>
                  </div>
                  <div v-if="selectedOffer.partner.website" class="flex align-items-center gap-2">
                    <i class="pi pi-globe text-primary"></i>
                    <div>
                      <strong class="text-sm">Сайт: </strong>
                      <a :href="selectedOffer.partner.website" target="_blank" class="text-primary no-underline text-sm">
                        {{ selectedOffer.partner.website }}
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              <section v-if="selectedOffer.target_groups && selectedOffer.target_groups.length > 0">
                <h3 class="text-lg font-bold mb-3">Для кого предназначено</h3>
                <div class="flex flex-wrap gap-2">
                  <Chip 
                    v-for="group in selectedOffer.target_groups" 
                    :key="group"
                    :label="getTargetGroupLabel(group)"
                    class="text-sm"
                    icon="pi pi-user"
                  />
                </div>
              </section>

              <section v-if="selectedOffer.categories && selectedOffer.categories.length > 0">
                <h3 class="text-lg font-bold mb-3">Категории льгот</h3>
                <div class="flex flex-wrap gap-2">
                  <Chip 
                    v-for="category in selectedOffer.categories" 
                    :key="category"
                    :label="getFilterLabel(category)"
                    :icon="getCategoryIconForFilter(category)"
                    class="text-sm"
                  />
                </div>
              </section>

              <section v-if="selectedOffer.terms">
                <h3 class="text-lg font-bold mb-3">Условия предложения</h3>
                <p class="text-color-secondary m-0 line-height-3 text-sm">
                  {{ selectedOffer.terms }}
                </p>
              </section>
            </div>
          </template>

          <template #footer>
            <div class="px-4 pb-4 flex flex-column gap-2">
              <Button
                label="Открыть в 2ГИС"
                icon="pi pi-map"
                class="p-button-lg w-full p-button-primary"
                @click="open2GISRoute(selectedOffer.partner)"
              />
              <Button
                v-if="selectedOffer.partner?.website"
                label="Перейти на сайт"
                icon="pi pi-external-link"
                class="p-button-lg w-full p-button-outlined"
                @click="window.open(selectedOffer.partner.website, '_blank')"
              />
            </div>
          </template>
        </Card>
      </div>
    </Dialog>

    <Dialog 
      v-model:visible="showReportModal" 
      :modal="true" 
      :closable="false"
      :dismissableMask="true"
      class="report-modal"
    >
      <template #header>
        <div class="flex justify-content-between align-items-center w-full">
          <h3 class="text-lg font-bold m-0">Пожаловаться на льготу</h3>
          <Button 
            icon="pi pi-times" 
            @click="closeReportModal"
            class="p-button-text p-button-plain border-circle"
            style="width: 2.5rem; height: 2.5rem;"
          />
        </div>
      </template>

      <section>
        <div class="flex flex-column gap-4">
          <div class="flex flex-column gap-2">
            <Button 
              label="Не работает ссылка" 
              icon="pi pi-link"
              @click="submitReport('broken_link')"
              class="p-button-outlined p-button-secondary justify-content-start"
              :loading="reportSubmitting"
            />
            <Button 
              label="Некорректная информация" 
              icon="pi pi-exclamation-triangle"
              @click="submitReport('incorrect_info')"
              class="p-button-outlined p-button-secondary justify-content-start"
              :loading="reportSubmitting"
            />
            <Button 
              label="Льгота недоступна" 
              icon="pi pi-ban"
              @click="submitReport('not_available')"
              class="p-button-outlined p-button-secondary justify-content-start"
              :loading="reportSubmitting"
            />
            <Button 
              label="Другая причина" 
              icon="pi pi-ellipsis-h"
              @click="submitReport('other')"
              class="p-button-outlined p-button-secondary justify-content-start"
              :loading="reportSubmitting"
            />
          </div>
        </div>
      </section>
    </Dialog>

    <Dialog 
      v-model:visible="showSnilsModal" 
      :modal="true" 
      :closable="true"
      :dismissableMask="true"
      class="snils-modal"
      :style="{ width: '90vw', maxWidth: '400px' }"
    >
      <template #header>
        <div class="flex justify-content-between align-items-center w-full">
          <h3 class="text-lg font-bold m-0">Укажите СНИЛС</h3>
          <Button 
            icon="pi pi-times" 
            @click="showSnilsModal = false"
            class="p-button-text p-button-plain border-circle"
            style="width: 2.5rem; height: 2.5rem;"
          />
        </div>
      </template>

      <div class="flex flex-column gap-4">
        <Message
          severity="info"
          :closable="false"
          class="text-sm"
        >
          Для подачи заявки на льготу необходимо указать СНИЛС
        </Message>

        <div class="flex flex-column gap-2">
          <label for="snils-input" class="font-semibold">СНИЛС</label>
          <InputText
            id="snils-input"
            v-model="snilsInput"
            placeholder="000-000-000 00"
            :class="{ 'p-invalid': snilsError }"
            @input="formatSnilsInput"
            maxlength="14"
            class="w-full"
            autocomplete="off"
          />
          <small v-if="snilsError" class="p-error">{{ snilsError }}</small>
          <small v-else class="text-color-secondary">Введите 11 цифр СНИЛС</small>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2 justify-content-end">
          <Button 
            label="Отмена" 
            @click="showSnilsModal = false"
            class="p-button-outlined"
            severity="secondary"
          />
          <Button 
            label="Сохранить и отправить заявку" 
            @click="saveSnils"
            :loading="savingSnils"
            class="p-button-primary"
            icon="pi pi-check"
          />
        </div>
      </template>
    </Dialog>

    <MascotAssistant />
  </div>
</template>


<style scoped>

</style>