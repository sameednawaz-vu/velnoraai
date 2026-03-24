# ⚡ Quick Command Reference

**Copy-paste these commands into PowerShell to manage your website.**

---

## 🔄 Update Your Website (On Your Computer)

### Step 1: Get the Latest Version
```powershell
cd C:\Users\YourUsername\Documents
git clone https://github.com/sameednawaz-vu/velnoraai.git
cd velnoraai
```

### Step 2: Make Your Changes
- Edit files in Notepad or your favorite text editor
- Save files

### Step 3: Send Changes to GitHub (Deploy)
```powershell
git add .
git commit -m "Description of what you changed"
git push
```

**Website updates in 1-2 minutes automatically!**

---

## 📝 Edit Blog Articles

### Edit on GitHub (Easiest for Small Changes):
1. Go to: https://github.com/sameednawaz-vu/velnoraai
2. Navigate to: `src/pages/blog/[slug].astro`
3. Click pencil icon
4. Make changes
5. Click "Commit changes"
6. Add message and "Commit"

### Edit on Your Computer (Recommended):
1. File to edit: `src/pages/blog/[slug].astro`
2. Find the article content section
3. Edit text
4. Save
5. Run deployment commands above

---

## 🤖 Edit AI Prompts

### File: `src/content/prompts.json`

**Edit on GitHub:**
1. Go to: https://github.com/sameednawaz-vu/velnoraai/blob/main/src/content/prompts.json
2. Click pencil icon
3. Find your prompt
4. Edit title, description, example, or useCase
5. Click "Commit changes"

**Format example:**
```json
{
  "id": "unique-id",
  "title": "Prompt Title",
  "description": "What this prompt does",
  "example": "How to use it",
  "useCase": "When to use it",
  "category": "creative"
}
```

---

## 🌐 Check If Changes Deployed Successfully

Go to: https://github.com/sameednawaz-vu/velnoraai/actions

Look for:
- 🟢 Green checkmark = Success ✅
- 🔴 Red X = Error ❌

---

## 🔗 Important Links

| What | Link |
|------|------|
| Your Repository | https://github.com/sameednawaz-vu/velnoraai |
| Edit Blog | https://github.com/sameednawaz-vu/velnoraai/edit/main/src/pages/blog/%5Bslug%5D.astro |
| Edit Prompts | https://github.com/sameednawaz-vu/velnoraai/edit/main/src/content/prompts.json |
| Check Deployment | https://github.com/sameednawaz-vu/velnoraai/actions |
| GitHub Pages Settings | https://github.com/sameednawaz-vu/velnoraai/settings/pages |
| Your Website (staging) | https://sameednawaz-vu.github.io/velnoraai |

---

## 📟 Common Commands Explained

| Command | What It Does |
|---------|-------------|
| `git clone [url]` | Download project to your computer |
| `git add .` | Prepare all changes to send to GitHub |
| `git commit -m "message"` | Save changes with description |
| `git push` | Send changes to GitHub (triggers deployment) |
| `git status` | Check what files changed |
| `git pull` | Get latest version from GitHub |

---

## ⚙️ One-Time Setup (Already Mostly Done)

- ✅ Website created
- ✅ GitHub repository created
- ✅ Auto-deployment configured
- ⏳ **TODO**: Add Formspree ID for contact form (see INSTRUCTIONS.md)
- ⏳ **TODO**: Add Google Analytics ID for tracking (see INSTRUCTIONS.md)
- ⏳ **TODO**: Setup domain DNS pointing (see INSTRUCTIONS.md)

---

## 💡 Pro Tips

✓ Make one change per commit (easier to undo)  
✓ Use clear commit messages  
✓ Wait 1-2 minutes for changes to appear online  
✓ Check Actions tab if something seems wrong  
✓ Always `git push` after committing to deploy changes  

---

## 🆘 Need Help?

Read: `.github/INSTRUCTIONS.md` – Full detailed guide for all tasks

---

**Now you're ready to manage your website!** 🚀
