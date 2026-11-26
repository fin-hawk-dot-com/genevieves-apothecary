# Genevieve's Apothecary — Outskirts of Willowmere

A cozy, stress-free, one-handed **Portrait-mode** 2.5D diorama mobile game crafted for **Genevieve**, built with **Phaser 3 (WebGL)**, **React 19**, **Vite**, **PWA Offline Service Worker**, and **Capacitor 8** for both **Google Pixel 10 Pro XL (Native Android APK)** and **Genevieve's iPhone (Fullscreen Standalone Web App / Capacitor iOS)**.

## Gameplay Highlights
- **Explore Three Connected 2.5D Diorama Zones**: Genevieve's sunlit Apothecary Cottage (with sleepy shop cat **Nutmeg**), the Outskirts Meadow & Whispering Brook, and Willowmere Village Square.
- **Gather & Cultivate Botanicals**: Forage wild Sunblossom Chamomile, Silverleaf Mint, Willowbark, Emberginger Root, Amber Pine Resin, Starlight Lavender, and rare Moonpetal Lilies—plus cultivate Cottage Herb Planter Boxes.
- **Tactile Ingredient Preparation**: Slice stems & bark on the cutting board, crush roots & petals in the stone mortar & pestle, and distill floral essences in the copper alembic.
- **Simmer Potions & Fold Poultices**: Brew glowing corked potions in the copper cauldron and fold breathable linen herbal poultices & salves.
- **Manage Stock & Upgrades**: Stock display shelves, flip the door sign to **Open**, watch townsfolk stroll in to browse and buy remedies, and unlock cozy shop upgrades.
- **Interactive Villager Care Quests**: Deliver remedies and directly treat villagers' forge burns, baker's wrist strain, sprained ankles, and bee stings on the healer's table.

---

## Running & Deploying

### 1. Local Dev / LAN Preview (Instant Test on iPhone & Pixel)
```powershell
cd c:\Users\jhawk\Aviary\nodes\genevieves-apothecary
npm run dev
```
Open `http://<YOUR-LAN-IP>:5179` (or deploy `dist/` to any HTTPS static host like Cloudflare Pages / Render / `slyhawk.net`).
On **Genevieve's iPhone**, open the URL in **Safari**, tap **Share**, and tap **Add to Home Screen** to install **Genevieve's Apothecary** full-screen with its custom icon and offline save persistence.

### 2. Native Android APK Build (Pixel 10 Pro XL)
```powershell
cd c:\Users\jhawk\Aviary\nodes\genevieves-apothecary
npm run build
npx cap sync android

$env:JAVA_HOME = "C:\Users\jhawk\scoop\apps\openjdk21\current"
$env:ANDROID_HOME = "C:\Users\jhawk\AppData\Local\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

cd android
.\gradlew.bat assembleDebug
# APK output: android\app\build\outputs\apk\debug\app-debug.apk
```
