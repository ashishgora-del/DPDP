# Troubleshooting Guide

Common issues and solutions for the Learning Platform module.

## Table of Contents

- [Setup & Installation](#setup--installation)
- [Authentication Issues](#authentication-issues)
- [API Connection Problems](#api-connection-problems)
- [Routing Issues](#routing-issues)
- [Build & Deployment](#build--deployment)
- [Performance Issues](#performance-issues)
- [UI/UX Issues](#uiux-issues)

---

## Setup & Installation

### ❌ Problem: `npm install` fails with dependency errors

**Symptoms:**
- Package installation errors
- Peer dependency conflicts
- Version mismatch warnings

**Solutions:**

1. **Clear npm cache and retry:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

2. **Use `--legacy-peer-deps` flag:**
```bash
npm install --legacy-peer-deps
```

3. **Check Node.js version:**
```bash
node --version  # Should be 18+ or 20+
npm --version   # Should be 9+ or 10+
```

4. **Update npm:**
```bash
npm install -g npm@latest
```

---

### ❌ Problem: Environment variables not loading

**Symptoms:**
- API calls fail with network errors
- `VITE_API_URL` is undefined
- Console shows `undefined` for environment variables

**Solutions:**

1. **Verify `.env` file exists in project root:**
```env
VITE_API_URL=http://localhost:3001/api
```

2. **Restart Vite dev server:**
```bash
# Stop server (Ctrl+C) and restart
npm run dev
```

3. **Check environment variable prefix:**
   - Must start with `VITE_` to be exposed to client
   - Access via `import.meta.env.VITE_API_URL`

4. **Verify `.env` is not in `.gitignore`:**
   - Create `.env.example` for version control
   - Keep `.env` local with actual values

---

### ❌ Problem: TypeScript errors on fresh install

**Symptoms:**
- Red squiggly lines everywhere
- "Cannot find module" errors
- Type errors in imports

**Solutions:**

1. **Restart TypeScript server in VS Code:**
   - Press `Ctrl+Shift+P`
   - Type "TypeScript: Restart TS Server"
   - Select and execute

2. **Verify `tsconfig.json` configuration:**
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true
  }
}
```

3. **Check file paths:**
   - Ensure imports use correct relative paths
   - Verify file extensions (.ts, .tsx)

---

## Authentication Issues

### ❌ Problem: Login fails with 401 Unauthorized

**Symptoms:**
- Login form submits but returns error
- "Invalid credentials" message
- Network tab shows 401 response

**Solutions:**

1. **Verify credentials:**
   - Check email format is valid
   - Ensure password is correct
   - Try different user account

2. **Check backend is running:**
```bash
cd AI-PrivacyLearning-main/backend
npm run start:dev
# Should see "Application is running on: http://localhost:3001"
```

3. **Verify API endpoint:**
   - Open DevTools Network tab
   - Check request URL matches `VITE_API_URL`
   - Confirm endpoint is `/auth/login`

4. **Test with curl:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

### ❌ Problem: Token not persisting after login

**Symptoms:**
- User is logged out on page refresh
- Token disappears from localStorage
- Authentication state resets

**Solutions:**

1. **Check localStorage in DevTools:**
   - Open DevTools → Application → Local Storage
   - Verify `token` key exists
   - Check token value is a valid JWT

2. **Verify storage helper usage:**
```typescript
// In api/index.ts
import { getToken } from '../utils/storage';

apiClient.interceptors.request.use((config) => {
  const token = getToken(); // Should use helper, not direct localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

3. **Clear localStorage and retry:**
```javascript
// In browser console
localStorage.clear();
// Then login again
```

---

### ❌ Problem: "Unauthorized" on all API calls after login

**Symptoms:**
- Login succeeds but subsequent requests fail with 401
- Token exists in localStorage
- All protected routes redirect to login

**Solutions:**

1. **Verify Authorization header format:**
   - Should be: `Bearer <token>`
   - Check Network tab → Headers → Authorization

2. **Check token expiration:**
```javascript
// In browser console
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expires:', new Date(payload.exp * 1000));
```

3. **Verify backend CORS configuration:**
   - Backend must allow credentials
   - Check `Access-Control-Allow-Credentials` header

4. **Test token manually:**
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### ❌ Problem: Admin routes accessible to non-admin users

**Symptoms:**
- Regular users can access `/admin` routes
- AuthGuard not enforcing role check
- No permission denied message

**Solutions:**

1. **Verify AuthGuard implementation:**
```tsx
<Route path="/admin/*" element={
  <AuthGuard requiredRoles={[UserRole.ADMIN]}>
    <AdminRoutes />
  </AuthGuard>
} />
```

2. **Check user role in state:**
```javascript
// In browser console (when logged in)
const authContext = JSON.parse(
  localStorage.getItem('auth-storage') || '{}'
);
console.log('User role:', authContext.state.user?.role);
```

3. **Verify backend returns correct role:**
   - Check `/auth/profile` response
   - Ensure `role` field is "ADMIN"

---

## API Connection Problems

### ❌ Problem: CORS errors in browser console

**Symptoms:**
- "Access to fetch blocked by CORS policy"
- Network requests fail with CORS error
- API calls work in Postman but not in browser

**Solutions:**

1. **Enable CORS in NestJS backend:**
```typescript
// In main.ts
app.enableCors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true,
});
```

2. **Verify frontend is on correct port:**
   - Default Vite dev server: http://localhost:5173
   - Check actual port in terminal output

3. **Use proxy in vite.config.ts (alternative):**
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
});
```

---

### ❌ Problem: API calls return 404 Not Found

**Symptoms:**
- All API endpoints return 404
- Network tab shows correct URL but 404 response
- Backend logs don't show incoming requests

**Solutions:**

1. **Verify `VITE_API_URL` format:**
   - Should include `/api` suffix
   - Example: `http://localhost:3001/api`
   - NO trailing slash

2. **Check backend route definitions:**
```bash
# In backend directory
grep -r "auth/login" src/
# Should find route handler
```

3. **Verify backend global prefix:**
```typescript
// In backend/src/main.ts
app.setGlobalPrefix('api'); // Must match frontend API_URL
```

4. **Test endpoint directly:**
```bash
curl http://localhost:3001/api/auth/profile
# Should return error (401) but NOT 404
```

---

### ❌ Problem: Network timeout errors

**Symptoms:**
- Requests hang indefinitely
- "Network Error" or timeout message
- No response in Network tab

**Solutions:**

1. **Check backend is running:**
```bash
curl http://localhost:3001/api
# Should get response (even if error)
```

2. **Increase timeout in Axios:**
```typescript
// In api/index.ts
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
});
```

3. **Check firewall/antivirus:**
   - May block localhost connections
   - Temporarily disable to test

4. **Verify port availability:**
```bash
netstat -ano | findstr :3001
# Should show process listening on 3001
```

---

### ❌ Problem: Axios returns wrapped response

**Symptoms:**
- `response.data.data` instead of `response.data`
- Need double `.data` access
- Type errors with API responses

**Solutions:**

1. **Handle Axios response structure:**
```typescript
// API client already handles this
const courses = await adminCoursesApi.getCourses();
// Returns courses.data (already unwrapped)
```

2. **Check for double-wrapping:**
```typescript
// In API files
export const getCourses = async () => {
  const response = await apiClient.get('/admin/courses');
  // response.data is the actual data
  return response.data;
};
```

3. **Inspect response in DevTools:**
   - Network tab → Response tab
   - Check actual JSON structure
   - Update types if necessary

---

## Routing Issues

### ❌ Problem: 404 on page refresh

**Symptoms:**
- Direct URL navigation shows 404
- Refreshing page breaks routing
- Works on initial load, fails on reload

**Solutions:**

1. **Development: Ensure Vite dev server handles SPA routing**
   - Vite automatically handles this
   - No action needed in development

2. **Production: Configure server for SPA:**

**For Netlify (_redirects):**
```
/*    /index.html   200
```

**For Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**For Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

### ❌ Problem: Routes not rendering components

**Symptoms:**
- Blank page on navigation
- No errors in console
- URL changes but content doesn't

**Solutions:**

1. **Check ErrorBoundary:**
   - May be catching errors silently
   - Open React DevTools
   - Look for error state

2. **Verify lazy loading:**
```typescript
// Ensure Suspense wrapper exists
<Suspense fallback={<LoadingSpinner fullScreen />}>
  <LazyComponent />
</Suspense>
```

3. **Check for missing exports:**
```typescript
// Component file must have default export
export default function MyPage() {
  return <div>Content</div>;
}
```

4. **Inspect with React DevTools:**
   - Install React Developer Tools extension
   - Check component tree
   - Look for suspended components

---

### ❌ Problem: Redirects not working

**Symptoms:**
- AuthGuard not redirecting to login
- Protected routes accessible without auth
- Navigate doesn't change route

**Solutions:**

1. **Verify AuthGuard usage:**
```tsx
// Must wrap protected routes
<Route path="/profile" element={
  <AuthGuard>
    <ProfilePage />
  </AuthGuard>
} />
```

2. **Check authentication state:**
```javascript
// In browser console
const { isAuthenticated } = useAuth();
console.log('Is authenticated:', isAuthenticated);
```

3. **Verify Navigate import:**
```typescript
import { Navigate } from 'react-router';
// NOT from 'react-router-dom' (different library)
```

---

## Build & Deployment

### ❌ Problem: Build fails with TypeScript errors

**Symptoms:**
- `npm run build` exits with errors
- Type checking failures
- "Cannot find name" or "Property does not exist"

**Solutions:**

1. **Fix TypeScript errors:**
```bash
# Run TypeScript compiler to see all errors
npx tsc --noEmit
```

2. **Check for missing type definitions:**
```bash
npm install --save-dev @types/node @types/react @types/react-dom
```

3. **Verify all imports:**
   - Check for missing exports
   - Ensure correct file paths
   - Verify type imports

4. **Skip type checking temporarily (not recommended):**
```bash
SKIP_TYPE_CHECK=true npm run build
```

---

### ❌ Problem: Build succeeds but app doesn't work in production

**Symptoms:**
- Blank page after deployment
- Console shows module errors
- Assets fail to load

**Solutions:**

1. **Check base URL in vite.config.ts:**
```typescript
export default defineConfig({
  base: '/', // Or your subdirectory like '/trinetrai/'
});
```

2. **Verify environment variables:**
   - Create `.env.production`
   - Set `VITE_API_URL` to production backend

3. **Check build output:**
```bash
npm run build
# Inspect dist/ folder
# Ensure index.html and assets exist
```

4. **Test production build locally:**
```bash
npm run build
npm run preview
# Visit http://localhost:4173
```

---

### ❌ Problem: Large bundle size / slow loading

**Symptoms:**
- Initial load takes > 5 seconds
- Bundle size > 1MB
- Poor Lighthouse scores

**Solutions:**

1. **Verify lazy loading is working:**
```typescript
// Check that routes use React.lazy
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
```

2. **Analyze bundle:**
```bash
npm run build
npx vite-bundle-visualizer
```

3. **Optimize images:**
   - Use WebP format
   - Compress images
   - Lazy load images

4. **Enable code splitting:**
```typescript
// Vite automatically splits chunks
// Check dist/assets/ for multiple JS files
```

---

## Performance Issues

### ❌ Problem: Slow page transitions

**Symptoms:**
- Navigation takes 1-2 seconds
- Blank screen during navigation
- Laggy route changes

**Solutions:**

1. **Verify lazy loading config:**
```typescript
// Use Suspense with loading indicator
<Suspense fallback={<LoadingSpinner fullScreen />}>
  <Routes />
</Suspense>
```

2. **Prefetch routes:**
```typescript
// On hover, prefetch lazy components
<Link 
  to="/catalog"
  onMouseEnter={() => import('./pages/CatalogPage')}
>
  Browse Catalog
</Link>
```

3. **Reduce bundle size:**
   - Check for duplicate dependencies
   - Remove unused imports
   - Use tree-shaking

---

### ❌ Problem: Memory leaks / increasing memory usage

**Symptoms:**
- Browser becomes slow over time
- Tab crashes after extended use
- Performance degrades

**Solutions:**

1. **Clean up useEffect:**
```typescript
useEffect(() => {
  const controller = new AbortController();
  
  fetchData(controller.signal);
  
  return () => {
    controller.abort(); // Cleanup
  };
}, []);
```

2. **Remove event listeners:**
```typescript
useEffect(() => {
  const handleResize = () => {};
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

3. **Clear intervals/timeouts:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {}, 1000);
  
  return () => {
    clearInterval(interval);
  };
}, []);
```

---

## UI/UX Issues

### ❌ Problem: Tailwind styles not applying

**Symptoms:**
- Classes present but no styling
- Components look unstyled
- CSS not loading

**Solutions:**

1. **Verify Tailwind config:**
```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
};
```

2. **Check CSS import:**
```typescript
// In main.tsx or App.tsx
import './styles/index.css';
// or
import 'tailwindcss/tailwind.css';
```

3. **Restart dev server:**
```bash
# Stop and restart
npm run dev
```

4. **Clear Tailwind cache:**
```bash
rm -rf node_modules/.cache
npm run dev
```

---

### ❌ Problem: Loading spinner not showing

**Symptoms:**
- Blank screen during loading
- No feedback during async operations
- Suspense fallback not working

**Solutions:**

1. **Verify Suspense wrapper:**
```tsx
<Suspense fallback={<LoadingSpinner fullScreen />}>
  <LazyComponent />
</Suspense>
```

2. **Check LoadingSpinner import:**
```typescript
import LoadingSpinner from './components/common/LoadingSpinner';
```

3. **Use loading state:**
```typescript
const [loading, setLoading] = useState(false);

// Show spinner
if (loading) return <LoadingSpinner fullScreen />;
```

---

### ❌ Problem: Forms not submitting

**Symptoms:**
- Submit button does nothing
- No network requests
- Form values not capturing

**Solutions:**

1. **Prevent default form submission:**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault(); // Important!
  // ... handle submission
};

<form onSubmit={handleSubmit}>
```

2. **Check button type:**
```tsx
<button type="submit">Submit</button>
// NOT type="button"
```

3. **Verify state updates:**
```typescript
const [email, setEmail] = useState('');

console.log('Email:', email); // Debug value

<input 
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

---

### ❌ Problem: ErrorBoundary not catching errors

**Symptoms:**
- White screen on error
- No fallback UI
- Errors bypass error boundary

**Solutions:**

1. **Errors must be in render:**
   - ErrorBoundary only catches render errors
   - Won't catch async errors or event handler errors

2. **Wrap async errors:**
```typescript
const [error, setError] = useState(null);

try {
  await fetchData();
} catch (err) {
  setError(err); // Trigger re-render with error
}

if (error) throw error; // Error boundary will catch
```

3. **Verify ErrorBoundary placement:**
```tsx
// Must wrap routes/components
<ErrorBoundary>
  <Routes />
</ErrorBoundary>
```

---

## Getting More Help

If you're still stuck:

1. **Check browser console:**
   - Look for error messages
   - Check Network tab for failed requests
   - Inspect component state with React DevTools

2. **Enable verbose logging:**
```typescript
// In api/index.ts
apiClient.interceptors.request.use((config) => {
  console.log('API Request:', config);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);
```

3. **Check documentation:**
   - [README.md](./README.md)
   - [API Documentation](./API_DOCUMENTATION.md)
   - [Migration Plan](../LEARNING_PLATFORM_MIGRATION_PLAN.md)

4. **Review backend logs:**
```bash
cd AI-PrivacyLearning-main/backend
npm run start:dev
# Watch console output for errors
```

---

**Last Updated**: Phase 11 - Documentation
