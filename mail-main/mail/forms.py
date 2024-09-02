from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import password_validation
from .models import *
from django.contrib.auth.models import Group


# departments = forms.ModelChoiceField(queryset=DepartmentZoneUnit.objects.all()),

class RegistrationForm(UserCreationForm):
    first_name = forms.CharField(
        label="First Name", 
        widget=forms.TextInput(attrs={'class': 'form-control'}),
    )
    last_name = forms.CharField(
        label="Last Name", 
        widget=forms.TextInput(attrs={'class': 'form-control'}),
    )
    email = forms.EmailField(required=False, widget=forms.EmailInput(attrs={'class': 'form-control'}))
    password1 = forms.CharField(
        label="Password",
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'id': 'password-input'}),
        help_text=password_validation.password_validators_help_text_html(),
    )
    password2 = forms.CharField(
        label="Confirm Password",
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
    )

    username = forms.CharField(
        label="Username",
        widget=forms.TextInput(attrs={'class': 'form-control'}),
    )

    department = forms.ModelChoiceField(
        label="Department",
        widget=forms.Select(attrs={'class': 'form-control'}),
        queryset=DepartmentZoneUnit.objects.all()
    )
    
    role = forms.ModelChoiceField(
        label="User Type",
        widget=forms.Select(attrs={'class': 'form-control'}),
        queryset=Group.objects.all()
        )
    # Add an additional field for password strength
    password_strength = forms.CharField(
        widget=forms.HiddenInput(),
        required=False,
    )

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'username', 'email', 'role', 'department')