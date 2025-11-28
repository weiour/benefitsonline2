from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('benefits', '0004_seed_initial_benefits'),
    ]

    operations = [
        migrations.AddField(
            model_name='benefit',
            name='is_sponsored',
            field=models.BooleanField(default=False, verbose_name='От спонсора'),
        ),
    ]

