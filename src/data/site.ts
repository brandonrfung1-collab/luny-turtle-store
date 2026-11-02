// Business facts for the site, in one place.
// Facts marked CONFIRMED come from Esther's own Instagram profile/posts.
// Facts marked PLACEHOLDER are guesses for the demo and must be confirmed with Esther before launch.

/** true in the static Vercel demo build (`npm run build:vercel`), which has no server. */
export const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === '1';

export const site = {
  brand: 'Luny Turtle',
  artistName: 'Esther Jun', // CONFIRMED (profile)
  artistFirstName: 'Esther',
  pronouns: 'she/her', // CONFIRMED (profile)
  role: 'AAPI Illustrator', // CONFIRMED (profile)
  instagramHandle: '@artbylunyturtle', // CONFIRMED
  instagramUrl: 'https://www.instagram.com/artbylunyturtle/',
  hashtag: '#commissionbylunyturtle', // CONFIRMED (Halloween post)
  medium: 'Ink and colored pencil', // CONFIRMED
  shippingIncluded: true, // CONFIRMED ("Shipping is included.")
  shipsTo: 'the US', // PLACEHOLDER — not stated anywhere
  turnaround: 'about 2 to 3 weeks from sketch approval', // PLACEHOLDER
  holidayNotice: "I'm still taking a few more holiday commissions!", // CONFIRMED (Dec post wording)
  /** Studio dashboard passcode for the demo (localhost only). */
  studioPasscode: 'turtle',
  /** Shown on checkout and in the footer. */
  demoNotice: STATIC_DEMO
    ? 'This is a demo store. No real payments are taken, no orders are sent to Esther, and demo orders are saved only in your browser.'
    : 'This is a demo store running on your computer. No real payments are taken and no orders are sent to Esther.',
  /** where demo orders are kept, for small print ("saved ___ only") */
  ordersSavedIn: STATIC_DEMO ? 'in this browser' : 'on this computer',
} as const;

/** The making process, in Esther's words where possible. */
export const processSteps = [
  {
    title: 'Tell me about your people',
    body: "Pick a drawing type, share a few photos and the scene you're dreaming of. You don't need an exact photo: \"Here are pics of my fam. Can you draw us paddle boarding?\" works just as well.",
  },
  {
    title: 'Thumbnail sketches',
    body: 'I brainstorm small thumbnails, then send you a pencil sketch so you can request changes before any ink goes down.',
  },
  {
    title: 'Ink and colored pencil',
    body: 'Once you approve the sketch, I ink and color it by hand on 8" x 10" paper, finished with my signature turtle.',
  },
  {
    title: 'Shipped to your door',
    body: 'Your original drawing is packed with care and shipped to you (or straight to the lucky giftee). Shipping is included.',
  },
] as const;

/** About-page copy, adapted from Esther's own captions and bio. */
export const aboutCopy = {
  intro:
    "Since the dawn of time (about 25 years ago), I've been drawing as a way to show my love and gratitude for the people in my life. It's a special kind of warmth to be able to put your heart and time into something that brings so much joy to a loved one.",
  nyc: "I spent 8 years of my adult life in NYC figuring out who I am and what I wanted to do. The energy of that city is like no other and I'll always hold it dear.",
  family:
    'Family has always been an inspiration and motivation for my art. My mom and stepdad, Miyoung and Moses, are my biggest fans.',
  moo: 'Ever since I adopted Moo (yes, Moo), my mom has been her #1 fan. She is a grumpy ole kitty cat and the unofficial studio supervisor.',
  closing: "With that in mind, I'd love to make a special drawing for you~ A little piece of joy to gift to yourself or a friend.",
} as const;
