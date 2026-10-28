# 🔧 Fixing 404 Error on urjourney.in

## Quick Diagnostic Steps

### Step 1: Verify .htaccess File Exists

1. Login to cPanel for urjourney.in
2. Open **File Manager**
3. Click **Settings** (top right) → Enable **Show Hidden Files (dotfiles)**
4. Check if `.htaccess` file is visible in your domain folder

**If .htaccess is MISSING**:
- It wasn't extracted or uploaded
- **Solution**: Upload it manually (instructions below)

**If .htaccess is PRESENT**:
- Continue to Step 2

---

### Step 2: Check File Location

Where did you extract the files?

**Option A: Root Domain** (https://urjourney.in)
- Files should be in: `public_html/`
- .htaccess location: `public_html/.htaccess`

**Option B: Subdirectory** (https://urjourney.in/dpdp)
- Files should be in: `public_html/dpdp/`
- .htaccess location: `public_html/dpdp/.htaccess`

**Verify**:
- index.html should be in the SAME folder as .htaccess
- assets/ folder should be in the SAME folder

---

### Step 3: Manual .htaccess Upload

If .htaccess is missing, create it manually in cPanel:

1. In File Manager, navigate to your domain folder (e.g., `public_html/`)
2. Click **+ File** button
3. Name it exactly: `.htaccess` (with the dot at the start)
4. Right-click the new file → **Edit**
5. Paste this content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite everything else to index.html to allow HTML5 state links
  RewriteRule ^ index.html [L]
</IfModule>

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching for static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType text/x-javascript "access plus 1 month"
  ExpiresByType image/x-icon "access plus 1 year"
  ExpiresDefault "access plus 2 days"
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

6. Click **Save Changes**

---

### Step 4: Check Apache mod_rewrite

The .htaccess requires `mod_rewrite` to be enabled.

**To verify**:
1. Create a PHP file in cPanel: `info.php`
2. Add this content:
   ```php
   <?php phpinfo(); ?>
   ```
3. Visit: https://urjourney.in/info.php
4. Search for "mod_rewrite"
5. Should show "Loaded" or "Enabled"

**If mod_rewrite is NOT enabled**:
- Contact your hosting provider
- Ask them to enable Apache mod_rewrite module

**After checking, DELETE info.php** (security risk to leave it)

---

### Step 5: Force HTTPS (If applicable)

If your site has SSL but .htaccess doesn't force HTTPS:

Add this at the TOP of .htaccess (before other rules):

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

### Step 6: Check File Permissions

Incorrect permissions can cause 404 errors:

1. Select .htaccess file
2. Click **Permissions** or **Change Permissions**
3. Set to: **644**
4. For folders (public_html, assets): **755**

---

### Step 7: Clear Browser Cache

After fixing .htaccess:
1. Clear your browser cache (Ctrl+Shift+Delete)
2. Try visiting in Incognito/Private mode
3. Test: https://urjourney.in

---

## Common Scenarios & Solutions

### Scenario 1: Homepage loads, but other pages show 404

**Problem**: .htaccess not working
**Solution**: 
- Verify .htaccess exists
- Check mod_rewrite is enabled
- Ensure .htaccess has correct content (see Step 3)

### Scenario 2: All pages show 404

**Problem**: Files in wrong location or index.html missing
**Solution**:
- Check if index.html is in the correct folder
- Verify folder structure matches deployment path

### Scenario 3: White/blank page

**Problem**: JavaScript not loading
**Solution**:
- Check if `assets/` folder was extracted
- Open browser console (F12) for errors
- Verify all files uploaded

### Scenario 4: Mixed content warnings

**Problem**: HTTPS page loading HTTP resources
**Solution**:
- Force HTTPS (see Step 5)
- Check SSL certificate is installed

---

## Verification Checklist

After applying fixes:

- [ ] .htaccess file exists in same folder as index.html
- [ ] .htaccess has correct rewrite rules
- [ ] mod_rewrite is enabled on server
- [ ] File permissions are correct (644 for files, 755 for folders)
- [ ] index.html exists in root folder
- [ ] assets/ folder exists with all files
- [ ] Browser cache cleared
- [ ] Tested in incognito mode

---

## Test All Routes

After fixing, test these URLs:

1. https://urjourney.in → Should show homepage
2. https://urjourney.in/risk-assessment → Should show Risk Assessment landing
3. Refresh page while on /risk-assessment → Should NOT show 404
4. https://urjourney.in/risk-assessment/start → Should show questionnaire
5. https://urjourney.in/risk-assessment/faq → Should show FAQ
6. https://urjourney.in/risk-assessment/resources → Should show Resources

---

## Still Having Issues?

### Check Error Logs

1. In cPanel → **Errors**
2. Look for recent errors
3. Share the error message for specific help

### Alternative: Use .htaccess Tester

Create a simple test:
1. Visit: https://urjourney.in/test-route-that-does-not-exist
2. If you see your React app → .htaccess is working
3. If you see 404 error page → .htaccess not working

---

## Emergency Fallback: Hash Router

If .htaccess cannot be fixed, switch to Hash Router:

**This is NOT recommended but will work**:

Update `src/main.tsx`:
```tsx
import { HashRouter } from 'react-router-dom';

// Change from:
<BrowserRouter>
  <App />
</BrowserRouter>

// To:
<HashRouter>
  <App />
</HashRouter>
```

Then rebuild and redeploy.

**Note**: URLs will have `#` in them (e.g., https://urjourney.in/#/risk-assessment)

---

## Contact Support

If none of these work:

**Hosting Provider**: Contact urjourney.in hosting support
**Ask for**:
1. Enable Apache mod_rewrite module
2. Allow .htaccess overrides
3. Check if AllowOverride is set to "All" in Apache config

**Information to provide**:
- You're deploying a React SPA (Single Page Application)
- You need mod_rewrite for client-side routing
- .htaccess file needs to work for URL rewrites
