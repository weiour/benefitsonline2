from django.db import migrations


def seed_benefits(apps, schema_editor):
    BenefitCategory = apps.get_model('benefits', 'BenefitCategory')
    TargetGroup = apps.get_model('benefits', 'TargetGroup')
    Benefit = apps.get_model('benefits', 'Benefit')

    categories = {
        'transport': {'title': 'Транспорт', 'icon': 'pi pi-car'},
        'medicine': {'title': 'Медицина', 'icon': 'pi pi-heart'},
        'utilities': {'title': 'Коммунальные услуги', 'icon': 'pi pi-home'},
        'housing': {'title': 'Жильё и ипотека', 'icon': 'pi pi-building'},
        'education': {'title': 'Образование', 'icon': 'pi pi-book'},
        'childcare': {'title': 'Детские программы', 'icon': 'pi pi-users'},
        'culture': {'title': 'Культура и досуг', 'icon': 'pi pi-star'},
        'sport': {'title': 'Спорт', 'icon': 'pi pi-bolt'},
        'tax': {'title': 'Налоги', 'icon': 'pi pi-percentage'},
        'communication': {'title': 'Связь и интернет', 'icon': 'pi pi-wifi'},
        'employment': {'title': 'Занятость', 'icon': 'pi pi-briefcase'},
        'social_support': {'title': 'Социальная поддержка', 'icon': 'pi pi-gift'}
    }

    target_groups = {
        'pensioner': 'Пенсионеры',
        'disabled': 'Люди с инвалидностью',
        'low_income': 'Малоимущие семьи',
        'young_family': 'Молодые семьи',
        'children': 'Дети',
        'unemployed': 'Безработные граждане',
        'multi_child': 'Многодетные семьи',
        'student': 'Студенты',
        'remote_worker': 'Удалённые сотрудники',
        'veteran': 'Ветераны',
        'chronic_patient': 'Хронически больные',
        'all_taxpayers': 'Все налогоплательщики'
    }

    benefits = [
        {
            'id': 'pens-transport-2025',
            'title': 'Бесплатный проезд на общественном транспорте',
            'type': 'federal',
            'category': 'transport',
            'target_groups': ['pensioner', 'disabled'],
            'regions': ['all'],
            'description': 'Льготный проезд для пенсионеров и людей с инвалидностью',
            'how_to_get': 'Обратиться в МФЦ с паспортом и удостоверением'
        },
        {
            'id': 'medicines-discount',
            'title': 'Скидка 50% на лекарства',
            'type': 'regional',
            'category': 'medicine',
            'target_groups': ['pensioner', 'disabled', 'low_income'],
            'regions': ['77', '54'],
            'description': 'Скидка на лекарства по рецепту врача',
            'how_to_get': 'Предъявить удостоверение в аптеке-партнере'
        },
        {
            'id': 'utility-compensation-elderly',
            'title': 'Компенсация коммунальных платежей для пожилых',
            'type': 'regional',
            'category': 'utilities',
            'target_groups': ['pensioner', 'disabled'],
            'regions': ['77', '50', '78'],
            'description': 'Возмещение до 30% затрат на отопление, воду и электроэнергию',
            'how_to_get': 'Подать заявление в соцзащиту с квитанциями и удостоверением'
        },
        {
            'id': 'mortgage-young-family-subsidy',
            'title': 'Субсидия на ипотеку для молодой семьи',
            'type': 'federal',
            'category': 'housing',
            'target_groups': ['young_family', 'children'],
            'regions': ['all'],
            'description': 'Снижение процентной ставки и первоначального взноса по ипотеке',
            'how_to_get': 'Обратиться в банк-партнер с подтверждением статуса молодой семьи'
        },
        {
            'id': 'education-retraining-free',
            'title': 'Бесплатное переобучение для безработных',
            'type': 'regional',
            'category': 'education',
            'target_groups': ['unemployed', 'disabled'],
            'regions': ['all'],
            'description': 'Курсы цифровых и рабочих навыков с выдачей сертификата',
            'how_to_get': 'Зарегистрироваться в центре занятости и выбрать программу'
        },
        {
            'id': 'kindergarten-fee-discount',
            'title': 'Скидка 70% на детский сад',
            'type': 'municipal',
            'category': 'childcare',
            'target_groups': ['multi_child', 'low_income'],
            'regions': ['77', '23', '16'],
            'description': 'Пониженная плата за муниципальные детские сады',
            'how_to_get': 'Подать заявление на портале госуслуг с подтверждением доходов'
        },
        {
            'id': 'culture-free-museums',
            'title': 'Бесплатное посещение музеев',
            'type': 'federal',
            'category': 'culture',
            'target_groups': ['student', 'pensioner'],
            'regions': ['all'],
            'description': 'Свободный вход в федеральные музеи в определенные дни',
            'how_to_get': 'Показать студенческий или пенсионное удостоверение на кассе'
        },
        {
            'id': 'sports-pass-subsidy',
            'title': 'Сертификат на спортивную секцию',
            'type': 'regional',
            'category': 'sport',
            'target_groups': ['children', 'disabled'],
            'regions': ['63', '66', '55'],
            'description': 'Оплата абонемента в спортивные школы и секции',
            'how_to_get': 'Получить сертификат в МФЦ и предъявить в секции-партнере'
        },
        {
            'id': 'tax-deduction-medical',
            'title': 'Налоговый вычет за лечение',
            'type': 'federal',
            'category': 'tax',
            'target_groups': ['all_taxpayers'],
            'regions': ['all'],
            'description': 'Возврат НДФЛ за расходы на лечение и медикаменты',
            'how_to_get': 'Подать декларацию 3-НДФЛ с подтверждающими документами'
        },
        {
            'id': 'internet-subsidy-remote',
            'title': 'Компенсация интернета для удаленных работников',
            'type': 'regional',
            'category': 'communication',
            'target_groups': ['remote_worker', 'disabled'],
            'regions': ['24', '75', '41'],
            'description': 'Возврат до 50% затрат на высокоскоростной интернет',
            'how_to_get': 'Предоставить договор с провайдером и справку о формате работы'
        },
        {
            'id': 'job-placement-disabled',
            'title': 'Программа трудоустройства людей с инвалидностью',
            'type': 'federal',
            'category': 'employment',
            'target_groups': ['disabled'],
            'regions': ['all'],
            'description': 'Квотирование рабочих мест и наставничество на предприятии',
            'how_to_get': 'Обратиться в службу занятости и подобрать вакансию'
        },
        {
            'id': 'rural-medicine-transport',
            'title': 'Соцтакси в сельской местности',
            'type': 'regional',
            'category': 'transport',
            'target_groups': ['pensioner', 'disabled'],
            'regions': ['64', '13', '02'],
            'description': 'Бесплатные поездки в районную больницу по расписанию',
            'how_to_get': 'Заявка в сельской администрации за сутки до поездки'
        },
        {
            'id': 'heating-repair-veterans',
            'title': 'Ремонт системы отопления ветеранам',
            'type': 'municipal',
            'category': 'housing',
            'target_groups': ['veteran'],
            'regions': ['77', '78'],
            'description': 'Разовая бесплатная услуга по ремонту и настройке отопления',
            'how_to_get': 'Позвонить в районный центр ветеранов и согласовать дату'
        },
        {
            'id': 'food-parcels-lowincome',
            'title': 'Продуктовые наборы семьям с низким доходом',
            'type': 'regional',
            'category': 'social_support',
            'target_groups': ['low_income', 'multi_child'],
            'regions': ['61', '52', '72'],
            'description': 'Ежемесячная выдача продуктовых наборов первой необходимости',
            'how_to_get': 'Предоставить справку о доходах в отдел соцзащиты'
        },
        {
            'id': 'sanatorium-vouchers-health',
            'title': 'Путевки в санатории по медпоказаниям',
            'type': 'federal',
            'category': 'medicine',
            'target_groups': ['disabled', 'chronic_patient'],
            'regions': ['all'],
            'description': 'Оплата проживания и лечения в санаторно-курортных учреждениях',
            'how_to_get': 'Получить направление у врача и подать заявление в ФСС'
        }
    ]

    for key, data in categories.items():
        BenefitCategory.objects.update_or_create(
            key=key,
            defaults={'title': data['title'], 'icon': data['icon']}
        )

    for key, title in target_groups.items():
        TargetGroup.objects.update_or_create(
            key=key,
            defaults={'title': title}
        )

    for benefit_data in benefits:
        category = BenefitCategory.objects.get(key=benefit_data['category'])
        benefit, _ = Benefit.objects.update_or_create(
            id=benefit_data['id'],
            defaults={
                'title': benefit_data['title'],
                'type': benefit_data['type'],
                'category': category,
                'regions': benefit_data['regions'],
                'description': benefit_data['description'],
                'how_to_get': benefit_data['how_to_get'],
                'active': True
            }
        )
        target_group_objs = list(
            TargetGroup.objects.filter(key__in=benefit_data['target_groups'])
        )
        benefit.target_groups.set(target_group_objs)


def unseed_benefits(apps, schema_editor):
    Benefit = apps.get_model('benefits', 'Benefit')
    benefit_ids = [
        'pens-transport-2025',
        'medicines-discount',
        'utility-compensation-elderly',
        'mortgage-young-family-subsidy',
        'education-retraining-free',
        'kindergarten-fee-discount',
        'culture-free-museums',
        'sports-pass-subsidy',
        'tax-deduction-medical',
        'internet-subsidy-remote',
        'job-placement-disabled',
        'rural-medicine-transport',
        'heating-repair-veterans',
        'food-parcels-lowincome',
        'sanatorium-vouchers-health'
    ]
    Benefit.objects.filter(id__in=benefit_ids).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('benefits', '0003_remove_benefit_target_groups_benefit_target_groups'),
    ]

    operations = [
        migrations.RunPython(seed_benefits, unseed_benefits),
    ]


