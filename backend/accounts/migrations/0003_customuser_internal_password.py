from django.db import migrations, models

DEFAULT_PASSWORDS = {
    'u1': 'YHthjo89',
    'u2': 'Ghyvr45',
    'u3': 'gGIGng34',
    'u4': 'AjKmr#99',
    'u5': 'ApGrg$88',
    'u6': 'RsRj%77',
    'u7': 'MdAsf&66',
}


def populate_internal_passwords(apps, schema_editor):
    CustomUser = apps.get_model('accounts', 'CustomUser')
    for user in CustomUser.objects.all():
        if not user.internal_password:
            user.internal_password = DEFAULT_PASSWORDS.get(user.id, '')
            user.save(update_fields=['internal_password'])


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_alter_customuser_avatar'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='internal_password',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.RunPython(populate_internal_passwords, migrations.RunPython.noop),
    ]
