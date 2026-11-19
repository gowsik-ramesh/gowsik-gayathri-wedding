# Gowsik & Gayathri — Wedding Invitation

A static, mobile-friendly wedding invitation. No build step, account, database, or dependencies are needed.

## Important: confirm the year

The invitation assumes **13 and 14 December 2026**. If this is incorrect, update every reference to the year in `index.html` (including the weekday names and page metadata), `script.js` (countdown and calendar event dates/times), and `style.css` only if you add year-specific text there. Calendar times in `script.js` are stored in UTC; the displayed times are Indian Standard Time (UTC+05:30).

## Deploy to Vercel

1. Unzip the project if needed and upload the `wedding-invitation` folder to a GitHub repository.
2. At https://vercel.com/new, import the repository.
3. If the files are at the root of the repository, leave the root directory unchanged. If they are inside a folder, set the Root Directory to `wedding-invitation`.
4. Select **Other** for the framework preset. No build command or output directory is required. Click Deploy.
5. Share the resulting Vercel URL. Updates pushed to your repository will redeploy the site.

You can also deploy from this folder using the Vercel CLI (`npx vercel`), following its prompts.

## Add a photo and music

The invitation includes `assets/mangal-rang.mp3` and `assets/samajavaragamana-bgm.mp3`, supplied by the user. Mangal Rang is the default; guests can select either track in the floating music control. Verify that you have permission to use and share both tracks before publishing. Playback starts only after a guest taps the music button.

1. Put your image and/or replacement music files in the `assets` folder. For example, `assets/couple.jpg` and `assets/music.mp3`.
2. Open `config.js` and change the two values to the file paths:

   ```js
   couplePhoto: 'assets/couple.jpg',
   backgroundMusic: 'assets/music.mp3',
   backgroundMusicName: 'My song',
   additionalMusic: []
   ```

3. Save and redeploy. The photo section and music button only appear when configured. Music starts only when a guest chooses to play it, in accordance with browser autoplay policies. Use only music you have permission to share.

## Edit the invitation

- Names, parents, venue, displayed dates, wording, metadata, and map link: `index.html`.
- Countdown and downloadable calendar entries: `script.js`. Update these as well if event dates or times change.
- Colors, layout, and animation: `style.css`.
- The cinematic mandapam background: `assets/royal-mandapam.png` (AI-generated illustration).
- The South Indian wedding miniature: `assets/south-indian-miniature.png` (AI-generated illustrative characters, not portraits). Its tilt and sparkle effects are in `style.css` and `script.js`. Gentle independent figure motion is simulated with a WebGL image warp in `miniature-motion.js`; it is a flat illustration, not a 3D model or video. The static image remains available if WebGL is unavailable or reduced motion is enabled.
- Previously used artwork remains available in the `assets` folder but is not displayed on the invitation.

To preview locally, serve the folder with any static server, for example `python3 -m http.server 8000`, then open http://localhost:8000. The sharing button needs a secure HTTPS deployment for clipboard access on most browsers.
