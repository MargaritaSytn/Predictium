import django.contrib.auth.models
import django.contrib.auth.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('token_balance', models.IntegerField(default=0)),
                ('premium_status', models.BooleanField(default=False)),
                ('registration_date', models.DateField(auto_now_add=True)),
                ('consecutive_login_days', models.IntegerField(default=0)),
                ('last_login_date', models.DateField(blank=True, null=True)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'db_table': 'users',
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('category', models.CharField(max_length=100)),
                ('deadline', models.DateTimeField()),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('open', 'Open'), ('closed', 'Closed'), ('resolving', 'Resolving'), ('completed', 'Completed')], default='draft', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('result', models.CharField(blank=True, default='', max_length=255)),
            ],
            options={
                'db_table': 'events',
                'indexes': [models.Index(fields=['status'], name='events_status_8890b6_idx'), models.Index(fields=['deadline'], name='events_deadlin_d622cb_idx'), models.Index(fields=['category'], name='events_categor_a7129c_idx')],
            },
        ),
        migrations.CreateModel(
            name='EventOutcome',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(max_length=255)),
                ('total_tokens_wagered', models.IntegerField(default=0)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='outcomes', to='core.event')),
            ],
            options={
                'db_table': 'event_outcomes',
            },
        ),
        migrations.CreateModel(
            name='PremiumSubscription',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_date', models.DateTimeField()),
                ('end_date', models.DateTimeField()),
                ('status', models.CharField(choices=[('active', 'Active'), ('expired', 'Expired'), ('cancelled', 'Cancelled')], default='active', max_length=20)),
                ('auto_renew', models.BooleanField(default=False)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='premium_subscription', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'premium_subscriptions',
            },
        ),
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('bio', models.TextField(blank=True, default='')),
                ('success_rate', models.FloatField(default=0.0)),
                ('won_predictions', models.IntegerField(default=0)),
                ('total_predictions', models.IntegerField(default=0)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'profiles',
            },
        ),
        migrations.CreateModel(
            name='Review',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.IntegerField()),
                ('comment_text', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('is_approved', models.BooleanField(default=False)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to='core.event')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'reviews',
            },
        ),
        migrations.CreateModel(
            name='Wallet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('current_balance', models.IntegerField(default=0)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='wallet', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'wallets',
            },
        ),
        migrations.CreateModel(
            name='AIHintUsage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('hints_used', models.IntegerField(default=0)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ai_hint_usage', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'ai_hint_usage',
                'unique_together': {('user', 'date')},
            },
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('deadline_reminder', 'Deadline Reminder'), ('new_event', 'New Event'), ('voting_closed', 'Voting Closed'), ('result_announced', 'Result Announced'), ('system', 'System')], max_length=30)),
                ('title', models.CharField(max_length=255)),
                ('message', models.TextField()),
                ('send_time', models.DateTimeField(auto_now_add=True)),
                ('delivery_status', models.CharField(default='pending', max_length=20)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'notifications',
                'indexes': [models.Index(fields=['user'], name='notificatio_user_id_e78525_idx')],
            },
        ),
        migrations.CreateModel(
            name='Prediction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount_tokens', models.IntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('probability_at_creation', models.FloatField(default=0.0)),
                ('prediction_status', models.CharField(choices=[('active', 'Active'), ('locked', 'Locked'), ('won', 'Won'), ('lost', 'Lost'), ('cancelled', 'Cancelled')], default='active', max_length=20)),
                ('payout_amount', models.FloatField(default=0.0)),
                ('locked_coefficient', models.FloatField(default=0.0)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='predictions', to='core.event')),
                ('selected_outcome', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='predictions', to='core.eventoutcome')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='predictions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'predictions',
                'indexes': [models.Index(fields=['user'], name='predictions_user_id_693109_idx'), models.Index(fields=['event'], name='predictions_event_i_856d37_idx'), models.Index(fields=['prediction_status'], name='predictions_predict_c5fa47_idx')],
            },
        ),
        migrations.CreateModel(
            name='Transaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('wager', 'Wager'), ('winning', 'Winning'), ('purchase', 'Purchase'), ('withdrawal', 'Withdrawal'), ('bonus', 'Bonus'), ('premium', 'Premium Purchase')], max_length=20)),
                ('amount', models.FloatField()),
                ('currency_equivalent', models.FloatField(default=0.0)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('confirmed', 'Confirmed'), ('rejected', 'Rejected'), ('cancelled', 'Cancelled')], default='pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('confirmed_at', models.DateTimeField(blank=True, null=True)),
                ('external_payment_id', models.CharField(blank=True, default='', max_length=255)),
                ('wallet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transactions', to='core.wallet')),
            ],
            options={
                'db_table': 'transactions',
                'indexes': [models.Index(fields=['wallet'], name='transaction_wallet__c63ebe_idx'), models.Index(fields=['type'], name='transaction_type_840495_idx'), models.Index(fields=['status'], name='transaction_status_505a2f_idx')],
            },
        ),
    ]
