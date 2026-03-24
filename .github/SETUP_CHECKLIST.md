# ✅ Setup Checklist for Non-Programmers

**Follow this checklist step-by-step to get your website fully set up.**

---

## 🎯 Phase 1: Verify Everything Works (Right Now!)

- [ ] Go to: https://github.com/sameednawaz-vu/velnoraai
- [ ] Verify you can see all the files
- [ ] Check the green checkmark in the "Actions" tab (means website deployed successfully)
- [ ] Visit your staging site: https://sameednawaz-vu.github.io/velnoraai
- [ ] Verify you see the website with 3D animation on homepage

**Done?** Great! Your website is live! 🎉

---

## 🔧 Phase 2: Setup External Services (15-20 minutes)

### Part A: Setup Contact Form
**Goal**: Allow visitors to send you messages

- [ ] Go to: https://formspree.io
- [ ] Click "Sign Up"
- [ ] Create account with your email
- [ ] Create new form, name it "velnoraai"
- [ ] Copy the **Form ID** (looks like: `f_xxxxxxxxxxxxxxxx`)
- [ ] Go to: https://github.com/sameednawaz-vu/velnoraai/blob/main/src/components/ContactForm.astro
- [ ] Click the pencil icon (edit)
- [ ] Find line: `action="https://formspree.io/f/FORM_ID"`
- [ ] Replace `FORM_ID` with your actual ID
- [ ] Scroll down and click "Commit changes"
- [ ] Add a message: "Added Formspree form ID"
- [ ] Click "Commit"
- [ ] Wait 1-2 minutes, contact form will now work!

✅ **Contact form complete**

---

### Part B: Setup Google Analytics
**Goal**: Track how many people visit your website

- [ ] Go to: https://analytics.google.com
- [ ] Sign in with Google account (create free if needed)
- [ ] Click "Create Property"
- [ ] Enter "velnoraai" as name → Continue
- [ ] Fill in business details (can be anything)
- [ ] Agree to terms → Create Property
- [ ] Look for your **Measurement ID** (format: `G-XXXXXXXXXX`)
- [ ] Copy the ID
- [ ] Go to: https://github.com/sameednawaz-vu/velnoraai/blob/main/src/layouts/BaseLayout.astro
- [ ] Click pencil icon (edit)
- [ ] Search (Ctrl+F) for `GOOGLE_ANALYTICS_ID`
- [ ] Replace **BOTH instances** with your actual Measurement ID
- [ ] Scroll to bottom and click "Commit changes"
- [ ] Add message: "Added Google Analytics ID"
- [ ] Click "Commit"
- [ ] Wait 1-2 minutes, analytics will start tracking!

✅ **Analytics complete**

---

### Part C: Setup reCAPTCHA (Optional - For Spam Protection)
**Goal**: Prevent spam bots from using your contact form

- [ ] Go to: https://www.google.com/recaptcha/admin
- [ ] Click "Create +" button
- [ ] Label: "velnoraai"
- [ ] reCAPTCHA type: Select **v3**
- [ ] Add domain: `velnoraai.com`
- [ ] Accept terms → Create
- [ ] Copy your **Site Key**
- [ ] Go to: https://github.com/sameednawaz-vu/velnoraai/blob/main/src/components/ContactForm.astro
- [ ] Click pencil icon (edit)
- [ ] Find: `data-sitekey="RECAPTCHA_SITE_KEY"`
- [ ] Replace `RECAPTCHA_SITE_KEY` with your actual key
- [ ] Also find: `<script src="https://www.google.com/recaptcha/api.js"></script>`
- [ ] Scroll to bottom and click "Commit changes"
- [ ] Add message: "Added reCAPTCHA protection"
- [ ] Click "Commit"

✅ **Spam protection complete**

---

## 🌐 Phase 3: Setup Your Domain (30 min + 24-48 hour wait)

### Part A: Update Namecheap DNS

- [ ] Go to: https://www.namecheap.com/dashboard
- [ ] Find **velnoraai.com** → Click **"Manage"**
- [ ] Click **"Advanced DNS"** tab
- [ ] Find the **A Record** section
- [ ] Delete any existing A records
- [ ] Add **FOUR new A records** with these values:

