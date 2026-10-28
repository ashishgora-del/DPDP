# cPanel Deployment Guide

## Overview
This guide explains how to deploy your DPDP Risk Assessment application to cPanel web hosting.

## Prerequisites
- cPanel hosting account with File Manager access
- Node.js installed locally (for building)
- FTP/SFTP access or cPanel File Manager

## Deployment Steps

### Step 1: Build the Application

Run the build command locally:

```bash
npm run build
```

This will create a `dist` folder with all the production-ready files.

### Step 2: Verify Build Output

After building, your `dist` folder should contain:
- `index.html` - Main HTML file
- `assets/` - JavaScript, CSS, and other assets
- `.htaccess` - Apache configuration (copied from public folder)

### Step 3: Upload to cPanel

**Option A: Using File Manager**
1. Log in to cPanel
2. Navigate to **File Manager**
3. Go to `public_html` (or your domain's root directory)
4. Upload all files from the `dist` folder
   - Upload `index.html`
   - Upload the entire `assets` folder
   - Upload `.htaccess` file

**Option B: Using FTP/SFTP**
1. Connect to your server using an FTP client (FileZilla, WinSCP, etc.)
2. Navigate to `public_html` or your domain's document root
3. Upload all contents of the `dist` folder

**Option C: Using cPanel Terminal (if available)**
```bash
cd public_html
# Upload dist.zip first, then:
unzip dist.zip
```

### Step 4: Configure Domain (if needed)

If deploying to a subdomain or subdirectory:

**For Subdirectory** (e.g., `yourdomain.com/dpdp`):
1. Create a folder named `dpdp` in `public_html`
2. Upload all files from `dist` to this folder
3. Update `vite.config.ts` before building:
   ```typescript
   export default defineConfig({
     base: '/dpdp/',
     // ... rest of config
   })
   ```
4. Rebuild: `npm run build`
5. Re-upload the new build

**For Subdomain** (e.g., `dpdp.yourdomain.com`):
1. Create subdomain in cPanel → Domains → Subdomains
2. Note the document root (e.g., `/home/username/public_html/dpdp`)
3. Upload dist files to this directory

### Step 5: Verify .htaccess

Ensure the `.htaccess` file is in place and visible:
1. In cPanel File Manager, click **Settings**
2. Enable "Show Hidden Files (dotfiles)"
3. Verify `.htaccess` exists in your deployment directory

The `.htaccess` file enables:
- Client-side routing (React Router)
- GZIP compression
- Browser caching
- Security headers

### Step 6: Test the Deployment

1. Visit your domain URL
2. Test navigation:
   - Home page (`/`)
   - Risk Assessment (`/risk-assessment`)
   - Start Assessment (`/risk-assessment/start`)
   - FAQ (`/risk-assessment/faq`)
   - Resources (`/risk-assessment/resources`)
3. Verify browser refresh works on all routes
4. Check browser console for errors

## Common Issues & Solutions

### Issue 1: 404 Error on Page Refresh
**Problem**: Refreshing the page on `/risk-assessment` shows 404

**Solution**: 
- Ensure `.htaccess` file exists and is properly configured
- Check Apache `mod_rewrite` is enabled (contact hosting provider)
- Verify `.htaccess` is in the correct directory

### Issue 2: Blank Page / Assets Not Loading
**Problem**: Page loads but shows blank screen

**Solution**:
- Check browser console for errors
- Verify all files in `assets/` folder are uploaded
- Check if `base` path in `vite.config.ts` matches your deployment path
- Clear browser cache

### Issue 3: Images/Fonts Not Loading
**Problem**: Missing images or fonts

**Solution**:
- Ensure all files in `public/` folder are included in build
- Check file permissions (should be 644 for files, 755 for folders)
- Verify MIME types are configured correctly in cPanel

### Issue 4: LocalStorage Not Working
**Problem**: Assessment progress not saving

**Solution**:
- Check if browser allows localStorage
- Ensure HTTPS is enabled (some browsers restrict localStorage on HTTP)
- Test in incognito/private mode to rule out browser extensions

### Issue 5: Slow Loading
**Problem**: Application loads slowly

**Solution**:
- Verify GZIP compression is working (check .htaccess)
- Enable browser caching (already in .htaccess)
- Consider enabling Cloudflare or CDN
- Optimize images before deployment

## File Permissions

Set correct permissions in cPanel:
- **Files**: 644 (rw-r--r--)
- **Folders**: 755 (rwxr-xr-x)
- **.htaccess**: 644

To set permissions:
1. Select file/folder in File Manager
2. Click **Permissions**
3. Set appropriate values

## SSL/HTTPS Configuration

For HTTPS (recommended):
1. In cPanel, go to **SSL/TLS Status**
2. Enable AutoSSL or install Let's Encrypt certificate
3. Force HTTPS by adding to `.htaccess`:
   ```apache
   # Force HTTPS
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

## Performance Optimization

### Enable CloudFlare (Optional)
1. Add domain to CloudFlare
2. Update nameservers in domain registrar
3. Enable caching and minification

### Enable OPCache (PHP)
1. In cPanel → Select PHP Version
2. Enable OPCache extension
3. Increase memory limit if needed

### Optimize Assets
Before building:
- Compress images using tools like TinyPNG
- Remove unused dependencies
- Run `npm run build` to create optimized production build

## Updating the Application

When you need to update:
1. Make changes locally
2. Run `npm run build`
3. Upload only changed files to cPanel
4. Clear browser cache to see changes

## Backup Strategy

Regular backups:
1. Use cPanel **Backup Wizard** to create full backups
2. Keep local copy of `dist` folder
3. Use version control (Git) for source code
4. Schedule automatic cPanel backups if available

## Environment Variables

If you need environment variables:
1. Create `.env.production` file locally
2. Add variables with `VITE_` prefix:
   ```
   VITE_API_URL=https://api.yourdomain.com
   ```
3. Access in code: `import.meta.env.VITE_API_URL`
4. Rebuild before deployment

## Monitoring

Check application health:
- **Error Logs**: cPanel → Errors
- **Access Logs**: Monitor traffic patterns
- **Resource Usage**: Check CPU/RAM usage
- **Uptime**: Use services like UptimeRobot

## Support

If issues persist:
1. Check cPanel error logs
2. Contact hosting provider support
3. Verify Apache configuration
4. Check PHP version compatibility (if using PHP)

## Checklist

Before deployment:
- [ ] Run `npm run build` successfully
- [ ] Verify `dist` folder contains all files
- [ ] `.htaccess` file exists in `public` folder
- [ ] Test locally: `npm run dev`
- [ ] Backup current live site (if updating)

During deployment:
- [ ] Upload all files from `dist` folder
- [ ] Verify `.htaccess` is uploaded
- [ ] Set correct file permissions
- [ ] Clear cPanel cache if available

After deployment:
- [ ] Test all routes (/, /risk-assessment, /risk-assessment/start, etc.)
- [ ] Test page refresh on each route
- [ ] Test assessment flow end-to-end
- [ ] Check browser console for errors
- [ ] Test on mobile devices
- [ ] Verify SSL certificate (if HTTPS)
- [ ] Check page load speed

## Quick Commands Reference

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Check build size
du -sh dist/

# Create zip for upload
cd dist && zip -r ../dist.zip . && cd ..
```

## Additional Notes

- **React Router**: The application uses client-side routing, hence the `.htaccess` rewrite rules
- **No Server Required**: This is a static application (no Node.js needed on server)
- **Apache**: cPanel typically uses Apache, which reads `.htaccess`
- **Build Time**: ~30-60 seconds depending on your machine
- **Build Size**: ~2-5MB typical for this application

## Success Criteria

Deployment is successful when:
✅ All pages load correctly
✅ Navigation between pages works
✅ Browser refresh doesn't show 404
✅ Assessment can be completed and results saved
✅ FAQ page displays all questions
✅ Resources page shows all templates
✅ No console errors
✅ Application works on mobile devices
