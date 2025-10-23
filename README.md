# Appointment Service

Sistema backend serverless para gestión de agendamientos en Perú y Chile, construido con AWS Lambda, TypeScript y Clean Architecture.

---

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución Local](#ejecución-local)
- [Despliegue](#despliegue)
- [Pruebas](#pruebas)
- [Endpoints](#endpoints)
- [Estructura del Proyecto](#estructura-del-proyecto)

---

## 🔧 Requisitos Previos

- **Node.js** >= 22.x
- **npm** >= 9.x
- **AWS CLI** configurado con credenciales
- **MySQL** (para desarrollo local)
- **AWS Account** con permisos para:
    - Lambda
    - API Gateway
    - DynamoDB
    - SNS
    - SQS
    - EventBridge
    - RDS

---

## 📦 Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/LuisGnzlz1/test-rimac-backend
cd test-rimac-backend

# 2. Instalar dependencias
npm install
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

### 2. Editar `.env` con tus credenciales:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=default
STAGE=dev

# RDS MySQL - PERÚ
RDS_PE_HOST=localhost
RDS_PE_USER=dev_user
RDS_PE_PASSWORD=dev_password
RDS_PE_DATABASE=appointments_db
RDS_PE_PORT=3306

# RDS MySQL - CHILE
RDS_CL_HOST=localhost
RDS_CL_USER=dev_user
RDS_CL_PASSWORD=dev_password
RDS_CL_DATABASE=appointments_db
RDS_CL_PORT=3306
```

---

## 🌐 Despliegue

### Desplegar a Development

```bash
npm run deploy:dev
```

### Desplegar a Production

```bash
npm run deploy:prod
```

### Ver información del despliegue

```bash
serverless info --stage dev
```

### Eliminar el stack

```bash
serverless remove --stage dev
```

---

## 🧪 Pruebas

### Ejecutar todas las pruebas

```bash
npm test
```

### Pruebas en modo watch

```bash
npm run test:watch
```

### Coverage report

```bash
npm run test:coverage
```

El reporte estará disponible en: `coverage/lcov-report/index.html`

### Linter

```bash
npm run lint
```

### Format code

```bash
npm run format
```

---

## 📡 Endpoints

### Base URL

- **Local**: `http://localhost:3000/dev`
- **Dev**: `https://your-api-id.execute-api.us-east-1.amazonaws.com/dev`
- **Prod**: `https://your-api-id.execute-api.us-east-1.amazonaws.com/prod`

### 1. Crear Agendamiento

**POST** `/appointments`

**Request:**
```json
{
  "insuredId": "00123",
  "scheduleId": 100,
  "countryISO": "PE"
}
```

**Response (201):**
```json
{
  "message": "Agendamiento en proceso",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "insuredId": "00123",
    "scheduleId": 100,
    "countryISO": "PE",
    "status": "pending",
    "createdAt": "2024-10-22T10:00:00Z"
  }
}
```
---

### 2. Listar Agendamientos por Asegurado

**GET** `/appointments/{insuredId}`

**Parámetros:**
- `insuredId` (path): Código del asegurado (5 dígitos)

**Response (200):**
```json
{
  "insuredId": "00123",
  "total": 2,
  "appointments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "insuredId": "00123",
      "scheduleId": 100,
      "countryISO": "PE",
      "status": "completed",
      "createdAt": "2024-10-22T10:00:00Z",
      "updatedAt": "2024-10-22T10:05:00Z"
    }
  ]
}
```
---

### 3. Documentación Swagger

**GET** `/doc`

---

## 📁 Estructura del Proyecto

```
test-rimac-backend/
├── src/
│   ├── domain/                      # Capa de Dominio
│   │   ├── entities/               # Entidades (Appointment)
│   │   ├── repositories/           # Interfaces de repositorios
│   │   ├── services/               # Interfaces de servicios
│   │   └── validators/             # Validaciones con Zod
│   │
│   ├── application/                # Capa de Aplicación
│   │   └── use-cases/              # Casos de uso (SOLID)
│   │       ├── create-appointment.ts
│   │       ├── list-appointments.ts
│   │       ├── process-country-appointment.ts
│   │       └── update-appointment.ts
│   │
│   ├── infra/             # Capa de Infraestructura
│   │   ├── dynamodb-repository.ts          
│   │   ├── event-bridge-publisher.ts          
│   │   ├── rds-repository.ts          
│   │   └── sns-message-publisher.ts            
│   │
│   ├── handlers/                   # Lambda Handlers
│       ├── appointment.ts          # POST + GET + Update
│       ├── appointment-country.ts  # Process PE/CL
│       └── swagger.ts             # Documentación
│
├── database/                       # Scripts de base de datos
│   └── schema.sql
│
│
│
├── serverless.yml                  # Configuración Serverless
├── package.json                    # Dependencias
├── tsconfig.json                   # Configuración TypeScript
├── jest.config.js                  # Configuración Jest
└── .env                            # Variables de entorno (no commitear)
```

---

## 🏗️ Arquitectura

```
Cliente → API Gateway → Lambda appointment
                           ↓
                      DynamoDB (pending)
                           ↓
                       SNS Topic
            ┌──────────┴──────────┐
            ↓                     ↓
       SQS (PE)               SQS (CL)
            ↓                     ↓
  Lambda appointmentPE   Lambda appointmentCL
            ↓                     ↓
     RDS MySQL (PE)         RDS MySQL (CL)
            ↓                     ↓
            └────→ EventBridge ←──┘
                       ↓
                  SQS (completed)
                       ↓
          Lambda appointment (update)
                       ↓
              DynamoDB (completed)
```

---

## 🎯 Principios Aplicados

- ✅ **Clean Architecture**: Separación en capas (Domain, Application, Infrastructure)
- ✅ **SOLID**: Cada clase tiene una única responsabilidad
- ✅ **DDD**: Entidades ricas con lógica de negocio
- ✅ **Dependency Inversion**: Casos de uso dependen de interfaces
- ✅ **Repository Pattern**: Abstracción de persistencia
- ✅ **Event-Driven**: Comunicación asíncrona con eventos

---

## 📊 Tecnologías

- **Runtime**: Node.js 18.x, TypeScript 5.x
- **Framework**: Serverless Framework 3.x
- **AWS Services**: Lambda, API Gateway, DynamoDB, SNS, SQS, EventBridge, RDS
- **Database**: MySQL 8.0
- **Validation**: Zod
- **Testing**: Jest
- **Linting**: ESLint + Prettier

---

## 🔐 Validaciones

### insuredId
- ✅ Exactamente 5 dígitos
- ✅ Solo números
- ✅ Puede incluir ceros al inicio (ej: "00123")

### scheduleId
- ✅ Número entero positivo
- ✅ Mayor a 0

### countryISO
- ✅ Solo "PE" o "CL"
- ✅ Case sensitive

---

## 📈 Estados del Agendamiento

| Estado | Descripción |
|--------|-------------|
| `pending` | Agendamiento creado, esperando procesamiento |
| `completed` | Procesado exitosamente |
| `failed` | Error en el procesamiento |
