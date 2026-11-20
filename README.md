# Maison Indigo — Interior Design Studio (Demo Website)

A responsive, single-page demo site for a made-up interior design agency based in Kolhapur. The brand name, people, address, phone, reviews and stats are all invented.

## Run it
Serve the folder with `python -m http.server 5500` and open http://localhost:5500.
The 3D scenes load as JavaScript modules, so use a server (any static host works) rather than double-clicking the file.

## Structure
```
index.html            – all sections
css/style.css         – design system (colour tokens at the top)
js/main.js            – interactions: sliders, forms, estimator, WhatsApp delivery
js/animations.js      – GSAP scroll animations, Lenis smooth scroll, magnetic buttons
js/three-scenes.js    – three.js: 3D room configurator + floating shapes in the contact section
```

## Features
- Consultation popup that opens 3.5 s after load, once per session (offer banner, lead form)
- Preloader, sticky header with a Services dropdown, slide-in mobile menu, active-section highlighting
- Hero slider: 3 slides, 01/03 counter, progress bar, arrow buttons, rotating "45 days" badge
- Awards ticker, About section, animated counters
- Services cards that open the form pre-filled with the service, plus a USP strip
- Project gallery with category filters and a lightbox (keyboard arrows and Esc work)
- Before/after drag slider
- Interactive 3D Studio (three.js): visitors rotate a 3D living room and change the sofa, feature wall, rug and floor finishes live, with Front, Corner and Top views
- Scroll animations: masked title reveals, image curtain reveals, parallax, staggered cards, a smooth-scroll ticker that skews with scroll speed, and a header that hides on scroll down
- 6-step process stepper; each step lists what the client receives
- Cost estimator: home type, rooms and finish level give a live price range and an EMI figure
- Reviews slider (auto-play, dots, swipe), Google-style rating box, press logo row
- Studio-visit card with tour/consult options, a booking modal with date and time, a map and area chips
- FAQ accordion, journal cards, contact form, newsletter sign-up
- Floating WhatsApp, call and back-to-top buttons
- Form validation with inline error messages and a success state

## Colour palette
Midnight `#0B1020`, navy `#1B2550`, wine `#9E1E3C` (with `#F0587C` for accents on dark sections) and pure white `#FFFFFF`.
Sections alternate between white and midnight. No gold, green, yellow, grey, cream or beige is used in the design. Photos are shown in their natural colours.

## Before going live
- **Forms go to WhatsApp +91 87678 07414.** On submit, WhatsApp opens with all the form details already typed in, and the visitor taps Send. To change the number, edit `WHATSAPP_NUMBER` in `js/main.js`. Sending messages automatically, with no tap, would need the paid WhatsApp Business API.
- The call and WhatsApp buttons use +91 87678 07414. Replace it, the email, the address and the map location with the client's details.
- The images come from Unsplash. Swap them for the client's own project photos.
