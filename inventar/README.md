#Tehnologije:
- Node.js
- Express.js
- PostgreSQL
- Docker
- Swagger (OpenAPI)
- Jest (testing framework)
- GitHub Actions (CI pipeline)

#Arhitektura:
Routes → Controllers → Services → Repositories → Database

- **Routes** – define API endpoints
- **Controllers** – handle HTTP requests and responses
- **Services** – contain business logic
- **Repositories** – communicate with the database
- **Database** – PostgreSQL database storing inventory items

#Database:
- id
- name
- description
- category
- subcategory
- item_type
- quantity
- available_quantity
- location
- status
- created_at
- updated_at

#Swagger:
http://localhost:8000/api/docs