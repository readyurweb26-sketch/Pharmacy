// ============================================
//  MUKTI HEALTHCARE - MAIN JS (v2.2 - FIXED)
// ============================================
//
// Changelog from v2.1:
//  - FIX: delivery form read formData.get('medicine') but the input is
//         named "medicine_name" -> value was always null. Fixed.
//  - FIX: delivery form never read the prescription file input, so
//         prescription_url was always sent as ''. Now converts the
//         selected file to base64 and sends it as `prescription`,
//         which Code.gs already knows how to decode and store in Drive.
//  - FIX: fetchDoctors() had no retry; one flaky request meant an
//         empty doctors section with no recovery. Added retry + a
//         shared in-memory cache so home page and doctors page don't
//         both hit the API independently.
//  - NEW: doctor carousel renderer for the homepage (auto-scroll,
//         pause-on-hover, duplicated track for seamless loop).
//  - FIX: hamburger button now actually exists in the HTML; this file
//         just binds to it (see updated header markup in each page).
//  - NOTE: is_active filtering normalization lives in Code.gs now
//         (string "FALSE"/"TRUE" and real booleans both handled), so
//         no change needed here, but documented for clarity.
// ============================================

// ---------- CONFIG ----------
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwSNjzyC2q4pkkH9SxINjL0j9QOvscJ_ppINjPR3lp37WawZgm1xMVb9KCU2_1LuHUzUw/exec';

