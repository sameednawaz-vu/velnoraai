# GitHub Pages Deployment Guide

Your Velnora website is ready for deployment! Follow these steps to push to GitHub Pages.

## Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `velnora` (or your preferred name)
3. Description: "Velnora AI Learning Website"
4. **IMPORTANT**: Make it **PUBLIC** (required for GitHub Pages)
5. Do NOT initialize with README, .gitignore, or license (we have these locally)
6. Click "Create repository"

## Step 2: Add Remote and Push to GitHub

After creating the repository, you'll see commands like:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/velnora.git
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username**.

Run in PowerShell from `F:\velnoraai`:

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/velnora.git
git push -u origin main
```

## Step 3: Enable GitHub Pages

1. Go to your GitHub repository page
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
   - This will use the automatic deployment workflow already configured
4. Wait 1-2 minutes for the first deployment

## Step 4: View Your Live Site

After deployment completes:
- GitHub Pages will show your site at: `https://YOUR_USERNAME.github.io/velnora`
- Check the **Deployments** section in your repo for status

## Step 5: Setup Custom Domain (velnoraai.com)

Once you've verified the site works at GitHub Pages URL:

### At Namecheap:
1. Go to DNS settings for velnoraai.com
2. Add these A records pointing to GitHub Pages:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`

3. Note the @ symbol means the domain root

### In GitHub:
1. Go to your repo **Settings** → **Pages**
2. Under "Custom domain", enter: `velnoraai.com`
3. Check "Enforce HTTPS" once available
4. GitHub will auto-provision an SSL certificate

**Note**: DNS propagation takes 24-48 hours. Your site will be accessible at the GitHub URL immediately.

## Step 6: Configure External Services

Your site has placeholders for:

### Google Analytics:
1. Create Analytics property at google.com/analytics
2. Get your Measurement ID (format: G-XXXXXXXXXX)
3. Update `src/layouts/BaseLayout.astro`:
   - Replace both instances of `GOOGLE_ANALYTICS_ID` with your actual ID

### Contact Form (Formspree):
1. Go to formspree.io
2. Create new form
3. Get your form ID
4. Update `src/components/ContactForm.astro`:
   - Replace `FORM_ID` with your Formspree ID in the action URL

### reCAPTCHA (Spam Protection):
1. Go to google.com/recaptcha/admin
2. Create new site for reCAPTCHA v3
3. Get your Site Key
4. Update `src/components/ContactForm.astro`:
   - Replace `RECAPTCHA_SITE_KEY` with your actual key

## Step 7: Verify Everything Works

After deployment:
- ✅ Visit your domain and check all pages load
- ✅ Verify 3D animation loads on homepage
- ✅ Test prompt copy button
- ✅ All blog articles accessible
- ✅ Contact form submits (once configured)

## Making Future Updates

After you make changes:

```powershell
cd F:\velnoraai
git add .
git commit -m "Description of changes"
git push
```

The GitHub Actions workflow will automatically rebuild and deploy!

## Troubleshooting

**"GitHub Pages cannot deploy from source push" error:**
- Ensure repo is PUBLIC
- Go to Settings → Pages → Select "GitHub Actions" as source

**Site not updating after push:**
- Check Actions tab in GitHub for workflow status
- Deployments typically take 1-2 minutes

**Custom domain not working:**
- DNS changes can take up to 48 hours
- Clear browser cache and try incognito window
- Verify A records are correct at Namecheap

---

**You're all set!** The build is complete, Git is initialized, and you're ready to push to GitHub. 🚀
