from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='milestone',
            name='proof_image',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='milestone',
            name='proof_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='milestone',
            name='submission_note',
            field=models.TextField(blank=True, null=True),
        ),
    ]
