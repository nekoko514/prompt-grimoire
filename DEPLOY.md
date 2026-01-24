# How to Deploy Prompt Grimoire

If you are seeing a white screen on GitHub Pages, it is likely because the upload was done incorrectly.

## The Correct Method (Manual Upload)

1. **Build the Project** (I have already done this for you locally).
   - This creates a `dist` folder.
2. **Open the `dist` folder**.
   - Inside you will see `index.html`, an `assets` folder, and maybe a `vite.svg`.
3. **Upload THESE files**.
   - Do NOT upload the `dist` folder itself.
   - Go to your GitHub Repository.
   - Click "Add file" -> "Upload files".
   - Drag and drop **everything INSIDE the `dist` folder** (`index.html`, `assets`, etc.) directly into the root of the upload area.
4. **Commit changes**.
5. Wait for GitHub Actions to deploy (or check Settings -> Pages ensuring it points to `root`).

## Why does this happen?
GitHub Pages looks for `index.html` at the top level. If you upload `dist/index.html`, the URL would be `.../dist/`, but usually Pages defaults to root.

## Mobile Use (PWA)
Once deployed:
1. Open the site on iPhone (Safari) or Android (Chrome).
2. Tap "Share" -> "Add to Home Screen".
3. It will install with the custom Alastor icon and open in full screen!
