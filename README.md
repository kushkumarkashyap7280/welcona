
## super admin creation


curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "[EMAIL_ADDRESS]",
    "password": "[PASSWORD]",
    "fullName": "Super Administrator",
    "secretKey": "welcona_setup_2026"
  }'
