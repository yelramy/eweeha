
export interface Route {
  slug: string
  title: string
  description: string
  from: string
  to: string
  distance: string
  duration: string
  image: string
  highlights: string[]
  faqs: {
    question: string
    answer: string
  }[]
  category: 'areas' | 'experiences'
  priceRange?: {
    min: number
    max: number
  }
  referenceVehicle?: string
}

export const routes: Record<string, Route> = {
  'wedding-cars-beirut': {
    slug: 'wedding-cars-beirut',
    category: 'areas',
    title: 'Wedding Cars in Beirut',
    description: 'Chauffeured wedding cars in Beirut: decorated bridal cars and full cortège convoys for church ceremonies in Achrafieh, downtown, and every neighborhood of the capital.',
    from: 'Bridal prep — home, salon, or hotel',
    to: 'Churches & venues across Beirut',
    distance: 'All Beirut neighborhoods',
    duration: 'Ceremony, celebration, or full day',
    image: '/images/areas/ornament.svg',
    priceRange: { min: 150, max: 600 },
    referenceVehicle: 'Decorated bridal sedan with chauffeur',
    highlights: [
      'Cortège routes planned around Beirut traffic — you arrive on time, relaxed',
      'St. George Maronite Cathedral, St. Nicolas, and all Achrafieh & downtown churches',
      'Pickups from the Phoenicia, Four Seasons, and all Beirut hotels',
      'Ribbon and fresh-flower decoration matched to your bouquet',
      'Photo stop planning along the corniche and old Beirut streets'
    ],
    faqs: [
      {
        question: 'How do you handle Beirut traffic on a wedding day?',
        answer: 'We scout the route in advance, plan alternate streets, and add buffer time around your church slot. Your chauffeur drives the route before the big day, so the cortège never improvises.'
      },
      {
        question: 'Can the cortège pass through a specific street or neighborhood?',
        answer: 'Yes. Many couples want the convoy to pass by the family home or a meaningful street. Tell us and we build it into the route and timing.'
      },
      {
        question: 'Do you coordinate with the zaffe at the house?',
        answer: 'Absolutely. We time the cars around the zaffe so the bride leaves exactly when the moment peaks — no honking convoy waiting awkwardly, no rushed goodbyes.'
      }
    ]
  },
  'wedding-cars-jounieh-harissa': {
    slug: 'wedding-cars-jounieh-harissa',
    category: 'areas',
    title: 'Wedding Cars in Jounieh & Harissa',
    description: 'Wedding car rental in Jounieh, Kaslik, and Harissa. Bridal cars and cortège convoys for Our Lady of Lebanon ceremonies and bay-view venue celebrations.',
    from: 'Jounieh, Kaslik, Adma & surroundings',
    to: 'Harissa & bay-view venues',
    distance: 'Jounieh bay to the Harissa summit',
    duration: 'Ceremony, celebration, or full day',
    image: '/images/areas/ornament.svg',
    priceRange: { min: 150, max: 600 },
    referenceVehicle: 'Decorated bridal sedan with chauffeur',
    highlights: [
      'Experienced with the winding Harissa road — smooth ride up to Our Lady of Lebanon',
      'Ceremonies at the Basilica of Our Lady of Lebanon and Jounieh parish churches',
      'Receptions at Casino du Liban and bay-view venues',
      'Golden-hour photo stops overlooking the Bay of Jounieh',
      'Guest shuttle vans for hotels in Jounieh and Kaslik'
    ],
    faqs: [
      {
        question: 'Can the bridal car go all the way up to Harissa?',
        answer: 'Yes. Our chauffeurs drive the Harissa road regularly and know where to stage the cortège near the basilica, including drop-off points that keep the dress and photos picture-perfect.'
      },
      {
        question: 'Where do you recommend photos in the Jounieh area?',
        answer: 'The classic spots are the Harissa viewpoint over the bay and the old Jounieh souk street. We time the cars so you catch golden hour at the viewpoint.'
      },
      {
        question: 'Can you shuttle guests from Beirut to a Jounieh venue?',
        answer: 'Yes — our guest shuttle vans and minibuses run alongside the wedding cortège, so the whole wedding moves as one operation.'
      }
    ]
  },
  'wedding-cars-byblos-batroun': {
    slug: 'wedding-cars-byblos-batroun',
    category: 'areas',
    title: 'Wedding Cars in Byblos & Batroun',
    description: 'Wedding cars for Byblos (Jbeil) and Batroun: seaside church ceremonies, old souk photo sessions, and beach venue receptions on Lebanon\'s most romantic coast.',
    from: 'Byblos, Amchit, Batroun & the coast',
    to: 'Seaside churches & beach venues',
    distance: 'The Jbeil–Batroun coastline',
    duration: 'Ceremony, celebration, or full day',
    image: '/images/areas/ornament.svg',
    priceRange: { min: 180, max: 650 },
    referenceVehicle: 'Convertible or classic car with chauffeur',
    highlights: [
      'The iconic St. Stephen\'s seaside church in Batroun and old Byblos churches',
      'Photo sessions in the Byblos old souks, harbor, and Batroun\'s Phoenician wall',
      'Beach venue receptions — Edde Sands and the coast\'s open-air venues',
      'Convertibles shine here: sea breeze, stone alleys, golden light',
      'Sunset timing planned around your ceremony slot'
    ],
    faqs: [
      {
        question: 'Can we do the photo session in the old souks of Byblos?',
        answer: 'Yes — it is one of the most beautiful photo settings in Lebanon. We park the classic car at the edge of the pedestrian souk and coordinate walking shots with your photographer.'
      },
      {
        question: 'Is a convertible practical for a coastal wedding?',
        answer: 'On this coast, absolutely. We keep the top down for the cortège and photos, and up for the highway stretches so the bride\'s hair and veil survive the ride.'
      },
      {
        question: 'Do you cover weddings in Amchit and the villages above Byblos?',
        answer: 'Yes, the whole district — coastal towns and mountain villages alike. Distance within the area does not change the package price.'
      }
    ]
  },
  'wedding-cars-broummana-metn': {
    slug: 'wedding-cars-broummana-metn',
    category: 'areas',
    title: 'Wedding Cars in Broummana & the Metn',
    description: 'Wedding car rental in Broummana, Beit Mery, Baabdat, and the Metn: pine-forest churches, mountain venues, and cortège convoys with Beirut skyline views.',
    from: 'Beirut or the Metn villages',
    to: 'Broummana, Beit Mery, Baabdat & Beit Misk',
    distance: 'The high Metn, 20-40 min from Beirut',
    duration: 'Ceremony, celebration, or full day',
    image: '/images/areas/ornament.svg',
    priceRange: { min: 150, max: 600 },
    referenceVehicle: 'Decorated bridal sedan with chauffeur',
    highlights: [
      'Summer wedding classic: pine forests, cool air, and skyline views',
      'Churches of Broummana, Beit Mery, and Baabdat, and the Mar Chaaya monastery area',
      'Venue arrivals at Beit Misk and the Metn\'s garden venues',
      'Cortège staging on village roads — planned so the convoy fits and flows',
      'Evening return trips for the couple and close family'
    ],
    faqs: [
      {
        question: 'Our church is in Beirut but the venue is in Broummana — is that one package?',
        answer: 'Yes, that is the most common Lebanese wedding day. The celebration package covers prep, church, the drive up, and your venue entrance, all with one car and one chauffeur.'
      },
      {
        question: 'Are the mountain roads a problem for classic cars?',
        answer: 'We choose the car to match the route. Our classics handle the Metn roads well, and for steep village streets we position a backup modern car in the cortège just in case.'
      },
      {
        question: 'Can you handle a big family cortège of 5-10 cars?',
        answer: 'Yes. We provide the lead bridal car plus matching family cars, brief all chauffeurs on the route, and keep the convoy together with a simple radio/WhatsApp protocol.'
      }
    ]
  },
  'wedding-cars-faraya-faqra': {
    slug: 'wedding-cars-faraya-faqra',
    category: 'areas',
    title: 'Wedding Cars in Faraya & Faqra',
    description: 'Mountain wedding cars for Faraya, Faqra, and Kfardebian: chauffeured bridal cars for Faqra Club weddings, chapel ceremonies, and cloud-line photo sessions.',
    from: 'Beirut, Jounieh, or mountain hotels',
    to: 'Faqra Club, Kfardebian chapels & mountain venues',
    distance: 'The Kfardebian heights, ~1h from Beirut',
    duration: 'Celebration or full day recommended',
    image: '/images/areas/ornament.svg',
    priceRange: { min: 200, max: 650 },
    referenceVehicle: 'Luxury SUV or bridal sedan with chauffeur',
    highlights: [
      'Faqra Club weddings and the chapels of Kfardebian',
      'Photo stops above the clouds and at the Faqra natural bridge',
      'Chauffeurs experienced with mountain switchbacks in all seasons',
      'Luxury SUVs available when the venue road demands it',
      'Guest shuttle vans from Beirut hotels to the mountain'
    ],
    faqs: [
      {
        question: 'Is a mountain wedding harder to organize transport for?',
        answer: 'It just needs honesty about timing: the drive is longer and weather can shift. We add buffers, pick the right vehicles for the roads, and have driven these routes hundreds of times.'
      },
      {
        question: 'What happens if the weather turns on the day?',
        answer: 'Your chauffeur monitors the route and adjusts. In winter we equip appropriately and stage cars close to the venue, so the ceremony timeline is protected.'
      },
      {
        question: 'Can guests be shuttled up from Beirut?',
        answer: 'Yes — our vans and minibuses move guests up and back down at night, so nobody drives the mountain road after the party.'
      }
    ]
  },
  'wedding-cars-chouf-deir-el-qamar': {
    slug: 'wedding-cars-chouf-deir-el-qamar',
    category: 'areas',
    title: 'Wedding Cars in the Chouf & Deir el Qamar',
    description: 'Wedding car rental in Deir el Qamar, Beiteddine, and the Chouf: historic stone-village ceremonies at Saydet el Talleh and palace-view celebrations.',
    from: 'Beirut or the Chouf villages',
    to: 'Deir el Qamar, Beiteddine & Chouf venues',
    distance: 'The historic Chouf, ~1h from Beirut',
    duration: 'Celebration or full day recommended',
    image: '/images/areas/ornament.svg',
    priceRange: { min: 200, max: 650 },
    referenceVehicle: 'Classic car or bridal sedan with chauffeur',
    highlights: [
      'Ceremonies at Saydet el Talleh in Deir el Qamar\'s stone square',
      'Photo sessions among Ottoman-era palaces and cobbled alleys',
      'Venue arrivals near Beiteddine and at Mir Amin Palace',
      'Classic cars fit the historic setting beautifully',
      'Full-day packages for the long Beirut–Chouf–Beirut day'
    ],
    faqs: [
      {
        question: 'Can the car drive into old Deir el Qamar?',
        answer: 'The historic center has narrow cobbled lanes; we stage the bridal car at the best possible point by the square and plan the short walking moments with your photographer so nothing is rushed.'
      },
      {
        question: 'Is the Chouf too far for a Beirut-based cortège?',
        answer: 'Not at all — it is a classic full-day wedding. We recommend the 10-hour or 24-hour package so prep, ceremony, photos, and the venue entrance all fit without clock-watching.'
      },
      {
        question: 'Do you know the venues around Beiteddine?',
        answer: 'Yes. We regularly drive the Beiteddine–Deir el Qamar corridor and know the entrances, parking, and photo angles at the area\'s palaces and garden venues.'
      }
    ]
  },
  'wedding-cars-zahle-bekaa': {
    slug: 'wedding-cars-zahle-bekaa',
    category: 'areas',
    title: 'Wedding Cars in Zahle & the Bekaa',
    description: 'Wedding cars for Zahle and Bekaa Valley weddings: vineyard ceremonies at the great wineries, Saydet Zahle blessings, and cortège convoys across the valley.',
    from: 'Beirut, Zahle, or Bekaa towns',
    to: 'Zahle churches & Bekaa vineyard venues',
    distance: 'The Bekaa Valley, ~1h15 from Beirut',
    duration: 'Full day recommended',
    image: '/images/areas/ornament.svg',
    priceRange: { min: 200, max: 650 },
    referenceVehicle: 'Bridal sedan or luxury SUV with chauffeur',
    highlights: [
      'Vineyard weddings at the Bekaa\'s celebrated wineries — Ksara and Kefraya country',
      'Blessings at Saydet Zahle (Our Lady of Zahle) with the valley view',
      'Golden vineyard photo sessions at sunset',
      'Cortège convoys for big Zahle family weddings',
      'Late-night returns to Beirut handled — your chauffeur stays with you'
    ],
    faqs: [
      {
        question: 'Do you wait during the whole vineyard reception?',
        answer: 'On full-day bookings, yes. The car and chauffeur stay at the venue, decorated and ready for photos or an early exit for the couple, until the party ends.'
      },
      {
        question: 'Can we visit Saydet Zahle for a blessing between church and venue?',
        answer: 'A beloved Zahle tradition — of course. We build the stop into the timeline, including the drive up to the tower viewpoint.'
      },
      {
        question: 'Is the Beirut–Bekaa drive comfortable in a wedding dress?',
        answer: 'We plan for it: spacious sedans or SUVs for the bride, climate control, and a dress-friendly seating plan your stylist will approve of.'
      }
    ]
  },
  'wedding-cars-saida-south': {
    slug: 'wedding-cars-saida-south',
    category: 'areas',
    title: 'Wedding Cars in Saida, Jezzine & the South',
    description: 'Wedding car rental in South Lebanon: Maghdouche ceremonies at Our Lady of Mantara, Jezzine mountain weddings, and coastal celebrations around Saida.',
    from: 'Beirut, Saida, or southern towns',
    to: 'Maghdouche, Jezzine & southern venues',
    distance: 'Saida & the South — 45-90 min from Beirut',
    duration: 'Celebration or full day recommended',
    image: '/images/areas/ornament.svg',
    priceRange: { min: 200, max: 650 },
    referenceVehicle: 'Decorated bridal sedan with chauffeur',
    highlights: [
      'Ceremonies at Our Lady of Mantara (Maghdouche) overlooking the coast',
      'Jezzine mountain weddings by the waterfall town\'s churches',
      'Coastal photo stops around Saida\'s sea castle',
      'Cortège convoys for the South\'s big family celebrations',
      'One package covering the Beirut–South round trip'
    ],
    faqs: [
      {
        question: 'Do you really cover the South at the same standard?',
        answer: 'Yes. Same cars, same suited chauffeurs, same decoration. Our fleets drive the coastal highway daily, and southern weddings are among our favorites — big, warm, and unforgettable.'
      },
      {
        question: 'Can we combine Maghdouche ceremony and a Jezzine reception?',
        answer: 'Beautiful combination. It is a mountain climb between the two, so we recommend the full-day package and we handle the timing between ceremony, photos, and the venue entrance.'
      },
      {
        question: 'Are night returns from the South included?',
        answer: 'On celebration and full-day packages, yes — your chauffeur waits and drives you home safely, however late the dabke goes.'
      }
    ]
  },
  'wedding-cars-north-lebanon': {
    slug: 'wedding-cars-north-lebanon',
    category: 'areas',
    title: 'Wedding Cars in North Lebanon',
    description: 'Wedding cars for the North: Balamand monastery weddings, Ehden and Zgharta summer ceremonies, Chekka and Koura venues, and Tripoli celebrations.',
    from: 'Beirut, Tripoli, or northern towns',
    to: 'Balamand, Ehden, Zgharta, Koura & Tripoli',
    distance: 'The North, 1-2h from Beirut',
    duration: 'Full day recommended',
    image: '/images/areas/ornament.svg',
    priceRange: { min: 200, max: 700 },
    referenceVehicle: 'Bridal sedan or luxury SUV with chauffeur',
    highlights: [
      'Monastery weddings at Balamand with the sea horizon behind the vows',
      'Ehden and Zgharta summer weddings — the North\'s legendary celebrations',
      'Koura olive-grove venues and Chekka coastal receptions',
      'Experienced with the Qadisha-area mountain roads',
      'Multi-day arrangements for weddings with travelling guests'
    ],
    faqs: [
      {
        question: 'Our wedding is in Ehden but guests stay in Beirut — how does that work?',
        answer: 'Very common for summer weddings. The bridal car works on a full-day package in Ehden, while our shuttles move guests north and back overnight. One coordinator handles both.'
      },
      {
        question: 'Can the cortège form in the village tradition, house to church?',
        answer: 'Yes — northern village cortèges are the original. We stage the cars at the family home, coordinate with the zaffe, and lead the convoy through the village the traditional way.'
      },
      {
        question: 'Do you serve Tripoli itself?',
        answer: 'Yes, Tripoli and all its surroundings — churches, event halls, and seaside venues in El Mina included.'
      }
    ]
  },
  'classic-car-photoshoot': {
    slug: 'classic-car-photoshoot',
    category: 'experiences',
    title: 'Classic Car Wedding Photoshoot',
    description: 'Rent a classic car with chauffeur for your Lebanese wedding photoshoot: timeless vintage looks for the church exit, old souks, and coastal golden-hour sessions.',
    from: 'Your ceremony or prep location',
    to: 'The photo locations you dream of',
    distance: 'Flexible — planned with your photographer',
    duration: '2-6 hours, ceremony add-on or standalone',
    image: '/images/areas/ornament.svg',
    priceRange: { min: 300, max: 700 },
    referenceVehicle: 'Vintage classic with chauffeur',
    highlights: [
      'The shots that end up framed: vintage chrome, white ribbons, stone alleys',
      'Chauffeur doubles as a car handler for the photographer',
      'Route planned with your photographer before the day',
      'Pairs beautifully with old Byblos, Batroun, and Beirut\'s heritage streets',
      'Can lead the cortège or appear only for the session'
    ],
    faqs: [
      {
        question: 'Can we drive the classic car ourselves?',
        answer: 'Our classics come with a chauffeur — it protects the car, the dress, and the schedule. During the shoot, the chauffeur positions the car exactly where the photographer wants it.'
      },
      {
        question: 'What if we only want the car for photos, not the whole day?',
        answer: 'That is exactly what this experience is for: a 2-6 hour booking around your photo session, standalone or added to a bridal car package.'
      },
      {
        question: 'Which classic cars do you have?',
        answer: 'The lineup changes by season — check the fleet page for what is currently available, or message us on WhatsApp and we\'ll send photos of the current classics.'
      }
    ]
  },
  'convertible-cortege': {
    slug: 'convertible-cortege',
    category: 'experiences',
    title: 'Convertible Wedding Car & Open-Top Cortège',
    description: 'Convertible wedding cars in Lebanon: open-top bridal cars for coastal cortèges, mountain village convoys, and the wave-to-everyone church exit.',
    from: 'Your prep location',
    to: 'Church, photos & venue — top down',
    distance: 'Anywhere the sun is out',
    duration: 'Ceremony, celebration, or full day',
    image: '/images/areas/ornament.svg',
    priceRange: { min: 250, max: 650 },
    referenceVehicle: 'Convertible with chauffeur',
    highlights: [
      'The classic Lebanese moment: standing in the open car, waving, horns singing',
      'Top-down cortège along the coast or through the village',
      'Veil and hair logistics handled — top up on highways, down for the moments',
      'Perfect pairing with the zaffe arrival',
      'Sunset coastal photos with the top down'
    ],
    faqs: [
      {
        question: 'Will the convertible ruin the bride\'s hair?',
        answer: 'Not the way we run it: top up for highway stretches, down for the cortège, the church exit, and photos. Your stylist gets a say in the plan — we\'ve done this many times.'
      },
      {
        question: 'What happens if it rains?',
        answer: 'The top goes up and the day continues; if the forecast is bad in advance, we can swap to a classic or luxury sedan at no penalty.'
      },
      {
        question: 'Can the groom arrive separately in a second convertible?',
        answer: 'Yes — a two-convertible cortège for bride and groom is one of our most requested setups. The convoy is choreographed so both arrivals get their moment.'
      }
    ]
  },
  'zaffe-grand-arrival': {
    slug: 'zaffe-grand-arrival',
    category: 'experiences',
    title: 'Zaffe & Grand Arrival',
    description: 'Choreograph the wedding car arrival with your zaffe: timed convoy entrances, honking cortège traditions, and the grand venue arrival done the Lebanese way.',
    from: 'The family home',
    to: 'Church & venue, with the zaffe',
    distance: 'Your cortège route',
    duration: 'Built around your zaffe schedule',
    image: '/images/areas/ornament.svg',
    priceRange: { min: 150, max: 500 },
    referenceVehicle: 'Bridal car + convoy cars',
    highlights: [
      'Car timing synced with the zaffe troupe — drums meet engines',
      'The honking cortège through the neighborhood, done proudly and safely',
      'Grand venue entrance staged for the videographer',
      'Convoy briefing so family cars keep formation',
      'Works with any zaffe group you book'
    ],
    faqs: [
      {
        question: 'Do you provide the zaffe troupe too?',
        answer: 'We stick to what we do best — the cars. But we coordinate directly with your zaffe group and planner so arrivals, drums, and doors all hit the same beat.'
      },
      {
        question: 'How does the honking cortège work without becoming chaos?',
        answer: 'We brief every driver in the convoy: order, spacing, speed, and where the honking celebration happens. It stays joyful and safe, and the neighborhood loves it.'
      },
      {
        question: 'Can you film-plan the arrival with our videographer?',
        answer: 'Yes — give us your videographer\'s contact and we agree on the approach angle, speed, and stopping mark for the money shot.'
      }
    ]
  }
}

export function getRouteBySlug(slug: string): Route | undefined {
  return routes[slug]
}

export function getAllRouteSlugs(): string[] {
  return Object.keys(routes)
}
