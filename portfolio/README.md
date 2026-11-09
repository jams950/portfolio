# Jermaine Mae C. Noquera Portfolio

A personal portfolio built with HTML, CSS and JavaScript. It has no build step.

This copy is a **working draft**. Dashed blue text and buttons mark details that still need your real content.

## Run it in VS Code

1. Open the `portfolio` folder in VS Code (File > Open Folder).
2. Install the **Live Server** extension by Ritwick Dey.
3. Right-click `index.html` and choose **Open with Live Server**.

You can also double-click `index.html` to open it in a browser.

## Update your details

| What | Where |
| --- | --- |
| Email, social links, project links, form key | `js/config.js` |
| Introduction, About, skills, projects, experience | `index.html` (search for `EDIT` and `class="ph"`) |
| Colors for each theme | `css/themes.css` |
| Fonts, spacing and layout | `css/style.css` and `css/responsive.css` |
| Animation timing | `js/animations.js` |

The site is ready to publish when searching `index.html` for `class="ph"` and `project__slot` finds nothing, and every value in `js/config.js` you want shown is filled in.

### Replace your photo

The hero uses `assets/images/profile.webp`, a cut-out portrait with a transparent background.
Save a new file with the same name to replace it. A PNG also works if you update the `src` in `index.html`.

### Add project screenshots

1. Put the image in `assets/projects/`, for example `readsync.webp`.
2. In `index.html`, replace the `project__cover` div for that project with the `<img>` line in the comment above it.

### Add a project

Copy a whole `<article class="project">` block and edit its text. For new links, add an entry under `projects` in `js/config.js` and point the `data-config` attributes at it.

### Add a skill

Copy one `<li class="tile">` in the Skills section. Put a matching SVG in `assets/icons/`.

## Turn on the contact form

The site has no server, so the form sends through [Web3Forms](https://web3forms.com), a free email service.

1. Go to web3forms.com and enter the email address that should receive messages.
2. Copy the access key they email you.
3. Paste it into `formAccessKey` in `js/config.js`.
4. Publish the site and send yourself a test message.

Until a key is added, the form validates input and tells the visitor the message was not sent. It never pretends to work.

## Publish online

The whole folder can be uploaded as it is to GitHub Pages, Netlify or Vercel.

## Folder structure

```
portfolio/
├── index.html
├── css/
│   ├── style.css         Layout and components
│   ├── responsive.css    Tablet and phone rules
│   └── themes.css        Light and dark colors
├── js/
│   ├── config.js         Your links and form key
│   ├── script.js         Navigation, links and contact form
│   ├── animations.js     Preloader, reveals and filter animation (GSAP, Lenis)
│   ├── lanyard.js        The hanging ID card
│   └── theme.js          Dark and light mode
└── assets/
    ├── images/           Your photo
    ├── icons/            Skill icons and favicon
    ├── projects/         Project screenshots
    ├── certificates/     Certificate images
    ├── fonts/            Plus Jakarta Sans and Allura
    └── vendor/           GSAP, ScrollTrigger, Flip, Lenis and Lucide
```

## Libraries

- [GSAP](https://gsap.com) with ScrollTrigger and Flip for animation
- [Lenis](https://lenis.darkroom.engineering) for smooth scrolling
- [Lucide](https://lucide.dev) for interface icons
- [Simple Icons](https://simpleicons.org) for technology logos

Everything is stored in this folder, so the site does not depend on outside CDNs.
Visitors who ask their device to reduce motion get the site without the animations.

## Design notes

The layout follows the TikTok reference: deep navy with soft glows, a hanging ID card in the hero, centered section headers, filterable skills, project case-study pages, a journey timeline and a certificate gallery.

- **ID card:** `js/lanyard.js` runs a small physics simulation. Drag the card to swing it. Strap text and stiffness are in `SETTINGS` at the top of the file.
- **Card position:** the card is on the left, as your brief asked. To put it on the right like the reference, change `<section class="hero"` to `<section class="hero hero--card-right"` in `index.html`.
- **Project pages:** each project card opens the matching `detail__page` at the bottom of `index.html`. Links such as `yoursite.com/#detail-readsync` open that page directly.
- **Certificates:** add an image to `assets/certificates/` and copy a `<li>` in the Certificates section.
- **Resume section:** the resume shown on the page is plain HTML in the Resume section of `index.html`. Update it together with the PDF.
- **CV:** the Download CV button serves `assets/Jermaine-Noquera-Resume.pdf`. To update it, export your resume as a PDF and save it over that file.
- **Photos:** your stage photos are in `assets/images/`. Project screenshots are in `assets/projects/`.
