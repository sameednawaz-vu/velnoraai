# 📖 Velnora Website – Non-Technical Instructions

**Welcome!** This guide explains how to manage your Velnora website without needing coding skills. Everything is done through simple copy-paste commands or the GitHub website interface.

---

## 🚀 Quick Start: What You Need to Know

### What is This?
- **Velnora** is a free tools website built with:
  - Homepage with animated 3D graphics
  - 7 blog articles 
   - Workflow templates organized in 4 categories
  - Contact form for visitors
  - Google Analytics to track visitors

### Where Does It Live?
- **Code stored on**: GitHub (github.com/sameednawaz-vu/velnoraai)
- **Website hosted on**: GitHub Pages (automatic)
- **Your domain**: velnoraai.com (pending DNS setup)

### What You Can Do
✅ Add/edit blog articles  
✅ Add/edit workflow templates  
✅ Make content changes  
✅ Deploy updates (automatic)  
✅ Check website performance  
✅ Manage contact form setup  

---

## Agent System Rules (Saved For Future)

Use these rules for every future UX/UI and tool-surface task:

- Always review managed UX/UI sources from .github/agent-skills before making design decisions.
- Always include 21st.dev as a suggested UI reference in UX/UI recommendations.
- Prefer @apad/framer-motion for animation work where motion is needed.
- Keep external sources organized in the managed skills folder with source links and usage notes.
- Include OpenSpace (HKUDS/OpenSpace) as an additive managed source for host-skill and workflow-evolution references.
- Treat gstack as orchestration baseline, then apply UI/UX and SEO-GEO skill packs as additive layers.
- Apply the custom Ghulam Ali semantic SEO skill pack for semantic topic coverage and pre-publish SEO QA.
- For every compressor or file-processing tool, require a large drag-and-drop upload area plus click-to-upload fallback.
- Keep this upload behavior as a universal reusable rule for all future tools.

---

## 👨‍💻 What You DON'T Need to Do
❌ Write code  
❌ Install software (mostly already set up)  
❌ Manage servers  
❌ Handle technical deployments  

---

## 📋 Common Tasks

### Task 1: Edit a Blog Article

**Goal**: Update or edit an existing blog post

#### Option A: Quick Edit on GitHub (Easiest for Small Changes)

1. Go to: https://github.com/sameednawaz-vu/velnoraai
2. Navigate to: `src/pages/blog/[slug].astro`
3. Click the **pencil icon** (Edit)
4. Find the article content section (look for `<h2>Article Content</h2>`)
5. Edit the text between the tags
6. Click **"Commit changes"** button at bottom
7. Add a message like "Updated blog article about [topic]"
8. Click **"Commit"**
9. **Done!** Changes deploy automatically in 1-2 minutes

#### Option B: Full Edit on Your Computer (Recommended for Large Changes)

1. Open PowerShell on your computer
2. Run these commands:
   ```powershell
   cd C:\Users\YourUsername\Documents
   git clone https://github.com/sameednawaz-vu/velnoraai.git
   cd velnoraai
   ```

3. Open file: `src/pages/blog/[slug].astro` in **Notepad**
4. Find the article content section and edit
5. Save the file
6. Back in PowerShell, run:
   ```powershell
   git add .
   git commit -m "Updated blog article"
   git push
   ```

7. **Done!** Your changes appear on the website in 1-2 minutes

---

### Task 2: Add a New Blog Article

**Goal**: Add a completely new blog post

#### Steps:

1. Go to: https://github.com/sameednawaz-vu/velnoraai/edit/main/src/pages/blog/%5Bslug%5D.astro

2. Find this section near the top:
   ```
   const blogPosts = [
       { slug: 'pick-right-converter-tool-60-seconds', ... },
       { slug: 'batch-compression-workflow-faster-publishing', ... },
     ...
   ```

3. **Add a new line** with your blog article. Copy this template and fill in:
   ```
   { slug: 'your-article-url', title: 'Your Article Title Here', description: 'Short description that appears in previews.', publishedDate: '2026-03-25', author: 'Velnora Team', readingTime: 10 },
   ```

   Replace:
   - `your-article-url` with no spaces (use hyphens instead)
   - `Your Article Title Here` with actual title
   - Short description
   - Date (YYYY-MM-DD)
   - Reading time in minutes

4. Scroll down and find: `<h2>Article Content</h2>`

5. Replace the paragraph below it with your article content (you can use basic HTML or plain text)

6. Click **"Commit changes"**

7. Done! Blog article appears on website in 1-2 minutes

---

### Task 3: Edit or Add Workflow Templates

**Goal**: Add/edit workflow templates in the library

#### Steps:

1. Go to: https://github.com/sameednawaz-vu/velnoraai/blob/main/src/content/prompts.json

2. Click the **pencil icon** to edit

