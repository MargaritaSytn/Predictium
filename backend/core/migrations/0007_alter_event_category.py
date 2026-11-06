from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_devicetoken_token_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='event',
            name='category',
            field=models.CharField(choices=[('sports', 'Спорт'), ('politics', 'Політика'), ('technology', 'Технології'), ('crypto', 'Криптовалюта'), ('space', 'Космос')], max_length=100),
        ),
    ]