// ---------- TRANSLATIONS (i18n) ----------
const translations = {
  en: {
    nav_home: "Home",
    nav_about: "About",
    nav_services: "Services",
    nav_doctors: "Doctors",
    nav_contact: "Contact",
    nav_appointment: "Book Appointment",
    nav_delivery: "Medicine Delivery",
    hero_title: "Your Health, Our Priority",
    hero_sub: "Compassionate care with modern technology. Trusted by over 10,000 families.",
    hero_btn: "Make an Appointment",
    section_services: "Our Medical Services",
    section_doctors: "Meet Our Specialists",
    section_testimonials: "What Patients Say",
    doctor_reg: "Registration No.",
    doctor_qual: "Qualification",
    doctor_experience: "Experience",
    doctor_readmore: "Read More →",
    doctor_timing_title: "Available Timings",
    doctor_mon: "Mon",
    doctor_tue: "Tue",
    doctor_wed: "Wed",
    doctor_thu: "Thu",
    doctor_fri: "Fri",
    doctor_sat: "Sat",
    doctor_sun: "Sun",
    slot_morning: "Morning",
    slot_afternoon: "Afternoon",
    slot_evening: "Evening",
    form_name: "Full Name",
    form_phone: "Phone Number",
    form_email: "Email Address",
    form_message: "Your Message",
    form_department: "Select Department",
    form_date: "Preferred Date",
    form_submit: "Submit",
    delivery_title: "Medicine at Your Doorstep",
    delivery_sub: "Cash on Delivery Available • Kaliyaganj, 733129 • 8:00 AM - 10:00 PM",
    delivery_order: "Place Order →",
    delivery_medicine: "Medicine Name",
    delivery_qty: "Quantity",
    delivery_address: "Delivery Address",
    delivery_prescription: "Upload Prescription (Optional)",
    footer_about: "Providing quality healthcare with compassion and innovation.",
    footer_quick: "Quick Links",
    footer_contact: "Contact Info",
    footer_rights: "© 2026 Mukti Healthcare. Powered by ReadYurWeb",
    alert_success: "Success!",
    alert_appointment: "Appointment request received!",
    alert_contact: "Thank you for your message! We will get back to you soon.",
    alert_order: "Order placed successfully! Our team will reach out shortly.",
    alert_error: "Something went wrong. Please try again.",
    doctor_modal_title: "Doctor Details",
    doctor_modal_close: "Close",
    doctor_available: "Available",
    doctor_unavailable: "Unavailable",
    doctor_experience_years: "Years",
  },
  hi: {
    nav_home: "होम",
    nav_about: "हमारे बारे में",
    nav_services: "सेवाएं",
    nav_doctors: "डॉक्टर्स",
    nav_contact: "संपर्क करें",
    nav_appointment: "अपॉइंटमेंट बुक करें",
    nav_delivery: "मेडिसिन डिलीवरी",
    hero_title: "आपका स्वास्थ्य, हमारी प्राथमिकता",
    hero_sub: "आधुनिक तकनीक के साथ दयालु देखभाल। 10,000 से अधिक परिवारों द्वारा भरोसा किया गया।",
    hero_btn: "अपॉइंटमेंट लें",
    section_services: "हमारी चिकित्सा सेवाएं",
    section_doctors: "हमारे विशेषज्ञों से मिलें",
    section_testimonials: "मरीजों की राय",
    doctor_reg: "पंजीकरण संख्या",
    doctor_qual: "योग्यता",
    doctor_experience: "अनुभव",
    doctor_readmore: "और पढ़ें →",
    doctor_timing_title: "उपलब्ध समय",
    doctor_mon: "सोम",
    doctor_tue: "मंगल",
    doctor_wed: "बुध",
    doctor_thu: "गुरु",
    doctor_fri: "शुक्र",
    doctor_sat: "शनि",
    doctor_sun: "रवि",
    slot_morning: "सुबह",
    slot_afternoon: "दोपहर",
    slot_evening: "शाम",
    form_name: "पूरा नाम",
    form_phone: "फोन नंबर",
    form_email: "ईमेल पता",
    form_message: "आपका संदेश",
    form_department: "विभाग चुनें",
    form_date: "पसंदीदा तिथि",
    form_submit: "जमा करें",
    delivery_title: "दवा आपके दरवाजे पर",
    delivery_sub: "कैश ऑन डिलीवरी उपलब्ध • कालियागंज, 733129 • सुबह 8:00 - रात 10:00",
    delivery_order: "ऑर्डर करें →",
    delivery_medicine: "दवा का नाम",
    delivery_qty: "मात्रा",
    delivery_address: "डिलीवरी पता",
    delivery_prescription: "पर्ची अपलोड करें (वैकल्पिक)",
    footer_about: "करुणा और नवाचार के साथ गुणवत्तापूर्ण स्वास्थ्य सेवा प्रदान करना।",
    footer_quick: "त्वरित लिंक",
    footer_contact: "संपर्क जानकारी",
    footer_rights: "© 2026 मुक्ति हेल्थकेयर। ReadYurWeb द्वारा संचालित",
    alert_success: "सफलता!",
    alert_appointment: "अपॉइंटमेंट अनुरोध प्राप्त हुआ!",
    alert_contact: "आपके संदेश के लिए धन्यवाद! हम जल्द ही आपसे संपर्क करेंगे।",
    alert_order: "ऑर्डर सफलतापूर्वक प्लेस किया गया! हमारी टीम जल्द ही संपर्क करेगी।",
    alert_error: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
    doctor_modal_title: "डॉक्टर विवरण",
    doctor_modal_close: "बंद करें",
    doctor_available: "उपलब्ध",
    doctor_unavailable: "अनुपलब्ध",
    doctor_experience_years: "वर्ष",
  },
  bn: {
    nav_home: "হোম",
    nav_about: "আমাদের সম্পর্কে",
    nav_services: "সেবাসমূহ",
    nav_doctors: "ডাক্তার",
    nav_contact: "যোগাযোগ",
    nav_appointment: "অ্যাপয়েন্টমেন্ট বুক করুন",
    nav_delivery: "ওষুধ ডেলিভারি",
    hero_title: "আপনার স্বাস্থ্য, আমাদের অগ্রাধিকার",
    hero_sub: "আধুনিক প্রযুক্তির সাথে সহানুভূতিশীল যত্ন। ১০,০০০ এর বেশি পরিবার দ্বারা বিশ্বস্ত।",
    hero_btn: "অ্যাপয়েন্টমেন্ট নিন",
    section_services: "আমাদের চিকিৎসা সেবা",
    section_doctors: "আমাদের বিশেষজ্ঞদের সাথে দেখা করুন",
    section_testimonials: "রোগীদের মতামত",
    doctor_reg: "নিবন্ধন নম্বর",
    doctor_qual: "যোগ্যতা",
    doctor_experience: "অভিজ্ঞতা",
    doctor_readmore: "আরও পড়ুন →",
    doctor_timing_title: "উপলব্ধ সময়",
    doctor_mon: "সোম",
    doctor_tue: "মঙ্গল",
    doctor_wed: "বুধ",
    doctor_thu: "বৃহস্পতি",
    doctor_fri: "শুক্র",
    doctor_sat: "শনি",
    doctor_sun: "রবি",
    slot_morning: "সকাল",
    slot_afternoon: "দুপুর",
    slot_evening: "সন্ধ্যা",
    form_name: "পুরো নাম",
    form_phone: "ফোন নম্বর",
    form_email: "ইমেইল ঠিকানা",
    form_message: "আপনার বার্তা",
    form_department: "বিভাগ নির্বাচন করুন",
    form_date: "পছন্দের তারিখ",
    form_submit: "জমা দিন",
    delivery_title: "ওষুধ আপনার দরজায়",
    delivery_sub: "ক্যাশ অন ডেলিভারি উপলব্ধ • কালিয়াগঞ্জ, ৭৩৩১২৯ • সকাল ৮:০০ - রাত ১০:০০",
    delivery_order: "অর্ডার দিন →",
    delivery_medicine: "ওষুধের নাম",
    delivery_qty: "পরিমাণ",
    delivery_address: "ডেলিভারি ঠিকানা",
    delivery_prescription: "প্রেসক্রিপশন আপলোড করুন (ঐচ্ছিক)",
    footer_about: "সহানুভূতি এবং উদ্ভাবনের সাথে মানসম্মত স্বাস্থ্যসেবা প্রদান।",
    footer_quick: "দ্রুত লিঙ্ক",
    footer_contact: "যোগাযোগের তথ্য",
    footer_rights: "© ২০২৬ মুক্তি হেলথকেয়ার। ReadYurWeb দ্বারা পরিচালিত",
    alert_success: "সফল!",
    alert_appointment: "অ্যাপয়েন্টমেন্ট অনুরোধ গৃহীত হয়েছে!",
    alert_contact: "আপনার বার্তার জন্য ধন্যবাদ! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।",
    alert_order: "অর্ডার সফলভাবে প্লেস করা হয়েছে! আমাদের টিম শীঘ্রই যোগাযোগ করবে।",
    alert_error: "কিছু ভুল হয়েছে। আবার চেষ্টা করুন।",
    doctor_modal_title: "ডাক্তারের বিবরণ",
    doctor_modal_close: "বন্ধ করুন",
    doctor_available: "উপলব্ধ",
    doctor_unavailable: "অনুপলব্ধ",
    doctor_experience_years: "বছর",
  }
};

