# Generated by Django 5.1 on 2024-08-27 21:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mail', '0006_auto_20240822_0931'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='email',
            name='mail_type',
        ),
        migrations.AlterField(
            model_name='email',
            name='amount',
            field=models.BigIntegerField(blank=True, null=True),
        ),
    ]
