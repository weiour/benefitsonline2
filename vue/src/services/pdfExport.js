import { jsPDF } from 'jspdf'

export class PDFExportServiceSimple {
  constructor() {
    this.doc = null
    this.margin = 20
    this.pageWidth = 210
    this.lineHeight = 6
    this.currentY = 0
  }

  initializeDocument() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    this.doc.setFont('helvetica')
    this.currentY = this.margin
    return this.doc
  }

  addHeader(user) {
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('СПРАВКА О ЛЬГОТАХ', this.margin, this.currentY)
    this.currentY += 10

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Сгенерировано: ${new Date().toLocaleDateString('ru-RU')}`, this.margin, this.currentY)
    this.currentY += 10

    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Данные получателя:', this.margin, this.currentY)
    this.currentY += 6

    this.doc.setFont('helvetica', 'normal')
    const userInfo = [
      `ФИО: ${user.full_name || 'Не указано'}`,
      `Категория: ${this.getUserCategoryLabel(user.category)}`,
      `Регион: ${this.getRegionLabel(user.region)}`,
      `Телефон: ${user.phone || 'Не указан'}`,
      `Email: ${user.email || 'Не указан'}`
    ]
    
    userInfo.forEach(line => {
      const lines = this.doc.splitTextToSize(line, this.pageWidth - (this.margin * 2))
      lines.forEach(textLine => {
        this.doc.text(textLine, this.margin, this.currentY)
        this.currentY += 5
      })
    })

    this.currentY += 10
  }

  addBenefitsTable(benefits) {
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(12)
    this.doc.text('СПИСОК ЗАЯВЛЕННЫХ ЛЬГОТ', this.margin, this.currentY)
    this.currentY += 8

    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'normal')

    benefits.forEach((benefit, index) => {
      if (this.currentY > 270) {
        this.doc.addPage()
        this.currentY = this.margin
      }

      const benefitNumber = `${index + 1}.`
      const benefitTitle = benefit.benefit?.title || 'Не указано'
      const category = benefit.benefit?.category?.title || '—'
      const type = this.getTypeLabel(benefit.benefit?.type)
      const status = this.getStatusLabel(benefit.status)
      const date = this.formatDate(benefit.submitted_at)

      this.doc.setFont('helvetica', 'bold')
      this.doc.text(benefitNumber, this.margin, this.currentY)
      
      const titleLines = this.doc.splitTextToSize(benefitTitle, this.pageWidth - (this.margin * 2) - 10)
      titleLines.forEach((line, lineIndex) => {
        this.doc.text(line, this.margin + 10, this.currentY + (lineIndex * 4))
      })
      this.currentY += (titleLines.length * 4)

      this.doc.setFont('helvetica', 'normal')
      const details = [
        `Категория: ${category}`,
        `Тип: ${type}`,
        `Статус: ${status}`,
        `Дата подачи: ${date}`
      ]

      details.forEach(detail => {
        const detailLines = this.doc.splitTextToSize(detail, this.pageWidth - (this.margin * 2) - 15)
        detailLines.forEach(line => {
          this.doc.text(line, this.margin + 15, this.currentY)
          this.currentY += 4
        })
      })

      this.currentY += 6

      if (index < benefits.length - 1) {
        this.doc.setDrawColor(200, 200, 200)
        this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
        this.currentY += 8
      }
    })

    this.currentY += 10
  }

  addStatistics(stats) {
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(11)
    this.doc.text('СТАТИСТИКА ЗАЯВОК', this.margin, this.currentY)
    this.currentY += 8

    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10)
    
    const statLines = [
      `Всего заявок: ${stats.total}`,
      `Одобрено: ${stats.approved}`,
      `В обработке: ${stats.processing}`,
      `Отклонено: ${stats.rejected}`
    ]

    statLines.forEach(line => {
      this.doc.text(line, this.margin, this.currentY)
      this.currentY += 5
    })
  }

  addFooter() {
    const pageCount = this.doc.internal.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      this.doc.setFontSize(8)
      this.doc.setTextColor(128, 128, 128)
      this.doc.text(
        `Страница ${i} из ${pageCount}`,
        this.pageWidth / 2,
        this.doc.internal.pageSize.height - 10,
        { align: 'center' }
      )
      
      this.doc.text(
        'Документ сгенерирован автоматически',
        this.pageWidth / 2,
        this.doc.internal.pageSize.height - 5,
        { align: 'center' }
      )
    }
  }

  getUserCategoryLabel(category) {
    const categories = {
      pensioner: 'Пенсионер',
      disabled: 'Человек с инвалидностью',
      low_income: 'Малоимущий',
      veteran: 'Ветеран',
      family: 'Многодетная семья',
      student: 'Студент'
    }
    return categories[category] || category || 'Не указана'
  }

  getRegionLabel(region) {
    const regions = {
      moscow: 'г. Москва',
      spb: 'г. Санкт-Петербург',
      krym: 'Республика Крым'
    }
    return regions[region] || region || 'Не указан'
  }

  getTypeLabel(type) {
    const types = {
      federal: 'Федеральная',
      regional: 'Региональная',
      municipal: 'Муниципальная',
      commercial: 'Коммерческая'
    }
    return types[type] || type || '—'
  }

  getStatusLabel(status) {
    const statuses = {
      new: 'Отправлена',
      processing: 'В обработке',
      approved: 'Одобрена',
      rejected: 'Отклонена'
    }
    return statuses[status] || status || '—'
  }

  formatDate(dateString) {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  async exportBenefitsToPDF(user, benefits, fileName = 'мои_льготы.pdf') {
    try {
      this.initializeDocument()
      this.addHeader(user)
      this.addBenefitsTable(benefits)
      
      const stats = {
        total: benefits.length,
        approved: benefits.filter(b => b.status === 'approved').length,
        processing: benefits.filter(b => b.status === 'processing' || b.status === 'new').length,
        rejected: benefits.filter(b => b.status === 'rejected').length
      }
      
      this.addStatistics(stats)
      this.addFooter()
      
      this.doc.save(fileName)
      return true
    } catch (error) {
      console.error('Ошибка при генерации PDF:', error)
      return false
    }
  }
}

export default new PDFExportServiceSimple()