| # | Host | Value | TTL |
|---|------|-------|-----|
| 1 | @ | 185.199.108.153 | 30 min |
| 2 | @ | 185.199.109.153 | 30 min |
| 3 | @ | 185.199.110.153 | 30 min |
| 4 | @ | 185.199.111.153 | 30 min |

- [ ] Click "Save All Changes"
- [ ] DNS changes take 24-48 hours

✅ **Namecheap DNS updated**

---

### Part B: Update GitHub Pages Settings

- [ ] Go to: https://github.com/sameednawaz-vu/velnoraai/settings/pages
- [ ] Under "Custom domain", enter: `velnoraai.com`
- [ ] Click **"Save"**
- [ ] GitHub will show a check once DNS updates (24-48 hours)
- [ ] GitHub will auto-create HTTPS certificate

✅ **GitHub configured**

---

### Part C: Verify Domain Works

- [ ] Wait 24-48 hours for DNS to propagate
- [ ] Try visiting: https://velnoraai.com
- [ ] Should show your website!
- [ ] HTTPS should work automatically

✅ **Domain is live!**

---

## 📝 Phase 4: Start Editing Content (Ongoing)

### Option A: Quick Edits on GitHub (Recommended for Small Changes)

**Edit Blog Post:**
- [ ] Go to: https://github.com/sameednawaz-vu/velnoraai/edit/main/src/pages/blog/%5Bslug%5D.astro
- [ ] Click pencil
- [ ] Edit content
- [ ] Click "Commit changes"
- [ ] Wait 1-2 minutes

**Edit Prompts:**
- [ ] Go to: https://github.com/sameednawaz-vu/velnoraai/edit/main/src/content/prompts.json
- [ ] Click pencil
- [ ] Edit JSON
- [ ] Click "Commit changes"
- [ ] Wait 1-2 minutes

---

### Option B: Edit on Your Computer (Recommended for Large Changes)

**Setup (first time only):**
```
1. Open PowerShell
2. Copy-paste this exactly:
   cd C:\Users\YourUsername\Documents
   git clone https://github.com/sameednawaz-vu/velnoraai.git
   cd velnoraai
3. Press Enter
```

**Every time you want to edit:**
```
1. Open PowerShell
2. Copy-paste:
   cd C:\Users\YourUsername\Documents\velnoraai
3. Open folder in Windows Explorer (File → Open folder in File Explorer)
4. Edit files in Notepad
5. Save files
6. Back in PowerShell, copy-paste:
   git add .
   git commit -m "Description of changes"
   git push
7. Wait 1-2 minutes for website to update
```

✅ **Content editing started**

---

## 🎊 Final Checklist

**Website Status:**
- ✅ Code on GitHub
- ✅ Website deployed (staging URL active)
- ✅ Contact form setup
- ✅ Analytics setup
- ✅ Domain DNS configured
- ✅ Live domain working
- ✅ Content being edited

**You're Done!** Your website is fully operational. 🎉

---

## 📊 Bookmark These Links

**Daily Use:**
- Edit blog: https://github.com/sameednawaz-vu/velnoraai/edit/main/src/pages/blog/%5Bslug%5D.astro
- Edit prompts: https://github.com/sameednawaz-vu/velnoraai/edit/main/src/content/prompts.json
- Check deployment: https://github.com/sameednawaz-vu/velnoraai/actions

**Less Frequent:**
- Repository: https://github.com/sameednawaz-vu/velnoraai
- Settings: https://github.com/sameednawaz-vu/velnoraai/settings/pages
- Analytics: https://analytics.google.com
- Formspree: https://formspree.io

---

## 💡 Remember

✓ Changes always deploy automatically  
✓ Always click "Commit changes" after editing  
✓ Wait 1-2 minutes for changes to appear  
✓ Check Actions tab if something's wrong  
✓ Everything is reversible in GitHub  
✓ You're doing great! 🚀  

---

**Questions?** Read the full guide: `.github/INSTRUCTIONS.md`