// ---------- LANGUAGE DROPDOWN ----------
let currentLang = localStorage.getItem('preferred_lang') || 'en';

function applyLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      // FIX: input/textarea/select don't show text via textContent — that
      // was dumping the translation INSIDE the field as if the user had
      // typed it. Form fields should get their `placeholder` attribute
      // updated instead; everything else (headings, buttons, labels)
      // keeps using textContent as before.
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        el.setAttribute('placeholder', translations[lang][key]);
      } else if (tag === 'OPTION' && el.value === '') {
        // "Select Department" type placeholder options
        el.textContent = translations[lang][key];
      } else {
        el.textContent = translations[lang][key];
      }
    }
  });
  localStorage.setItem('preferred_lang', lang);

  const langBtn = document.querySelector('.lang-dropdown-btn');
  if (langBtn) {
    const flag = '🇮🇳';
    langBtn.textContent = flag + ' ' + lang.toUpperCase();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const savedLang = localStorage.getItem('preferred_lang');
  const langBtn = document.querySelector('.lang-dropdown-btn');

  if (savedLang) {
    applyLanguage(savedLang);
  } else {
    applyLanguage('en');
    if (langBtn) {
      langBtn.textContent = '🌐 Language';
    }
  }

  document.querySelectorAll('.lang-option').forEach(option => {
    option.addEventListener('click', function(e) {
      e.stopPropagation();
      const lang = this.getAttribute('data-lang');
      applyLanguage(lang);
      const dropdown = document.querySelector('.lang-dropdown-content');
      if (dropdown) dropdown.classList.remove('show');
    });
  });

  const dropdownBtn = document.querySelector('.lang-dropdown-btn');
  const dropdownContent = document.querySelector('.lang-dropdown-content');
  if (dropdownBtn && dropdownContent) {
    dropdownBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdownContent.classList.toggle('show');
    });
    document.addEventListener('click', function() {
      dropdownContent.classList.remove('show');
    });
  }
});

