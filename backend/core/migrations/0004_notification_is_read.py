from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_report_follow'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='is_read',
            field=models.BooleanField(default=False),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'is_read'], name='notif_user_is_read_idx'),
        ),
    ]