3. Find the category you want to edit (creative, business, technical, marketing)

4. **To Edit Existing Template:**
   - Find the template title
   - Update the description, example, or useCase
   - Save

5. **To Add New Template:**
   - Find your category section
   - Copy an existing template structure:
     ```json
     {
       "id": "your-prompt-id",
          "title": "What This Template Does",
          "description": "Detailed description of the workflow template",
          "example": "Example usage or template flow",
          "useCase": "When/why you would use this template",
       "category": "creative"
     }
     ```
   - Fill in your own values
   - Add comma after the previous prompt if needed

6. Click **"Commit changes"**

7. Done! Templates update on website in 1-2 minutes

---

### Task 4: Deploy Your Changes

**Status**: ✅ **Changes deploy AUTOMATICALLY** – When you edit anything on GitHub or push code, the website updates in 1-2 minutes with no action needed from you!

To verify deployment:
1. Go to: https://github.com/sameednawaz-vu/velnoraai/actions
2. You'll see recent "deployments" listed
3. Green checkmark = successful deployment ✅
4. Red X = something went wrong ❌

---

### Task 5: Create a New Page (Advanced)

**Goal**: Add an entirely new page/section to the website

This requires creating a file, so it's easiest to do on your computer:

1. Open PowerShell and navigate to your project:
   ```powershell
   cd C:\path\to\velnoraai
   ```

2. Open the folder `src/pages` in Explorer

3. Create a new file called `your-page-name.astro` in Notepad

4. Copy this template:
   ```
   ---
   import BaseLayout from '../layouts/BaseLayout.astro';
   import Header from '../components/Header.astro';
   import Footer from '../components/Footer.astro';
   
   const title = "Your Page Title";
   const description = "Description for search engines";
   ---
   
   <BaseLayout title={title} description={description}>
     <Header />
     <main>
       <h1>Your Page Title</h1>
       <p>Your page content here</p>
     </main>
     <Footer />
   </BaseLayout>
   ```

5. Save the file in the `src/pages` folder

6. In PowerShell, run:
   ```powershell
   git add .
   git commit -m "Added new page: your-page-name"
   git push
   ```

7. Your page appears at: `velnoraai.com/your-page-name`

---

## 🔧 Setup Tasks (One-Time)

### Task A: Enable GitHub Pages Deployment

**Status**: ✅ Already done for you!

Your website automatically deploys when you make changes. No action needed.

---

### Task B: Setup Contact Form (Enable Visitor Messages)

**Goal**: Let visitors send messages through the contact form

**Steps:**

1. Go to: https://formspree.io
2. Sign up with your email
3. Create a new form, name it "velnoraai" (or anything)
4. Copy your **Form ID** (looks like: `f_xxxxxxxxx`)
5. Go to: https://github.com/sameednawaz-vu/velnoraai/blob/main/src/components/ContactForm.astro
6. Click pencil to edit
7. Find: `action="https://formspree.io/f/FORM_ID"`
8. Replace `FORM_ID` with your actual ID from step 4
9. Click **"Commit changes"**
10. Done! Contact form now sends messages to your email

---

### Task C: Setup Google Analytics (Track Visitors)

**Goal**: See how many people visit your website

**Steps:**

1. Go to: https://analytics.google.com
2. Sign in with your Google account (create free account if needed)
3. Click **"Create Property"** → Enter "velnoraai" as name
4. Follow the wizard to get your **Measurement ID** (looks like: `G-XXXXXXXXXX`)
5. Go to: https://github.com/sameednawaz-vu/velnoraai/blob/main/src/layouts/BaseLayout.astro
6. Click pencil to edit
7. Search for `GOOGLE_ANALYTICS_ID` (appears twice)
8. Replace both instances with your Measurement ID from step 4
9. Click **"Commit changes"**
10. Done! You'll see visitor stats in Google Analytics dashboard

---

### Task D: Setup reCAPTCHA (Stop Contact Form Spam)

**Goal**: Protect contact form from automated spam

**Steps:**

1. Go to: https://www.google.com/recaptcha/admin
2. Sign in and click **"Create" or "+"**
3. Label: "velnoraai"
4. reCAPTCHA type: Select **v3**
5. Domains: Add `velnoraai.com`
6. Accept terms and submit
7. Copy your **Site Key**
8. Go to: https://github.com/sameednawaz-vu/velnoraai/blob/main/src/components/ContactForm.astro
9. Click pencil to edit
10. Find: `data-sitekey="RECAPTCHA_SITE_KEY"`
11. Replace `RECAPTCHA_SITE_KEY` with your actual key from step 7
12. Click **"Commit changes"**
13. Done! Spam protection enabled

---

### Task E: Point Your Domain (velnoraai.com → Website)

**Goal**: Make velnoraai.com show your website