// ---------- MOBILE MENU ----------
// FIX: previously bound to #hamburger before checking it existed in HTML.
// Each page now includes <button class="hamburger" id="hamburger" aria-label="Menu">☰</button>
// inside .nav-container. This binds the toggle and also closes the menu
// automatically when a nav link is tapped (common mobile UX expectation).
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      navMenu.classList.toggle('show');
    });
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navMenu.classList.remove('show'));
    });
  }
});

// ---------- DATE FIELD (dd-mm-yyyy display + native calendar picker) ----------
// #dateReal is a hidden <input type="date">; the browser's native picker
// always opens from it (so we keep the familiar calendar UI), but its
// own displayed format depends on browser/OS locale, which we don't
// want to show. Instead, #dateDisplay is a plain read-only text input
// that always shows dd-mm-yyyy, kept in sync with #dateReal here.
// #dateReal's value (the real ISO yyyy-mm-dd string) is what actually
// gets submitted via formData.get('date'), since it carries name="date".
document.addEventListener('DOMContentLoaded', function() {
  const dateReal = document.getElementById('dateReal');
  const dateDisplay = document.getElementById('dateDisplay');
  if (!dateReal || !dateDisplay) return;

  function syncDisplay() {
    if (!dateReal.value) {
      dateDisplay.value = '';
      return;
    }
    // dateReal.value is always ISO format: yyyy-mm-dd
    const [y, m, d] = dateReal.value.split('-');
    dateDisplay.value = `${d}-${m}-${y}`;
  }

  dateReal.addEventListener('change', syncDisplay);
  dateReal.addEventListener('input', syncDisplay);

  // Clicking/focusing the visible text field should open the native
  // picker on the hidden field underneath (it's positioned exactly on
  // top via CSS, so a plain click already reaches it on most browsers —
  // this is a fallback for browsers where focus doesn't bubble through).
  dateDisplay.addEventListener('click', () => {
    if (typeof dateReal.showPicker === 'function') {
      try { dateReal.showPicker(); } catch (err) { /* unsupported, ignore */ }
    } else {
      dateReal.focus();
    }
  });

  // Reset support: when the form is reset, clear the display too.
  const form = dateReal.closest('form');
  if (form) {
    form.addEventListener('reset', () => {
      setTimeout(syncDisplay, 0);
    });
  }
});

// ---------- TESTIMONIAL SLIDER ----------
const testimonials = document.querySelectorAll('.testimonial');
const prevBtn = document.getElementById('prevTestimonial');
const nextBtn = document.getElementById('nextTestimonial');
let currentTestimonial = 0;

function showTestimonial(index) {
  testimonials.forEach((t, i) => {
    t.classList.toggle('active', i === index);
  });
}

if (testimonials.length > 0) {
  showTestimonial(0);
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', function() {
      currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
      showTestimonial(currentTestimonial);
    });
    nextBtn.addEventListener('click', function() {
      currentTestimonial = (currentTestimonial + 1) % testimonials.length;
      showTestimonial(currentTestimonial);
    });
    setInterval(() => {
      currentTestimonial = (currentTestimonial + 1) % testimonials.length;
      showTestimonial(currentTestimonial);
    }, 5000);
  }
}

// ---------- FETCH DOCTORS ----------
// FIX: added retry (3 attempts, 1s backoff) and a shared in-flight/cached
// promise so the home page grid and the full doctors page never issue two
// independent network requests when both happen to be on the DOM (and so
// a single page calling fetchDoctors() twice doesn't double-fetch either).
let _doctorsPromise = null;

async function _fetchDoctorsAttempt(retries) {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching doctors:', error);
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return _fetchDoctorsAttempt(retries - 1);
    }
    return [];
  }
}

function fetchDoctors() {
  if (!_doctorsPromise) {
    _doctorsPromise = _fetchDoctorsAttempt(3);
  }
  return _doctorsPromise;
}

// ---------- SHARED HELPERS ----------
function getTodayTimingPillsHtml(doc) {
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayNames[new Date().getDay()];
  const morning = doc[`${todayKey}_morning`] || '';
  const afternoon = doc[`${todayKey}_afternoon`] || '';
  const evening = doc[`${todayKey}_evening`] || '';
  let pillsHtml = '';
  if (morning && morning.toLowerCase() !== 'closed') {
    pillsHtml += `<span class="timing-pill today" data-i18n="slot_morning">Morning</span>`;
  }
  if (afternoon && afternoon.toLowerCase() !== 'closed') {
    pillsHtml += `<span class="timing-pill today" data-i18n="slot_afternoon">Afternoon</span>`;
  }
  if (evening && evening.toLowerCase() !== 'closed') {
    pillsHtml += `<span class="timing-pill today" data-i18n="slot_evening">Evening</span>`;
  }
  if (!pillsHtml) {
    pillsHtml = `<span class="timing-pill closed" data-i18n="alert_error">Closed Today</span>`;
  }
  return pillsHtml;
}

