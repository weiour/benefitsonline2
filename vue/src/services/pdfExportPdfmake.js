import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

if (!pdfMake.vfs) {
  pdfMake.vfs = {
    'Roboto-Regular.ttf': 'AAEAAAASAQAABAAgR0RFRg...', 
    'Roboto-Medium.ttf': 'AAEAAAASAQAABAAgR0RFRg...' 
  };
}

export class PDFExportServicePdfMake {
  constructor() {
    this.docDefinition = null;
  }

  createDocumentDefinition(user, benefits) {
    const stats = {
      total: benefits.length,
      approved: benefits.filter(b => b.status === 'approved').length,
      processing: benefits.filter(b => b.status === 'processing' || b.status === 'new').length,
      rejected: benefits.filter(b => b.status === 'rejected').length
    };

    return {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        lineHeight: 1.3
      },
      header: {
        text: 'СПРАВКА О ЛЬГОТАХ',
        style: 'header',
        margin: [0, 20, 0, 10]
      },
      footer: function(currentPage, pageCount) {
        return {
          text: `Страница ${currentPage.toString()} из ${pageCount}`,
          alignment: 'center',
          fontSize: 8,
          color: '#666666',
          margin: [0, 10, 0, 0]
        };
      },
      content: [
        {
          text: `Сгенерировано: ${new Date().toLocaleDateString('ru-RU')}`,
          fontSize: 9,
          color: '#666666',
          margin: [0, 0, 0, 10]
        },

        {
          text: 'ДАННЫЕ ПОЛУЧАТЕЛЯ',
          style: 'sectionHeader',
          margin: [0, 0, 0, 10]
        },
        {
          columns: [
            {
              width: '50%',
              stack: [
                {
                  text: [
                    { text: 'ФИО: ', bold: true },
                    user.full_name || 'Не указано'
                  ]
                },
                {
                  text: [
                    { text: 'Категория: ', bold: true },
                    this.getUserCategoryLabel(user.category)
                  ],
                  margin: [0, 5, 0, 0]
                }
              ]
            },
            {
              width: '50%',
              stack: [
                {
                  text: [
                    { text: 'Регион: ', bold: true },
                    this.getRegionLabel(user.region)
                  ]
                },
                {
                  text: [
                    { text: 'Телефон: ', bold: true },
                    user.phone || 'Не указан'
                  ],
                  margin: [0, 5, 0, 0]
                }
              ]
            }
          ],
          margin: [0, 0, 0, 20]
        },

        {
          text: 'СТАТИСТИКА ЗАЯВОК',
          style: 'sectionHeader',
          margin: [0, 0, 0, 10]
        },
        {
          columns: [
            {
              width: '25%',
              text: [
                { text: 'Всего\n', bold: true },
                { text: stats.total.toString(), fontSize: 16, bold: true }
              ],
              alignment: 'center'
            },
            {
              width: '25%',
              text: [
                { text: 'Одобрено\n', bold: true },
                { text: stats.approved.toString(), fontSize: 16, bold: true}
              ],
              alignment: 'center'
            },
            {
              width: '25%',
              text: [
                { text: 'В обработке\n', bold: true },
                { text: stats.processing.toString(), fontSize: 16, bold: true}
              ],
              alignment: 'center'
            },
            {
              width: '25%',
              text: [
                { text: 'Отклонено\n', bold: true },
                { text: stats.rejected.toString(), fontSize: 16, bold: true}
              ],
              alignment: 'center'
            }
          ],
          margin: [0, 0, 0, 30]
        },

        {
          text: 'СПИСОК ЗАЯВЛЕННЫХ ЛЬГОТ',
          style: 'sectionHeader',
          margin: [0, 0, 0, 10]
        },
        this.createBenefitsTable(benefits),

      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          color: '#2E8B95'
        },
        sectionHeader: {
          fontSize: 12,
          bold: true,
          color: '#2E8B95'
        },
        tableHeader: {
          bold: true,
          fontSize: 9,
          color: 'white',
          fillColor: '#2E8B95'
        },
        tableCell: {
          fontSize: 8
        }
      }
    };
  }

  createBenefitsTable(benefits) {
    const tableBody = [
      [
        { text: '№', style: 'tableHeader', alignment: 'center' },
        { text: 'Наименование льготы', style: 'tableHeader' },
        { text: 'Категория', style: 'tableHeader' },
        { text: 'Тип', style: 'tableHeader' },
        { text: 'Статус', style: 'tableHeader' },
        { text: 'Дата подачи', style: 'tableHeader', alignment: 'center' }
      ]
    ];

    benefits.forEach((benefit, index) => {
      const statusColor = this.getStatusColor(benefit.status);
      
      tableBody.push([
        { text: (index + 1).toString(), style: 'tableCell', alignment: 'center' },
        { text: benefit.benefit?.title || 'Не указано', style: 'tableCell' },
        { text: benefit.benefit?.category?.title || '—', style: 'tableCell' },
        { text: this.getTypeLabel(benefit.benefit?.type), style: 'tableCell' },
        { 
          text: this.getStatusLabel(benefit.status), 
          style: 'tableCell',
          color: statusColor
        },
        { text: this.formatDate(benefit.submitted_at), style: 'tableCell', alignment: 'center' }
      ]);
    });

    return {
      table: {
        headerRows: 1,
        widths: ['5%', '40%', '15%', '15%', '15%', '10%'],
        body: tableBody
      },
      layout: {
        fillColor: function (rowIndex) {
          return rowIndex === 0 ? undefined : (rowIndex % 2 === 0 ? '#f5f5f5' : null);
        }
      }
    };
  }

  getStatusColor(status) {
    const colors = {
      // new: 'blue',
      // processing: 'orange',
      // approved: 'green',
      // rejected: 'red'
    };
    return colors[status] || 'black';
  }

  getUserCategoryLabel(category) {
    const categories = {
      pensioner: 'Пенсионер',
      disabled: 'Человек с инвалидностью',
      low_income: 'Малоимущий',
      veteran: 'Ветеран',
      family: 'Многодетная семья',
      student: 'Студент'
    };
    return categories[category] || category || 'Не указана';
  }

  getRegionLabel(region) {
    const regions = {
      moscow: 'г. Москва',
      spb: 'г. Санкт-Петербург',
      krym: 'Республика Крым'
    };
    return regions[region] || region || 'Не указан';
  }

  getTypeLabel(type) {
    const types = {
      federal: 'Федеральная',
      regional: 'Региональная',
      municipal: 'Муниципальная',
      commercial: 'Коммерческая'
    };
    return types[type] || type || '—';
  }

  getStatusLabel(status) {
    const statuses = {
      new: 'Отправлена',
      processing: 'В обработке',
      approved: 'Одобрена',
      rejected: 'Отклонена'
    };
    return statuses[status] || status || '—';
  }

  formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  }

  async exportBenefitsToPDF(user, benefits, fileName = 'мои_льготы.pdf') {
    return new Promise((resolve, reject) => {
      try {
        if (!benefits || benefits.length === 0) {
          reject(new Error('Нет данных для экспорта'));
          return;
        }

        const docDefinition = this.createDocumentDefinition(user, benefits);
        
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        
        pdfDocGenerator.download(fileName, () => {
          console.log('PDF успешно создан и скачан');
          resolve(true);
        });

      } catch (error) {
        console.error('Ошибка при генерации PDF:', error);
        reject(error);
      }
    });
  }
}

export default new PDFExportServicePdfMake();