from django.http import HttpResponse  
from django.shortcuts import redirect, render, get_object_or_404, HttpResponseRedirect
from django.db import IntegrityError
from django.urls import reverse
from django.http import JsonResponse
from django.contrib.auth.models import Group
from django.contrib import messages
from .models import User, Email, DepartmentZoneUnit



def allowed_users(allowed_roles=[]):  
    def decorator(view_func):  
        def wrapper_func(request, *args, **kwargs):  
            group = None  
            if request.user.groups.exists():  
                group = request.user.groups.all()[0].name  

            if group in allowed_roles:  
                return view_func(request, *args, **kwargs)  
            else:  
                return HttpResponse('You are not authorized access this page')  
        return wrapper_func  
    return decorator

def user_only(view_func):  
    def wrapper_function(request, *args, **kwargs):  
        if request.user.is_authenticated:
            user = get_object_or_404(User, username=request.user.username)
        
            emailsReceived = Email.objects.filter(
                    deleted=False,
                ).count()
            
            emailsSent = Email.objects.filter(
                deleted=False,
                ).count()
            
            totalUsers = User.objects.all().count()
            last_5_users = User.objects.all().order_by('-date_joined')[:5]
            groups = Group.objects.all()
            all_department = DepartmentZoneUnit.objects.all()
            if request.method == "POST":
                username = request.POST["username"]
                email = request.POST["email"]
                first_name = request.POST["fname"]
                last_name = request.POST["lname"]
                # Ensure password matches confirmation
                password = request.POST["password"]
                confirmation = request.POST["confirmation"]
                group = request.POST["group"]
                department = request.POST["userDepartment"]
                if password != confirmation:
                    messages.error(request, "passwords don't match")
                if username == "":
                    messages.error(request, "Username cannot be empty")
                # Attempt to create new user
                try:
                    print(all_department)
                    department_object = DepartmentZoneUnit.objects.get(department=department)
                    user = User.objects.create_user(username=username,email=email,password=password,first_name=first_name,last_name=last_name,department=department_object)
                    user_group = Group.objects.get(name=group) 
                    user_group.user_set.add(user)
                    user.save()
                    messages.success(request, "User added successfully")
                except IntegrityError as e:
                    print(e)
                    messages.error(request, "Email address already taken.")
                    return JsonResponse({
                        "error": "Email address already taken."
                    }, status=400)
                # login(request, user)
                # return redirect(f"admin_dashboard_{request.user.username}")
            context = {
                'user': user,
                'emailsReceived': emailsReceived,
                'emailsSent': emailsSent,
                'totalUsers' : totalUsers,
                'last_5_users' : last_5_users,
                'groups': groups,
                'all_department': all_department,
            }
            
            group = None  
            if request.user.groups.exists():  
                group = request.user.groups.all()[0].name  

            if group == 'Admin':  
                return render(request, 'mail/adminDash.html', context)
            if group == 'User':  
                return view_func(request, *args, **kwargs)  
        
        else:
            return HttpResponseRedirect(reverse("login"))

    return wrapper_function

def admin_only(view_func):  
    def wrapper_function(request, *args, **kwargs):  
        group = None  
        if request.user.groups.exists():  
            group = request.user.groups.all()[0].name  

        if group == 'User':  
            return redirect('index')   
        if group == 'Admin':  
            return view_func(request, *args, **kwargs)  

    return wrapper_function