// Detects a normal Google Drive SHARE link (the one you get from
// Drive's "Share" button, e.g.
// https://drive.google.com/file/d/FILE_ID/view?usp=sharing) and
// converts it into a direct-image URL that actually renders inside an
// <img> tag. A raw Drive share link is an HTML viewer page, not an
// image file, so without this conversion the browser shows a broken
// image icon. Anything that isn't a recognized Drive share link is
// returned unchanged (so plain image URLs, ui-avatars.com fallbacks,
// etc. keep working exactly as before).
function convertDriveLinkToDirectUrl(url) {
  if (!url) return url;
  // Matches both /file/d/FILE_ID/... and open?id=FILE_ID style links.
  const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (!match) return url; // not a Drive link — leave untouched
  const fileId = match[1];
  // lh3.googleusercontent.com is what Drive/Photos use internally to
  // serve images directly; it renders reliably as an <img> src and
  // also accepts a size suffix (here =w800 caps width, keeping
  // payload small since the CSS will crop/cover it anyway).
  return `https://lh3.googleusercontent.com/d/${fileId}=w800`;
}

function fallbackAvatarUrl(doc) {
  return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doc.name) + '&background=1A4D3E&color=fff&size=200';
}

function doctorAvatarUrl(doc) {
  const rawUrl = doc.image_url;
  if (!rawUrl) {
    return fallbackAvatarUrl(doc);
  }
  return convertDriveLinkToDirectUrl(rawUrl);
}

// ---------- RENDER DOCTORS (Full Page) ----------
const doctorsGrid = document.getElementById('doctorsGrid');
if (doctorsGrid) {
  fetchDoctors().then(doctors => {
    if (doctors.length === 0) {
      doctorsGrid.innerHTML = `<p data-i18n="alert_error" style="text-align:center; width:100%; padding:40px;">No doctors found. Please check back later.</p>`;
      return;
    }
    const experienceDefault = '5+ Years';

    doctors.forEach(doc => {
      const card = document.createElement('div');
      card.className = 'doctor-card';
      card.setAttribute('data-aos', 'zoom-in');

      const pillsHtml = getTodayTimingPillsHtml(doc);
      const experience = doc.experience || experienceDefault;

      card.innerHTML = `
        <img src="${doctorAvatarUrl(doc)}" alt="${doc.name}" onerror="this.onerror=null; this.src='${fallbackAvatarUrl(doc)}';">
        <div class="info">
          <h4>${doc.name}</h4>
          <p class="speciality">${doc.speciality}</p>
          <p class="reg-qual"><strong data-i18n="doctor_reg">Registration No.</strong> ${doc.reg_no}</p>
          <p class="reg-qual"><strong data-i18n="doctor_experience">Experience</strong> ${experience}</p>
          <div class="timing-pills">${pillsHtml}</div>
          <a href="#" class="read-more" data-id="${doc.id}" data-i18n="doctor_readmore">Read More →</a>
        </div>
      `;
      doctorsGrid.appendChild(card);

      card.addEventListener('click', function(e) {
        if (e.target.classList.contains('read-more')) return;
        const id = this.querySelector('.read-more').getAttribute('data-id');
        openDoctorModal(id);
      });

      card.querySelector('.read-more').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = this.getAttribute('data-id');
        openDoctorModal(id);
      });
    });
  });
}

