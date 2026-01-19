# Chrome Web Store Submission Guide

## Prerequisites

1. **Google Developer Account** - One-time $5 fee at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. **Screenshots** - At least 1 screenshot (1280x800 or 640x400)
3. **Privacy Policy URL** - Host PRIVACY_POLICY.md somewhere accessible (GitHub, your site)

## Step 1: Package the Extension

```bash
cd extension
chmod +x store/package.sh
./store/package.sh
```

This creates `store/dist/aem-generative-websites.zip`

## Step 2: Upload to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **New Item**
3. Upload `store/dist/aem-generative-websites.zip`
4. Fill in the store listing:

### Store Listing Fields

| Field | Value |
|-------|-------|
| **Name** | AEM Generative Websites |
| **Description** | Copy from STORE_LISTING.md |
| **Category** | Developer Tools |
| **Language** | English |

### Privacy Tab

| Field | Value |
|-------|-------|
| **Single Purpose** | "Capture browsing signals and generate AI-powered content for AEM Edge Delivery demos" |
| **Permission Justifications** | See below |
| **Privacy Policy URL** | Your hosted URL |

#### Permission Justifications

- **storage**: "Store captured browsing signals and user preferences locally for session continuity"
- **tabs**: "Detect active tab to capture signals only on supported sites"
- **activeTab**: "Read current page URL and content for signal extraction"
- **webNavigation**: "Track navigation events to capture page view signals"
- **sidePanel**: "Display the intent inference panel interface"
- **Host permissions**: "Capture signals only on vitamix.com and aem.live domains"

### Distribution Tab

| Field | Value |
|-------|-------|
| **Visibility** | Unlisted |
| **Regions** | All regions (or restrict as needed) |

## Step 3: Take Screenshots

Required screenshots (1280x800 recommended):

1. **Panel with signals** - Open panel on vitamix.com showing live signal feed
2. **Inferred profile** - Panel showing detected segments and confidence
3. **Generation in action** - POC site with streaming content

Tips:
- Use a clean browser profile
- Load an example scenario for consistent demo data
- Capture at 1280x800 for best quality

## Step 4: Submit for Review

1. Review all fields
2. Click **Submit for Review**
3. Unlisted extensions typically review faster (hours to days)

## After Approval

You'll receive:
- Direct install link: `https://chrome.google.com/webstore/detail/[extension-id]`
- Share this link on your custom install page

## Updating the Extension

1. Increment version in `manifest.json`
2. Run `./store/package.sh`
3. Go to Developer Dashboard → Your extension
4. Click **Package** → **Upload new package**
5. Submit for review

## Troubleshooting

**"Manifest is invalid"**
- Ensure manifest_version is 3
- Check all icon paths exist

**"Missing permission justification"**
- Fill in Single Purpose description
- Justify each permission in Privacy tab

**"Screenshots required"**
- Upload at least 1 screenshot (1280x800 or 640x400)

**Review rejected**
- Check email for specific rejection reasons
- Common issues: missing privacy policy, inadequate justifications
