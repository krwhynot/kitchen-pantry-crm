backend_pipeline.md

title: Backend Deployment Pipeline

This section outlines the automated deployment pipeline for the backend, encompassing continuous integration, continuous deployment, and strategies for reliable releases such as blue-green deployments.

### Deployment Pipeline

The backend deployment pipeline includes automated testing, security scanning, and progressive deployment strategies for reliable releases.

**Continuous Integration:** Automated testing including unit tests, integration tests, and security scans. CI pipeline includes code quality checks, dependency vulnerability scanning, and performance testing.

**Continuous Deployment:** Automated deployment to staging and production environments with approval workflows. CD pipeline includes database migrations, configuration updates, and rollback capabilities.

**Blue-Green Deployment:** Zero-downtime deployment strategy with traffic switching and automatic rollback. Blue-green deployment includes health checks, performance validation, and gradual traffic migration.

```yaml
# .github/workflows/backend-deploy.yml
name: Backend Deployment

on:
  push:
    branches: [main, develop]
    paths: ['backend/**']
  pull_request:
    branches: [main]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
        
    - name: Install dependencies
      working-directory: ./backend
      run: npm ci
      
    - name: Run linting
      working-directory: ./backend
      run: npm run lint
      
    - name: Run unit tests
      working-directory: ./backend
      run: npm run test:unit
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        
    - name: Run integration tests
      working-directory: ./backend
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        
    - name: Security audit
      working-directory: ./backend
      run: npm audit --audit-level high
      
  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Build and deploy to Railway
      uses: railway/action@v1
      with:
        token: ${{ secrets.RAILWAY_TOKEN }}
        service: kitchen-pantry-api
        environment: production
        
    - name: Run database migrations
      run: |
        curl -X POST "${{ secrets.API_URL }}/admin/migrate" \
          -H "Authorization: Bearer ${{ secrets.ADMIN_TOKEN }}"
          
    - name: Health check
      run: |
        for i in {1..30}; do
          if curl -f "${{ secrets.API_URL }}/health"; then
            echo "Health check passed"
            exit 0
          fi
          echo "Health check failed, retrying in 10 seconds..."
          sleep 10
        done
        echo "Health check failed after 5 minutes"
        exit 1