// ---------- RENDER DOCTORS (Homepage Carousel) ----------
// NEW: replaces the old static 4-card grid with an auto-scrolling,
// pause-on-hover carousel. The track is rendered twice back-to-back so
// the loop from -50% back to 0% is seamless (classic infinite-marquee
// trick). Cards are clickable and open the same detail modal used on
// the full doctors page.
const homeDoctorsCarousel = document.getElementById('homeDoctorsCarousel');
if (homeDoctorsCarousel) {
  fetchDoctors().then(doctors => {
    if (!doctors || doctors.length === 0) {
      homeDoctorsCarousel.innerHTML = `<p data-i18n="alert_error" style="text-align:center; width:100%; padding:20px;">No doctors available.</p>`;
      return;
    }

    function buildCard(doc) {
      const card = document.createElement('div');
      card.className = 'doctor-card';
      card.innerHTML = `
        <img src="${doctorAvatarUrl(doc)}" alt="${doc.name}" onerror="this.onerror=null; this.src='${fallbackAvatarUrl(doc)}';">
        <div class="info">
          <h4>${doc.name}</h4>
          <p class="speciality">${doc.speciality}</p>
        </div>
      `;
      card.addEventListener('click', () => openDoctorModal(doc.id));
      return card;
    }

    const track = document.createElement('div');
    track.className = 'doctor-carousel-track';

    // Duplicate the list so the marquee can loop seamlessly at -50%.
    // If there are very few doctors, duplicate further so the track is
    // wide enough to scroll smoothly instead of jumping.
    let renderList = doctors.slice();
    while (renderList.length < 6) {
      renderList = renderList.concat(doctors);
    }
    const fullList = renderList.concat(renderList);
    fullList.forEach(doc => track.appendChild(buildCard(doc)));

    homeDoctorsCarousel.innerHTML = '';
    homeDoctorsCarousel.appendChild(track);
  });
}

// ---------- DOCTOR DETAIL MODAL (Full Details) ----------
const doctorModal = document.createElement('div');
doctorModal.className = 'modal-overlay';
doctorModal.id = 'doctorModal';
doctorModal.innerHTML = `
  <div class="modal-content" style="max-width:700px;">
    <span class="modal-close" id="doctorModalClose">&times;</span>
    <div id="doctorModalBody">
      <!-- Populated dynamically -->
    </div>
  </div>
`;
document.body.appendChild(doctorModal);

