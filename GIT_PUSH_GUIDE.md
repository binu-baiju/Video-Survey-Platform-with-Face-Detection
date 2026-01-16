# How to Push to GitHub - Step by Step

## 📋 Prerequisites
- GitHub account (create at https://github.com if you don't have one)
- Git installed (usually comes with macOS)

---

## 🚀 Step-by-Step Instructions

### Step 1: Create GitHub Repository

1. Go to https://github.com and sign in
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in:
   - **Repository name**: `video-survey-platform` (or any name you like)
   - **Description**: "Video Survey Platform with Face Detection"
   - **Visibility**: Choose **Public** (assignment requires public repo)
   - **DO NOT** check "Initialize with README" (we already have one)
4. Click **"Create repository"**

### Step 2: Copy Repository URL

After creating, GitHub will show you a page with commands. Copy the repository URL:
- It looks like: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`
- Or: `git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git`

### Step 3: Open Terminal

Open Terminal on your Mac (Applications → Utilities → Terminal)

### Step 4: Navigate to Your Project

```bash
cd "/Users/binubaiju/Documents/Job Hunting/Assignments/FRS Lab"
```

### Step 5: Initialize Git (if not already done)

```bash
git init
```

### Step 6: Add All Files

```bash
git add .
```

This adds all files (the .md files we don't want are already in .gitignore, so they won't be added)

### Step 7: Check What Will Be Committed

```bash
git status
```

You should see:
- ✅ All your code files
- ✅ README.md
- ❌ No HOSTING_GUIDE.md, DEPLOYMENT_CHECKLIST.md, etc. (they're ignored)

### Step 8: Make Your First Commit

```bash
git commit -m "Initial commit - Video Survey Platform with Face Detection"
```

### Step 9: Add Remote Repository

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**Example:**
```bash
git remote add origin https://github.com/binubaiju/video-survey-platform.git
```

### Step 10: Push to GitHub

```bash
git push -u origin main
```

If you get an error about "main" branch, try:
```bash
git push -u origin master
```

### Step 11: Authenticate

GitHub will ask for authentication:
- **Option 1**: Use GitHub Personal Access Token (recommended)
  - Go to GitHub → Settings → Developer settings → Personal access tokens → Generate new token
  - Give it "repo" permissions
  - Copy the token and use it as password when prompted

- **Option 2**: Use GitHub CLI (if installed)
  ```bash
  gh auth login
  ```

---

## ✅ Verify It Worked

1. Go to your GitHub repository page
2. You should see all your files there
3. Check that:
   - ✅ README.md is there
   - ✅ All code files are there
   - ❌ No HOSTING_GUIDE.md, DEPLOYMENT_CHECKLIST.md, etc.

---

## 🆘 Troubleshooting

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Error: "Authentication failed"
- Use Personal Access Token instead of password
- Or set up SSH keys

### Error: "branch 'main' does not exist"
```bash
git branch -M main
git push -u origin main
```

### Want to see what files will be pushed?
```bash
git ls-files
```

---

## 📝 Quick Copy-Paste Commands

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME`:

```bash
cd "/Users/binubaiju/Documents/Job Hunting/Assignments/FRS Lab"
git init
git add .
git commit -m "Initial commit - Video Survey Platform"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## 🎯 That's It!

Your code is now on GitHub and ready to deploy! 🚀
