from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0002_milestone_proof_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='Ticket',
            fields=[
                ('id', models.CharField(max_length=50, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('ticket_type', models.CharField(choices=[('issue', 'Issue'), ('suggestion', 'Suggestion')], default='issue', max_length=20)),
                ('priority', models.CharField(default='medium', max_length=20)),
                ('status', models.CharField(choices=[('open', 'Open'), ('in-review', 'In Review'), ('resolved', 'Resolved')], default='open', max_length=20)),
                ('created_by', models.CharField(max_length=50)),
                ('created_by_name', models.CharField(blank=True, max_length=200, null=True)),
                ('client_id', models.CharField(blank=True, max_length=50, null=True)),
                ('client_name', models.CharField(blank=True, max_length=200, null=True)),
                ('project_id', models.CharField(blank=True, max_length=50, null=True)),
                ('project_name', models.CharField(blank=True, max_length=200, null=True)),
                ('created_at', models.CharField(blank=True, max_length=50, null=True)),
                ('admin_note', models.TextField(blank=True, null=True)),
            ],
        ),
    ]
