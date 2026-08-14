// scroll.js
// Assumes GSAP + ScrollTrigger already loaded via CDN <script> tags,
// and D3 has already drawn the static SVG into the DOM before this runs.

gsap.registerPlugin(ScrollTrigger);

// --- config -----------------------------------------------------
// Fill in with your actual group/element selectors, in reveal order.
// Each entry = one reveal "beat" (could be a whole scene or a sub-group).
const beats = [
    // { selector: '.scene-1', label: 'scene1' },
    // { selector: '.scene-2', label: 'scene2' },
    // ...
];

const pinTarget = '#chart-container'; // your SVG's wrapping element

// --- initial hidden state ---------------------------------------
gsap.set(beats.map(b => b.selector), { opacity: 0 });

// --- master timeline ---------------------------------------------
const tl = gsap.timeline({
    scrollTrigger: {
        trigger: pinTarget,
        start: 'top top',
        end: '+=4000',      // total scroll distance — tune this
        scrub: true,
        pin: true,
        // markers: true,   // uncomment while testing
    }
});

beats.forEach((beat) => {
    tl.addLabel(beat.label);
    tl.to(beat.selector, { opacity: 1, duration: 1 });
    // add a hold / spacer here if you want dead scroll space between beats
});

// --- finale sequence ----------------------------------------------
// Separate from the loop above — pulls specific elements by id,
// repositions them, then reveals final text.
//
// tl.addLabel('finale');
// tl.to('#some-element-id', { attr: { y: 200 }, duration: 1 });
// tl.to('.final-text', { opacity: 1, duration: 1 });