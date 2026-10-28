# 🚀 cPanel Upload Instructions

## Your deployment file is ready!

**File**: `dpdp-deployment.zip`  
**Size**: ~140 KB (compressed)  
**Contents**: Complete production build with all assets

---

## Step-by-Step Upload Guide

### 1️⃣ Login to cPanel
- Go to your hosting provider's cPanel
- Enter your credentials

### 2️⃣ Open File Manager
- In cPanel, click **File Manager**
- Navigate to `public_html` folder
  - For root domain: `public_html/`
  - For subdirectory: `public_html/yourfolder/`
  - For subdomain: Will be in its own folder (e.g., `public_html/subdomain/`)

### 3️⃣ Upload ZIP File
1. Click the **Upload** button (top toolbar)
2. Click **Select File** or drag and drop
3. Choose `dpdp-deployment.zip` from your computer
4. Wait for upload to complete (100%)
5. Close the upload window

### 4️⃣ Extract Files
1. Go back to File Manager
2. Find `dpdp-deployment.zip` in the file list
3. **Right-click** on the ZIP file
4. Select **Extract**
5. Confirm the extraction path (should be current directory)
6. Click **Extract File(s)**
7. Wait for extraction to complete

### 5️⃣ Clean Up
1. After extraction, you'll see:
   - `index.html`
   - `.htaccess`
   - `assets/` folder
2. **Delete** the `dpdp-deployment.zip` file
   - Right-click → Delete

### 6️⃣ Verify .htaccess
1. In File Manager, click **Settings** (top right)
2. Check **Show Hidden Files (dotfiles)**
3. Verify `.htaccess` file is visible
4. If not, ensure it was extracted properly

### 7️⃣ Set Permissions (if needed)
Usually not required, but if you have issues:
- Files: 644 (rw-r--r--)
- Folders: 755 (rwxr-xr-x)

### 8️⃣ Test Your Site!
Visit your domain:
- `https://yourdomain.com`

Test these pages:
- ✅ Home page
- ✅ `/risk-assessment` - Risk Assessment landing
- ✅ `/risk-assessment/start` - Assessment questionnaire
- ✅ `/risk-assessment/faq` - FAQ page
- ✅ `/risk-assessment/resources` - Resources page

Try refreshing the page on each route - it should work!

---

## 🎯 Folder Structure After Extraction

```
public_html/
  ├── index.html
  ├── .htaccess          ← Very important!
  └── assets/
      ├── index-[hash].css
      ├── index-[hash].js
      ├── react-vendor-[hash].js
      └── ui-vendor-[hash].js
```

---

## ❗ Troubleshooting

### Problem: Can't see .htaccess file
**Solution**: Enable "Show Hidden Files" in File Manager settings

### Problem: 404 error when refreshing pages
**Solution**: 
- Ensure `.htaccess` is present
- Check Apache mod_rewrite is enabled (contact hosting support)

### Problem: Blank page
**Solution**:
- Check browser console for errors (F12)
- Verify all files in `assets/` folder were extracted
- Clear browser cache

### Problem: Files not extracting
**Solution**:
- Try uploading individual files from `dist/` folder
- Use FTP/SFTP client instead

---

## 🔄 To Update Your Site Later

1. Make changes to your code
2. Run `.\build-for-cpanel.ps1` again
3. Upload new `dpdp-deployment.zip`
4. Extract (overwrite existing files)
5. Delete ZIP file

---

## 📞 Need Help?

- Check: [CPANEL_DEPLOYMENT_GUIDE.md](./CPANEL_DEPLOYMENT_GUIDE.md) for detailed guide
- Check: [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md) for quick reference
- Contact your hosting provider's support for cPanel-specific issues

---

## ✅ Deployment Checklist

Before you upload:
- [x] Built successfully (`.\build-for-cpanel.ps1`)
- [x] ZIP file created (`dpdp-deployment.zip`)
- [x] No build errors

After extraction:
- [ ] `index.html` present
- [ ] `.htaccess` present
- [ ] `assets/` folder present with files
- [ ] ZIP file deleted
- [ ] Site loads at your domain
- [ ] All routes work (test navigation)
- [ ] Page refresh works on all routes

---

**Your application is now ready for production! 🎉**
