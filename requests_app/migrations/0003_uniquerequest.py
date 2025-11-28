from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('requests_app', '0002_initial'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='benefitrequest',
            constraint=models.UniqueConstraint(fields=('user', 'benefit'), name='unique_user_benefit_request'),
        ),
        migrations.AlterModelOptions(
            name='benefitrequest',
            options={'ordering': ['-submitted_at']},
        ),
    ]


