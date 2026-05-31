from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0007_alter_event_category"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="reminder_sent",
            field=models.BooleanField(default=False),
        ),
    ]
