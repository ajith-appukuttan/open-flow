# Deployment Guide

This guide covers deploying Workflow Designer to various environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Docker Deployment](#docker-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Cloud Deployments](#cloud-deployments)
8. [Monitoring & Logging](#monitoring--logging)
9. [Security Considerations](#security-considerations)
10. [Backup & Recovery](#backup--recovery)

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 1 core | 2+ cores |
| RAM | 512 MB | 2 GB |
| Disk | 1 GB | 10 GB |
| Node.js | 18.x | 20.x LTS |

### Dependencies

- Node.js 18.0+
- npm 9.0+ or yarn 1.22+
- (Optional) Docker 20.0+
- (Optional) Kubernetes 1.24+

---

## Environment Configuration

### Environment Variables

Create `.env` files for each environment:

#### Server (.env)

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Storage Configuration
DATA_DIR=/app/data/workflows

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Client (.env)

```bash
# API Configuration
VITE_API_URL=https://api.your-domain.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

### Configuration Files

#### Production Server Config

```typescript
// server/src/config/production.ts
export const config = {
  port: process.env.PORT || 3001,
  dataDir: process.env.DATA_DIR || './data/workflows',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};
```

---

## Build Process

### Production Build

```bash
# Build server
cd server
npm ci --production
npm run build

# Build client
cd ../client
npm ci
npm run build
```

### Build Output

```
server/
└── dist/              # Compiled TypeScript
    └── index.js

client/
└── dist/              # Production bundle
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── workflow.svg
```

### Build Optimization

#### Vite Configuration

```typescript
// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          flow: ['@xyflow/react'],
        },
      },
    },
  },
});
```

---

## Deployment Options

### Option 1: Traditional Server

Deploy to a VPS or dedicated server.

#### Setup Script

```bash
#!/bin/bash
# deploy.sh

# Clone repository
git clone https://github.com/your-org/workflowdesigner.git
cd workflowdesigner

# Install dependencies
cd server && npm ci --production
cd ../client && npm ci && npm run build

# Start with PM2
npm install -g pm2
cd ../server
pm2 start dist/index.js --name workflow-api

# Serve static files (nginx config below)
```

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/workflowdesigner
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/workflowdesigner/client/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: PM2 Process Manager

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'workflow-api',
      script: './server/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

---

## Docker Deployment

### Dockerfile (Server)

```dockerfile
# server/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Create data directory
RUN mkdir -p /app/data/workflows

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

### Dockerfile (Client)

```dockerfile
# client/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Client Nginx Config

```nginx
# client/nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://api:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    volumes:
      - workflow-data:/app/data/workflows
    environment:
      - NODE_ENV=production
      - PORT=3001
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3001/api/workflows"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  workflow-data:
```

### Deployment Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Scale API (if using load balancer)
docker-compose up -d --scale api=3

# Stop services
docker-compose down

# Remove volumes (caution: deletes data)
docker-compose down -v
```

---

## Kubernetes Deployment

### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: workflow-designer
```

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: workflow-config
  namespace: workflow-designer
data:
  NODE_ENV: "production"
  PORT: "3001"
  LOG_LEVEL: "info"
```

### API Deployment

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workflow-api
  namespace: workflow-designer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: workflow-api
  template:
    metadata:
      labels:
        app: workflow-api
    spec:
      containers:
        - name: api
          image: your-registry/workflow-api:latest
          ports:
            - containerPort: 3001
          envFrom:
            - configMapRef:
                name: workflow-config
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/workflows
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/workflows
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
          volumeMounts:
            - name: data
              mountPath: /app/data/workflows
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: workflow-data-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: workflow-api
  namespace: workflow-designer
spec:
  selector:
    app: workflow-api
  ports:
    - port: 3001
      targetPort: 3001
  type: ClusterIP
```

### Persistent Volume

```yaml
# k8s/pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: workflow-data-pvc
  namespace: workflow-designer
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard
```

### Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: workflow-ingress
  namespace: workflow-designer
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - workflow.your-domain.com
      secretName: workflow-tls
  rules:
    - host: workflow.your-domain.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: workflow-api
                port:
                  number: 3001
          - path: /
            pathType: Prefix
            backend:
              service:
                name: workflow-web
                port:
                  number: 80
```

### Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check status
kubectl get pods -n workflow-designer
kubectl get services -n workflow-designer

# View logs
kubectl logs -f deployment/workflow-api -n workflow-designer

# Scale deployment
kubectl scale deployment workflow-api --replicas=5 -n workflow-designer
```

---

## Cloud Deployments

### AWS (ECS/Fargate)

```json
// task-definition.json
{
  "family": "workflow-designer",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "your-account.dkr.ecr.region.amazonaws.com/workflow-api:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/workflow-designer",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api"
        }
      }
    }
  ]
}
```

### Google Cloud (Cloud Run)

```yaml
# cloudrun.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: workflow-api
spec:
  template:
    spec:
      containers:
        - image: gcr.io/your-project/workflow-api
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              value: production
          resources:
            limits:
              memory: 512Mi
              cpu: "1"
```

### Azure (Container Apps)

```bash
# Deploy using Azure CLI
az containerapp create \
  --name workflow-api \
  --resource-group workflow-rg \
  --environment workflow-env \
  --image your-registry.azurecr.io/workflow-api:latest \
  --target-port 3001 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 5
```

---

## Monitoring & Logging

### Prometheus Metrics

Add to server:

```typescript
// server/src/metrics.ts
import { Counter, Histogram, Registry } from 'prom-client';

export const registry = new Registry();

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [registry],
});
```

### Structured Logging

```typescript
// server/src/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

### Health Check Endpoint

```typescript
// server/src/routes/health.ts
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

router.get('/ready', async (req, res) => {
  // Check dependencies
  const dataDir = await fs.access(DATA_DIR).then(() => true).catch(() => false);
  
  if (dataDir) {
    res.json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready', reason: 'Data directory not accessible' });
  }
});
```

---

## Security Considerations

### HTTPS/TLS

Always use HTTPS in production. Options:
- Let's Encrypt with Certbot
- Cloud provider certificates (AWS ACM, GCP managed certs)
- Self-signed for internal deployments

### CORS Configuration

```typescript
// Restrict CORS in production
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['https://your-domain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: { error: 'Too many requests' },
});

app.use('/api', limiter);
```

### Input Validation

```typescript
import Joi from 'joi';

const workflowSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000),
  nodes: Joi.array().items(nodeSchema),
  edges: Joi.array().items(edgeSchema),
});
```

### Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

---

## Backup & Recovery

### Automated Backups

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/workflows"
DATA_DIR="/app/data/workflows"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
tar -czf "$BACKUP_DIR/workflows_$DATE.tar.gz" -C "$DATA_DIR" .

# Keep last 30 days
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/workflows_$DATE.tar.gz" s3://your-bucket/backups/
```

### Cron Schedule

```bash
# /etc/cron.d/workflow-backup
0 2 * * * root /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### Recovery Procedure

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1
DATA_DIR="/app/data/workflows"

# Stop service
pm2 stop workflow-api

# Restore from backup
rm -rf "$DATA_DIR"/*
tar -xzf "$BACKUP_FILE" -C "$DATA_DIR"

# Start service
pm2 start workflow-api
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | API not running | Check PM2/container status |
| CORS errors | Wrong origin config | Update CORS_ORIGIN |
| Data not persisting | Volume not mounted | Check volume mounts |
| High memory usage | Memory leak | Restart service, check logs |

### Debug Commands

```bash
# Check service status
pm2 status
docker-compose ps
kubectl get pods

# View logs
pm2 logs workflow-api
docker-compose logs api
kubectl logs -f deployment/workflow-api

# Check disk space
df -h /app/data

# Test API
curl -v http://localhost:3001/api/workflows
```

---

## Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] DNS records configured
- [ ] Firewall rules updated
- [ ] Backup strategy defined
- [ ] Monitoring configured

### Post-Deployment

- [ ] Health checks passing
- [ ] API responding correctly
- [ ] Frontend loading
- [ ] SSL working
- [ ] Logs flowing
- [ ] Backups running

---

## Support

For deployment assistance:
- Review logs: `pm2 logs` / `docker logs` / `kubectl logs`
- Check health endpoints: `/api/health`, `/api/ready`
- Consult documentation in `/docs`
- Open issue on GitHub for bugs