function openDoctorModal(doctorId) {
  fetchDoctors().then(doctors => {
    const doc = doctors.find(d => String(d.id) === String(doctorId));
    if (!doc) {
      alert('Doctor not found');
      return;
    }

    const dayKeys = ['mon','tue','wed','thu','fri','sat','sun'];
    const slotNames = ['morning','afternoon','evening'];
    const dayNamesDisplay = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

    let timingHtml = `<table class="timing-table"><thead><tr><th>Day</th><th>Morning</th><th>Afternoon</th><th>Evening</th></tr></thead><tbody>`;
    dayKeys.forEach((day, idx) => {
      timingHtml += `<tr><td><strong>${dayNamesDisplay[idx]}</strong></td>`;
      slotNames.forEach(slot => {
        const val = doc[`${day}_${slot}`] || '—';
        const isAvailable = val && val.toLowerCase() !== 'closed' && val !== '—';
        timingHtml += `<td class="${isAvailable ? 'slot-available' : 'slot-unavailable'}">${isAvailable ? val : '✕'}</td>`;
      });
      timingHtml += `</tr>`;
    });
    timingHtml += `</tbody></table>`;

    const experience = doc.experience || '5+ Years';

    const body = document.getElementById('doctorModalBody');
    body.innerHTML = `
      <div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom:20px;">
        <img src="${doctorAvatarUrl(doc)}" alt="${doc.name}" style="width:150px; height:150px; border-radius:50%; object-fit:cover; border:4px solid var(--accent);" onerror="this.onerror=null; this.src='${fallbackAvatarUrl(doc)}';">
        <div>
          <h3 style="color:var(--primary-dark);">${doc.name}</h3>
          <p style="color:var(--text-muted); font-size:1.1rem;">${doc.speciality}</p>
          <p><strong data-i18n="doctor_reg">Registration No.</strong> ${doc.reg_no}</p>
          <p><strong data-i18n="doctor_qual">Qualification</strong> ${doc.qualification}</p>
          <p><strong data-i18n="doctor_experience">Experience</strong> ${experience}</p>
        </div>
      </div>
      <h4 data-i18n="doctor_timing_title" style="color:var(--primary-dark); margin:20px 0 10px;">Available Timings</h4>
      ${timingHtml}
      <div style="margin-top:20px; text-align:center;">
        <a href="appointment.html" class="btn-primary" data-i18n="nav_appointment">Book Appointment</a>
      </div>
    `;

    doctorModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}

document.getElementById('doctorModalClose').addEventListener('click', function() {
  doctorModal.classList.remove('active');
  document.body.style.overflow = '';
});
doctorModal.addEventListener('click', function(e) {
  if (e.target === this) {
    this.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ---------- FORM HANDLERS ----------
// FIX (critical, prescription bug): this previously always sent
// application/x-www-form-urlencoded bodies via URLSearchParams. That's
// fine for short fields (name, phone, address), but the `prescription`
// field is a base64 data URL that can run to hundreds of KB or more.
// Apps Script's e.parameter does not reliably carry very long
// URL-encoded values — short fields arrived intact while `prescription`
// silently vanished, which is exactly why orders saved successfully but
// the file never reached Drive and no error ever appeared in logs (the
// "if (data.prescription)" check in Code.gs was simply false).
//
// Fix: send a real JSON body instead. Code.gs's doPost() already tries
// JSON.parse(e.postData.contents) first and only falls back to
// e.parameter if that fails — so switching to JSON here exercises the
// path it actually expects for anything with a file attached, and JSON
// has no practical length limit the way querystring-style parsing does.
async function postFormData(type, data) {
  try {
    const response = await fetch(API_BASE_URL + `?type=${type}`, {
      method: 'POST',
      // NOTE: deliberately "text/plain", not "application/json". Apps
      // Script web apps don't handle CORS preflight (OPTIONS) requests,
      // and "application/json" is not a CORS-safelisted content type —
      // browsers would send a preflight first and it would fail. "text/
      // plain" IS safelisted, so the browser sends this as a simple
      // request with no preflight, while the body is still valid JSON
      // text. Code.gs reads e.postData.contents and JSON.parse()s it
      // regardless of the declared content type, so this works cleanly
      // on both ends.
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error posting form:', error);
    return { success: false, message: error.message };
  }
}

// Reads a File object and resolves with a data URL string
// ("data:<mime>;base64,<data>"), which is exactly the format Code.gs's
// doPost() already expects for data.prescription.
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Appointment form
const apptForm = document.getElementById('appointmentForm');
if (apptForm) {
  apptForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '...'; }

    const formData = new FormData(this);
    const data = {
      patient_name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      department: formData.get('department'),
      preferred_date: formData.get('date'),
      message: formData.get('message') || ''
    };
    const result = await postFormData('appointments', data);
    if (result.success) {
      alert(translations[currentLang].alert_appointment);
      this.reset();
    } else {
      alert(translations[currentLang].alert_error);
    }
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalBtnText; }
  });
}

// Contact form
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '...'; }

    const formData = new FormData(this);
    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      message: formData.get('message')
    };
    const result = await postFormData('contacts', data);
    if (result.success) {
      alert(translations[currentLang].alert_contact);
      this.reset();
    } else {
      alert(translations[currentLang].alert_error);
    }
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalBtnText; }
  });
}

// Delivery form
// FIX (critical): previously read formData.get('medicine') against an
// input named "medicine_name" (always null), and never read the file
// input at all, so prescription_url was always sent empty even when a
// file was attached. Both are fixed below; the field name now matches
// the HTML exactly, and the file (if present) is base64-encoded and
// sent as `prescription`, which Code.gs already decodes and uploads to
// Drive in the MuktiPrescriptions folder.
const deliveryForm = document.getElementById('deliveryForm');
if (deliveryForm) {
  deliveryForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '...'; }

    const formData = new FormData(this);
    const data = {
      patient_name: formData.get('patient_name'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      medicine_name: formData.get('medicine_name'),
      quantity: formData.get('quantity')
    };

    const fileInput = this.querySelector('input[name="prescription"]');
    const file = fileInput && fileInput.files && fileInput.files[0];
    if (file) {
      try {
        data.prescription = await readFileAsDataUrl(file);
      } catch (err) {
        console.error('Could not read prescription file:', err);
        // Continue without the file rather than blocking the whole order.
      }
    }

    const result = await postFormData('medicineOrders', data);
    if (result.success) {
      alert(translations[currentLang].alert_order);
      this.reset();
    } else {
      alert(translations[currentLang].alert_error);
    }
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalBtnText; }
  });
}

// ---------- SMOOTH SCROLL ----------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ---------- AOS INIT ----------
if (typeof AOS !== 'undefined') {
  AOS.init({
    duration: 1000,
    once: true,
    offset: 120
  });
}