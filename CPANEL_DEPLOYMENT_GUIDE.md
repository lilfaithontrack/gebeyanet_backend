# GebyaNet Backend - Complete cPanel Deployment Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [cPanel Prerequisites](#cpanel-prerequisites)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Environment Configuration](#environment-configuration)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring & Logging](#monitoring--logging)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)
11. [Maintenance & Updates](#maintenance--updates)

---

## 🎯 Project Overview

**GebyaNet Backend** is a comprehensive e-commerce delivery management system built with Node.js and Express.

### Tech Stack
- **Runtime**: Node.js (v18+ recommended)
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT
- **File Uploads**: Multer + Sharp
- **Payment Processing**: Custom payment system
- **Real-time Features**: Socket.io ready
- **Image Processing**: Sharp for optimization

### Key Features
- Multi-role user system (buyer, seller, agent)
- Product management with categories/subcategories
- Delivery tracking and assignment
- Payment processing with QR codes
- Shop and shop owner management
- Notification system
- File upload handling

---

## 🛠️ cPanel Prerequisites

### Required cPanel Features
- ✅ **Node.js Selector** (cPanel 108+)
- ✅ **MySQL Database Wizard**
- ✅ **File Manager**
- ✅ **Cron Jobs**
- ✅ **SSL/TLS Manager**
- ✅ **Backup Configuration**

### Node.js Version Requirements
```bash
# Recommended Node.js version: 18.x or 20.x
# Minimum: 16.x
```

### Resource Requirements
- **RAM**: Minimum 512MB, Recommended 1GB+
- **Storage**: Minimum 2GB, Recommended 5GB+
- **CPU**: 2+ cores recommended

---

## 🗄️ Database Setup

### 1. Create MySQL Database
1. Log into cPanel
2. Navigate to **MySQL Database Wizard**
3. Create database: `gebya_net`
4. Create database user with strong password
5. Grant all privileges to the user

### 2. Database Configuration
```sql
-- Recommended MySQL Settings
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- Engine: InnoDB
```

### 3. Import Initial Data (Optional)
If you have a SQL dump file:
1. Use **phpMyAdmin**
2. Select the `gebya_net` database
3. Click **Import**
4. Upload your `.sql` file

---

## 🚀 Application Deployment

### 1. Upload Application Files

#### Method A: Using File Manager
1. Navigate to **File Manager** → **public_html**
2. Create a new directory: `api.gebyanet.com` (or your preferred subdomain)
3. Upload all project files except:
   - `node_modules/`
   - `.git/`
   - `.env`
   - Large backup files

#### Method B: Using Git (Recommended)
```bash
# SSH into your server
cd ~
git clone https://github.com/lilfaithontrack/gebeyanet_backend.git public_html/api.gebyanet.com
```

### 2. Setup Node.js Application

#### Using cPanel Node.js Selector
1. Navigate to **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 18.x or 20.x
   - **Application mode**: Production
   - **Application root**: `api.gebyanet.com`
   - **Application URL**: `api.gebyanet.com`
   - **Application startup file**: `server.js`
4. Click **Create**

#### Install Dependencies
```bash
# In the application directory
cd ~/public_html/api.gebyanet.com
npm install --production
```

### 3. Configure Application Startup
The application will automatically use the startup file `server.js`. Ensure your `package.json` has:
```json
{
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  }
}
```

---

## ⚙️ Environment Configuration

### 1. Create .env File
Create `.env` in your application root with:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gebya_net
DB_USER=your_db_user
DB_PASSWORD=your_secure_db_password

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production
PORT=3000

# Email Configuration (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# CORS Configuration
ALLOWED_ORIGINS=https://gebyanet.com,https://www.gebyanet.com,https://admin.gebyanet.com

# SSL Certificate Paths (if using custom SSL)
SSL_KEY_PATH=/etc/letsencrypt/live/api.gebyanet.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/api.gebyanet.com/fullchain.pem
```

### 2. Set File Permissions
```bash
# Set proper permissions
chmod 755 ~/public_html/api.gebyanet.com
chmod 644 ~/public_html/api.gebyanet.com/.env
chmod -R 755 ~/public_html/api.gebyanet.com/uploads
chmod -R 755 ~/public_html/api.gebyanet.com/images
```

---

## 🔒 SSL Certificate Setup

### Option 1: Let's Encrypt (Recommended)
1. Navigate to **SSL/TLS** → **Let's Encrypt™ SSL**
2. Select your domain/subdomain
3. Click **Issue**
4. Wait for certificate generation

### Option 2: Custom SSL
1. Navigate to **SSL/TLS** → **Install and Manage SSL**
2. Upload your certificate files:
   - Private Key (.key)
   - Certificate (.crt)
   - CA Bundle (optional)

### Option 3: Application-Level SSL
If you're handling SSL in the application (as seen in `server.js`):
```javascript
// Update paths in server.js
const privKeyPath = '/home/username/ssl/certs/api.gebyanet.com/privkey.pem';
const fullChainPath = '/home/username/ssl/certs/api.gebyanet.com/fullchain.pem';
```

---

## ⚡ Performance Optimization

### 1. Enable Gzip Compression
Already implemented in `server.js`:
```javascript
app.use(compression());
```

### 2. Configure PM2 (if available)
If your cPanel supports PM2:
```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'gebyanet-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
```

### 3. Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_assign_orders_status ON assign_orders(status);
```

### 4. Enable Caching
Consider adding Redis if available:
```javascript
// Install redis client
npm install redis

// Add to server.js
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379
});
```

---

## 📊 Monitoring & Logging

### 1. Application Logging
The application uses Morgan for HTTP logging. To enhance:

```javascript
// Add to server.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### 2. Error Monitoring
Create error tracking:
```javascript
// Add to server.js
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
```

### 3. Database Monitoring
Set up cron job for database health checks:
```bash
# Add to cPanel Cron Jobs
0 */6 * * * /usr/bin/mysqlcheck -u your_db_user -p'password' gebya_net
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
- Never commit `.env` to version control
- Use strong, unique passwords
- Rotate secrets regularly

### 2. Database Security
```sql
-- Create dedicated database user with limited privileges
CREATE USER 'gebyanet_api'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON gebya_net.* TO 'gebyanet_api'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Application Security
- Validate all inputs (Joi is already implemented)
- Sanitize file uploads
- Implement rate limiting
- Use HTTPS only
- Set security headers

```javascript
// Add to server.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### 4. File Upload Security
- Validate file types
- Scan for malware
- Use secure file names
- Implement size limits

---

## 🔧 Troubleshooting Common Issues

### Issue 1: Application Won't Start
**Symptoms**: 503 Service Unavailable
**Solutions**:
1. Check Node.js version compatibility
2. Verify `.env` file exists and is correct
3. Check application logs in cPanel
4. Ensure all dependencies are installed

```bash
# Check logs
tail -f ~/public_html/api.gebyanet.com/logs/error.log
```

### Issue 2: Database Connection Errors
**Symptoms**: ECONNREFUSED or authentication errors
**Solutions**:
1. Verify database credentials in `.env`
2. Check if database exists
3. Ensure database user has correct privileges
4. Test connection manually

```bash
# Test database connection
mysql -u your_db_user -p gebya_net
```

### Issue 3: Permission Errors
**Symptoms**: File access denied
**Solutions**:
1. Set correct file permissions
2. Check ownership of files
3. Ensure upload directories are writable

```bash
# Fix permissions
chown -R username:username ~/public_html/api.gebyanet.com
chmod -R 755 ~/public_html/api.gebyanet.com
```

### Issue 4: Memory Issues
**Symptoms**: Application crashes or becomes unresponsive
**Solutions**:
1. Monitor memory usage in cPanel
2. Optimize database queries
3. Implement pagination
4. Add memory monitoring

### Issue 5: SSL Certificate Problems
**Symptoms**: HTTPS not working or certificate errors
**Solutions**:
1. Verify certificate installation
2. Check certificate expiration
3. Ensure proper domain mapping
4. Test SSL configuration

---

## 🔄 Maintenance & Updates

### 1. Regular Updates
```bash
# Update dependencies monthly
cd ~/public_html/api.gebyanet.com
npm update
npm audit fix
```

### 2. Database Maintenance
```sql
-- Optimize tables monthly
OPTIMIZE TABLE users, payments, assign_orders;

-- Check for errors
mysqlcheck -u your_db_user -p gebyan_net --check
```

### 3. Backup Strategy
1. **Database Backups**: Daily automated via cPanel
2. **File Backups**: Weekly via cPanel Backup
3. **Code Backups**: Use Git repository

### 4. Monitoring Schedule
- **Daily**: Check application logs
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit

### 5. Deployment Workflow
```bash
# For updates
git pull origin master
npm install --production
# Restart application via cPanel
```

---

## 📱 API Testing

### Health Check Endpoint
```bash
# Test if API is running
curl https://api.gebyanet.com/health
```

### Common Endpoints
```bash
# Test authentication
curl -X POST https://api.gebyanet.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test product endpoint
curl https://api.gebyanet.com/api/products
```

---

## 🚨 Emergency Procedures

### Application Down
1. Check cPanel Node.js status
2. Review error logs
3. Restart application via cPanel
4. Check database connectivity

### Database Issues
1. Access phpMyAdmin
2. Run database repair
3. Check table integrity
4. Restore from backup if needed

### Security Incident
1. Change all passwords
2. Review access logs
3. Scan for malware
4. Update all dependencies

---

## 📞 Support Resources

### cPanel Documentation
- [Node.js Application Manager](https://docs.cpanel.net/cpanel/nodejs-application-manager/)
- [MySQL Database Wizard](https://docs.cpanel.net/cpanel/mysql-database-wizard/)
- [SSL/TLS Manager](https://docs.cpanel.net/cpanel/ssl-tls-manager/)

### Node.js Best Practices
- [Official Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

### Emergency Contacts
- Hosting Provider Support
- Database Administrator
- Security Team

---

## 📝 Checklist

### Pre-Deployment Checklist
- [ ] Node.js version confirmed (18.x+)
- [ ] Database created and configured
- [ ] Environment variables set
- [ ] SSL certificate installed
- [ ] File permissions set correctly
- [ ] Dependencies installed
- [ ] Application tested locally
- [ ] Backup strategy in place

### Post-Deployment Checklist
- [ ] Application starts successfully
- [ ] Database connection working
- [ ] API endpoints responding
- [ ] SSL certificate valid
- [ ] Error logging functional
- [ ] Performance monitoring active
- [ ] Security measures verified
- [ ] Documentation updated

---

## 🎉 Success Metrics

Your GebyaNet backend is successfully deployed on cPanel when:

✅ **Application Status**: Running without errors  
✅ **Database**: Connected and optimized  
✅ **SSL Certificate**: Valid and working  
✅ **API Endpoints**: Responding correctly  
✅ **File Uploads**: Working properly  
✅ **Authentication**: JWT tokens working  
✅ **Performance**: Acceptable response times  
✅ **Security**: Best practices implemented  
✅ **Monitoring**: Logging and alerts active  
✅ **Backup**: Automated backups configured  

---

*Last Updated: March 2026*  
*Version: 1.0*  
*Compatible with cPanel 108+ and Node.js 18.x+*
