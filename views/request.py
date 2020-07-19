import requests
import random


target_url = "http://localhost:3000/register"
data_dict = {"username":"", "email":"", "password": "123", "phone":"0525237274", 
"address":"unknownloc", "city":"Jeddah", "bgroup":"","register":"submit"} 

#requests.post(target_url, data=data_dict)


with open("emails.txt") as email, open("usernames.txt") as username:
    for email, username in zip(email, username):
        bgroups = ['O Negative', 'O Positive', 'A Negative', 'A Positive','B Negative','B Positive','AB Negative','AB Positive']
        data_dict["username"] = username
        data_dict["email"] = email
        data_dict["bgroup"] = random.choice(bgroups)
        
        requests.post(target_url, data=data_dict)
        
        
        
