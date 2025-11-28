# Generated migration for adding Yakutsk partners

from django.db import migrations
from datetime import date, timedelta


def create_yakutsk_partners(apps, schema_editor):
    Partner = apps.get_model('partners', 'Partner')
    PartnerOffer = apps.get_model('partners', 'PartnerOffer')
    
    # Создаем партнеров - магазины Якутска
    partners_data = [
        {
            'name': 'Торговый дом "Центральный"',
            'description': 'Крупнейший торговый центр Якутска',
            'phone': '+7 (4112) 42-11-11',
            'website': 'https://td-central.ru',
            'active': True
        },
        {
            'name': 'Супермаркет "Столичный"',
            'description': 'Сеть супермаркетов в Якутске',
            'phone': '+7 (4112) 35-22-33',
            'website': 'https://stolichnyi-ykt.ru',
            'active': True
        },
        {
            'name': 'Аптека "Здоровье+"',
            'description': 'Сеть аптек в Якутске',
            'phone': '+7 (4112) 44-55-66',
            'website': 'https://zdorovie-ykt.ru',
            'active': True
        },
        {
            'name': 'Магазин "Полярная звезда"',
            'description': 'Сеть магазинов бытовой техники и электроники',
            'phone': '+7 (4112) 33-44-55',
            'website': 'https://polyarnaya-zvezda.ru',
            'active': True
        },
        {
            'name': 'Торговый центр "Туймаада"',
            'description': 'Современный торговый центр',
            'phone': '+7 (4112) 25-36-47',
            'website': 'https://tuymada-tc.ru',
            'active': True
        },
        {
            'name': 'Магазин "Северные продукты"',
            'description': 'Специализированный магазин продуктов',
            'phone': '+7 (4112) 22-33-44',
            'website': 'https://severnye-produkty.ru',
            'active': True
        },
        {
            'name': 'Аптека "Северная"',
            'description': 'Сеть аптек с широким ассортиментом',
            'phone': '+7 (4112) 11-22-33',
            'website': 'https://severnaya-apteka.ru',
            'active': True
        },
        {
            'name': 'Магазин одежды "Якутский стиль"',
            'description': 'Одежда и обувь для всей семьи',
            'phone': '+7 (4112) 55-66-77',
            'website': 'https://yakutskiy-stil.ru',
            'active': True
        }
    ]
    
    partners = []
    for partner_data in partners_data:
        partner, created = Partner.objects.get_or_create(
            name=partner_data['name'],
            defaults=partner_data
        )
        partners.append(partner)
    
    # Создаем предложения для партнеров
    offers_data = [
        {
            'partner_name': 'Торговый дом "Центральный"',
            'title': 'Скидка на продукты',
            'description': 'Скидка 10% на все продукты питания для пенсионеров и многодетных семей',
            'discount': {'percent': 10, 'type': 'percentage'},
            'target_groups': ['pensioner', 'large_family'],
            'regions': ['yakutsk'],
            'valid_until': date.today() + timedelta(days=60)
        },
        {
            'partner_name': 'Супермаркет "Столичный"',
            'title': 'Акция для льготников',
            'description': '15% скидка на товары первой необходимости при предъявлении удостоверения',
            'discount': {'percent': 15, 'type': 'percentage'},
            'target_groups': ['pensioner', 'disabled', 'low_income'],
            'regions': ['yakutsk'],
            'valid_until': date.today() + timedelta(days=90)
        },
        {
            'partner_name': 'Аптека "Здоровье+"',
            'title': 'Льготные лекарства',
            'description': 'Скидка 20% на все лекарства по рецепту для пенсионеров и инвалидов',
            'discount': {'percent': 20, 'type': 'percentage'},
            'target_groups': ['pensioner', 'disabled'],
            'regions': ['yakutsk'],
            'valid_until': date.today() + timedelta(days=120)
        },
        {
            'partner_name': 'Магазин "Полярная звезда"',
            'title': 'Скидка на технику',
            'description': 'Специальная скидка 12% на бытовую технику для льготных категорий граждан',
            'discount': {'percent': 12, 'type': 'percentage'},
            'target_groups': ['pensioner', 'disabled', 'large_family'],
            'regions': ['yakutsk'],
            'valid_until': date.today() + timedelta(days=45)
        },
        {
            'partner_name': 'Торговый центр "Туймаада"',
            'title': 'Новогодняя акция',
            'description': 'Скидка 25% на одежду и обувь для детей из многодетных семей',
            'discount': {'percent': 25, 'type': 'percentage'},
            'target_groups': ['large_family'],
            'regions': ['yakutsk'],
            'valid_until': date.today() + timedelta(days=30)
        },
        {
            'partner_name': 'Магазин "Северные продукты"',
            'title': 'Продукты со скидкой',
            'description': 'Скидка 8% на все продукты питания для пенсионеров каждый вторник',
            'discount': {'percent': 8, 'type': 'percentage'},
            'target_groups': ['pensioner'],
            'regions': ['yakutsk'],
            'valid_until': date.today() + timedelta(days=180)
        },
        {
            'partner_name': 'Аптека "Северная"',
            'title': 'Медицинские товары',
            'description': 'Скидка 18% на медицинские товары и средства гигиены для льготников',
            'discount': {'percent': 18, 'type': 'percentage'},
            'target_groups': ['pensioner', 'disabled', 'low_income'],
            'regions': ['yakutsk'],
            'valid_until': date.today() + timedelta(days=75)
        },
        {
            'partner_name': 'Магазин одежды "Якутский стиль"',
            'title': 'Сезонная распродажа',
            'description': 'Скидка 30% на зимнюю одежду для пенсионеров и инвалидов',
            'discount': {'percent': 30, 'type': 'percentage'},
            'target_groups': ['pensioner', 'disabled'],
            'regions': ['yakutsk'],
            'valid_until': date.today() + timedelta(days=60)
        }
    ]
    
    for offer_data in offers_data:
        partner_name = offer_data.pop('partner_name')
        partner = next((p for p in partners if p.name == partner_name), None)
        if partner:
            PartnerOffer.objects.get_or_create(
                partner=partner,
                title=offer_data['title'],
                defaults={
                    **offer_data,
                    'active': True
                }
            )


def remove_yakutsk_partners(apps, schema_editor):
    Partner = apps.get_model('partners', 'Partner')
    PartnerOffer = apps.get_model('partners', 'PartnerOffer')
    
    partner_names = [
        'Торговый дом "Центральный"',
        'Супермаркет "Столичный"',
        'Аптека "Здоровье+"',
        'Магазин "Полярная звезда"',
        'Торговый центр "Туймаада"',
        'Магазин "Северные продукты"',
        'Аптека "Северная"',
        'Магазин одежды "Якутский стиль"'
    ]
    
    for name in partner_names:
        Partner.objects.filter(name=name).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('partners', '0002_partner_active'),
    ]

    operations = [
        migrations.RunPython(create_yakutsk_partners, remove_yakutsk_partners),
    ]
