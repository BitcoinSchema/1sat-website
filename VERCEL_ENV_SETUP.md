# Vercel Environment Variables Setup

This document describes the environment variables needed for the 1sat.market website deployment on Vercel.

## Required Environment Variables

### API Endpoints

#### `NEXT_PUBLIC_MARKET_API_HOST`
**Description:** Backend API for market data, balances, and token operations
**Production:** `https://api.1sat.market` (production API)
**Development/Alpha:** `https://api1satmarket-dev-production.up.railway.app` (dev API with upgrade/market-api branch)

**Railway Deployments:**
- Production: `https://api.1sat.market`
- Development: `https://api1satmarket-dev-production.up.railway.app`

#### `NEXT_PUBLIC_API_HOST`
**Description:** Ordinals indexer API (GorillaPool)
**Default:** `https://ordinals.gorillapool.io`
**Note:** Typically doesn't need to change

#### `NEXT_PUBLIC_ORDFS_URL`
**Description:** Ordinals file storage network
**Default:** `https://ordfs.network`
**Note:** Typically doesn't need to change

### Other Environment Variables (already configured)

- `UPLOADTHING_SECRET` - UploadThing API secret
- `UPLOADTHING_APP_ID` - UploadThing application ID
- `NEXT_PUBLIC_OLLAMA_URL` - Optional, for AI features
- `NEXT_PUBLIC_APP_URL` - Base URL for the application

## Deployment Configuration

### Production (1sat.market - master/main branch)
```
NEXT_PUBLIC_MARKET_API_HOST=https://api.1sat.market
NEXT_PUBLIC_API_HOST=https://ordinals.gorillapool.io
NEXT_PUBLIC_ORDFS_URL=https://ordfs.network
```

### Development/Alpha (alpha.1sat.market - alpha branch)
```
NEXT_PUBLIC_MARKET_API_HOST=https://api1satmarket-dev-production.up.railway.app
NEXT_PUBLIC_API_HOST=https://ordinals.gorillapool.io
NEXT_PUBLIC_ORDFS_URL=https://ordfs.network
```

## How to Set in Vercel

### Via Vercel Dashboard
1. Go to https://vercel.com/bopen/1sat-website/settings/environment-variables
2. Add each variable with appropriate scope:
   - **Production** - for master/main branch
   - **Preview (alpha)** - for alpha branch
   - **Development** - for local development

### Via Vercel CLI
```bash
# Production
vercel env add NEXT_PUBLIC_MARKET_API_HOST production

# Preview (for alpha branch)
vercel env add NEXT_PUBLIC_MARKET_API_HOST preview

# Development
vercel env add NEXT_PUBLIC_MARKET_API_HOST development
```

## Testing the Change

After setting environment variables:

1. **Trigger a new deployment** (push to alpha branch)
2. **Verify the API host** in browser console:
   ```javascript
   // In browser console on deployed site
   fetch('/api/feed?cursor=0&limit=1')
     .then(r => r.json())
     .then(console.log)
   ```
3. **Check Network tab** to confirm API calls go to correct endpoint

## Rollback Plan

If issues occur, the constants.ts file has safe fallback defaults:
- `MARKET_API_HOST` defaults to `https://api.1sat.market`
- `API_HOST` defaults to `https://ordinals.gorillapool.io`
- `ORDFS` defaults to `https://ordfs.network`

Simply remove the environment variable to revert to defaults.

## Next Steps

1. ✅ Update constants.ts to use environment variables (DONE)
2. ⏳ Set `NEXT_PUBLIC_MARKET_API_HOST` in Vercel for alpha branch
3. ⏳ Test alpha deployment with upgrade/market-api backend
4. ⏳ If successful, merge 1sat-api PR #2 and update production env var
