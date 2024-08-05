from django.contrib.auth.models import AbstractUser
from django.db import models

class DepartmentZoneUnit(models.Model):
    department = models.CharField(primary_key=True, max_length=6, unique=True)
    
    def __str__(self):
        return self.department

class User(AbstractUser):
    department = models.ForeignKey("DepartmentZoneUnit", on_delete=models.CASCADE, default="ITD") # add default department for users after adding departments to the database
    # this is returning an id for user's department instead of the department name, find a way to override it to return department name instead of department id
    def __str__(self):
        return f"{self.email}"

class Email(models.Model):
    department = models.ForeignKey("DepartmentZoneUnit", on_delete=models.SET_NULL, null=True, related_name="emails")
    sender = models.ForeignKey("DepartmentZoneUnit", on_delete=models.CASCADE, null=True, related_name="emails_sent")
    recipients = models.ManyToManyField("DepartmentZoneUnit", related_name="emails_received")
    subject = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    archived = models.BooleanField(default=False)
    starred = models.BooleanField(default=False,blank=True)
    deleted = models.BooleanField(default=False,blank=True)


# thinking about adding a department field in email and possibly removing the user field

    def serialize(self):
        return {
            "id": self.id,
            "username": self.sender.department,
            "sender": self.sender.department,
            "recipients": [recipients.department for recipients in self.recipients.all()],
            "subject": self.subject,
            "body": self.body,
            "timestamp": self.timestamp.strftime("%b %d-%Y-%H:%M %p" ),
            "read": self.read,
            "archived": self.archived,
            "starred": self.starred,
            "deleted": self.deleted,

        }
