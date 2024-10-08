# Generated by Django 5.0.6 on 2024-08-05 10:09

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mail', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='email',
            name='recipients',
            field=models.ManyToManyField(related_name='emails_received', to='mail.departmentzoneunit'),
        ),
        migrations.AlterField(
            model_name='email',
            name='sender',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='emails_sent', to='mail.departmentzoneunit'),
        ),
    ]
