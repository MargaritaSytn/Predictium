from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_devicetoken_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='devicetoken',
            name='token_type',
            field=models.CharField(choices=[('expo', 'Expo Push Token'), ('fcm', 'FCM Token')], default='expo', max_length=10),
        ),
    ]