**Prerequisites:**
- You've already bought velnoraai.com at Namecheap
- GitHub Pages deployment is working

**Steps:**

#### At Namecheap:

1. Go to: https://www.namecheap.com/dashboard/
2. Find **velnoraai.com** → Click **"Manage"**
3. Click **"Advanced DNS"** tab
4. Find the **A Records** section
5. **Delete existing entries** and add these NEW A records:

   | Type | Host | Value | TTL |
   |------|------|-------|-----|
   | A | @ | 185.199.108.153 | 30 min |
   | A | @ | 185.199.109.153 | 30 min |
   | A | @ | 185.199.110.153 | 30 min |
   | A | @ | 185.199.111.153 | 30 min |

6. Save changes
7. Wait 24-48 hours for DNS to update

#### At GitHub:

1. Go to: https://github.com/sameednawaz-vu/velnoraai/settings/pages
2. Under "Custom domain", enter: `velnoraai.com`
3. Click **"Save"**
4. GitHub will auto-create an HTTPS certificate once DNS updates

**Done!** Your site will be accessible at velnoraai.com in 24-48 hours

---

## 📊 File Structure (Where Things Are)

```
velnoraai/
├── src/
│   ├── pages/                    ← Website pages
│   │   ├── index.astro          ← Homepage (with 3D animation)
│   │   ├── about.astro          ← About page
│   │   ├── contact.astro        ← Contact form
│   │   ├── library.astro        ← Prompts library
│   │   ├── blog/
│   │   │   ├── index.astro      ← Blog listing
│   │   │   └── [slug].astro     ← Individual blog articles
│   │   └── prompts/
│   │       └── category/
│   │           └── [slug].astro ← Prompt categories
│   ├── components/               ← Reusable parts
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ContactForm.astro
│   │   └── Hero3D.tsx           ← 3D animation
│   ├── layouts/
│   │   ├── BaseLayout.astro     ← Main layout (has GA code)
│   │   └── BlogPost.astro       ← Blog layout
│   └── content/
│       └── prompts.json         ← All 12 prompts
├── .github/                     ← GitHub automation
│   └── workflows/
│       └── deploy.yml           ← Auto-deploy settings
├── package.json                 ← Project dependencies
├── astro.config.mjs             ← Website configuration
└── README.md                    ← Project overview
```

---

## 🆘 Help & Troubleshooting

### Problem: "Cannot access GitHub"
**Solution**: Make sure you're using the correct URL and logged in to GitHub

### Problem: "Website hasn't updated after I pushed changes"
**Solution**: Wait 2-3 minutes (sometimes takes a bit). Check the Actions tab to see deployment status

### Problem: "Contact form doesn't work"
**Solution**: Make sure you added your Formspree Form ID correctly

### Problem: "Website shows error messages"
**Solution**: Check the Actions tab at GitHub. Look for the deployment with a ❌ mark to see what went wrong

### Problem: "I accidentally broke something"
**Solution**: 
1. Go to GitHub
2. Click "Code" tab
3. Look for a "Revert" option on recent commits
4. Or ask for help in the repository Issues section

---

## 📝 Editing Tips

### Keep in Mind:
- **Always click "Commit changes"** after editing – if you don't, changes won't be saved
- **Website updates automatically** – no need to do anything after committing
- **Changes take 1-2 minutes** to appear on the live site
- **You can always undo** by reverting to previous versions in GitHub

### Best Practices:
- Write clear commit messages ("Updated blog article about..." not just "Update")
- Test changes on your computer in Notepad first if editing complex sections
- Back up important content before making big changes
- One change per commit makes it easier to undo if needed

---

## 🚀 Next Steps

1. **Review your current content** (blog, prompts)
2. **Setup external services** if needed:
   - ✅ Formspree (for contact form)
   - ✅ Google Analytics (for visitor tracking)
   - ✅ reCAPTCHA (for spam protection)
3. **Setup your domain** (velnoraai.com)
4. **Start editing** and adding content!

---

## 📞 Quick Reference

**Your Repository**: https://github.com/sameednawaz-vu/velnoraai

**Your Website** (once domain is set up): https://velnoraai.com

**GitHub Pages Dashboard**: https://github.com/sameednawaz-vu/velnoraai/settings/pages

**Deployment Status**: https://github.com/sameednawaz-vu/velnoraai/actions

**Edit Blog (Easy)**: https://github.com/sameednawaz-vu/velnoraai/edit/main/src/pages/blog/%5Bslug%5D.astro

**Edit Prompts (Easy)**: https://github.com/sameednawaz-vu/velnoraai/edit/main/src/content/prompts.json

---

## ✅ You're All Set!

Everything is ready to go. Your website is live at GitHub Pages and will update automatically whenever you make changes. 

**Questions?** Check the GitHub Issues section or reach out to your developer.

**Happy editing!** 🎉
