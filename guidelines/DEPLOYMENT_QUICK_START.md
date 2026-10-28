# Quick cPanel Deployment

## 🚀 Fast Deployment (ZIP Method - RECOMMENDED)

### 1. Build & Package
```powershell
.\build-for-cpanel.ps1
```

This will:
- ✅ Build the application
- ✅ Create `dpdp-deployment.zip`
- ✅ Verify all files are included

### 2. Upload ZIP to cPanel
1. Login to **cPanel**
2. Open **File Manager**
3. Navigate to `public_html`
4. Click **Upload** button
5. Upload `dpdp-deployment.zip`

### 3. Extract in cPanel
1. Right-click `dpdp-deployment.zip`
2. Select **Extract**
3. Confirm extraction
4. **Delete the ZIP file** after extraction

### 4. Verify
Visit your domain and test:
- ✅ Home page loads
- ✅ Navigation works
- ✅ Page refresh doesn't break
- ✅ Assessment flow works

---

## 🔧 Alternative: Manual Build

### 1. Build Only
```bash
npm run build
```

### 2. Upload Manually
- Open cPanel File Manager
- Upload all files from `dist` folder to `public_html`

---

## 📁 What Gets Uploaded

From the `dist` folder, upload:
```
dist/
  ├── index.html          ← Main file
  ├── .htaccess           ← Required for routing
  └── assets/             ← All CSS, JS, fonts, images
      ├── index-[hash].js
      ├── index-[hash].css
      └── [other assets]
```

---

## ⚠️ Important Files

### .htaccess (REQUIRED)
This file enables client-side routing. **Must be uploaded** to cPanel.

Located at: `public/.htaccess` → will be copied to `dist/` during build

---

## 🔧 Deployment Paths

### Root Domain
**Example**: `https://yourdomain.com`

Upload to: `public_html/`

No config changes needed ✅

### Subdirectory  
**Example**: `https://yourdomain.com/dpdp`

**Before building**, update `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/dpdp/',  // Add this line
  // ... rest of config
})
```

Then build and upload to: `public_html/dpdp/`

### Subdomain
**Example**: `https://dpdp.yourdomain.com`

1. Create subdomain in cPanel
2. Upload to subdomain's document root
3. No config changes needed ✅

---

## 🐛 Troubleshooting

### Problem: 404 on page refresh
**Fix**: Ensure `.htaccess` file is uploaded

### Problem: Blank page
**Fix**: Check browser console, verify all `assets/` uploaded

### Problem: Slow loading
**Fix**: Enable GZIP (already in `.htaccess`)

---

## 📖 Full Documentation

For detailed instructions, see: **[CPANEL_DEPLOYMENT_GUIDE.md](./CPANEL_DEPLOYMENT_GUIDE.md)**

---

## ✅ Pre-Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] Check `dist` folder exists with files
- [ ] Verify `.htaccess` is in `dist` folder
- [ ] Have cPanel login credentials ready
- [ ] Know your deployment path (root/subdirectory/subdomain)

---

## 📦 Build Output

Typical build creates:
- **Size**: 2-5 MB
- **Files**: index.html + assets folder + .htaccess
- **Build time**: 30-60 seconds

---

## 🆘 Need Help?

1. Check [CPANEL_DEPLOYMENT_GUIDE.md](./CPANEL_DEPLOYMENT_GUIDE.md) for detailed steps
2. Verify error logs in cPanel → Errors
3. Test locally first: `npm run dev`

---

## 🎯 Success Criteria

Deployment successful when:
- ✅ All routes work (`/`, `/risk-assessment`, `/risk-assessment/start`)
- ✅ Browser refresh doesn't show 404
- ✅ Assessment flow completes
- ✅ FAQ and Resources pages load
- ✅ No console errors
