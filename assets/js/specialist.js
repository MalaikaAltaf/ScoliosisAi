/* =============================================
   SPECIALIST JS — hospital cards, checker, checklist
   ============================================= */

// Hospital data
const hospitals = [
  {
    name: "Shifa International Hospital",
    city: "islamabad",
    cityLabel: "Islamabad",
    address: "H-8/4, Islamabad, Pakistan",
    specialty: "Spine Surgery & Orthopedics",
    phone: "+92-51-846-0000",
    directions: "https://maps.google.com/?q=Shifa+International+Hospital+Islamabad"
  },
  {
    name: "PIMS — Pakistan Institute of Medical Sciences",
    city: "islamabad",
    cityLabel: "Islamabad",
    address: "G-8/3, Islamabad, Pakistan",
    specialty: "Orthopedic Surgery",
    phone: "+92-51-926-1170",
    directions: "https://maps.google.com/?q=PIMS+Islamabad"
  },
  {
    name: "CMH Rawalpindi",
    city: "rawalpindi",
    cityLabel: "Rawalpindi",
    address: "The Mall, Rawalpindi Cantonment, Pakistan",
    specialty: "Military Orthopedics & Spine",
    phone: "+92-51-561-7000",
    directions: "https://maps.google.com/?q=CMH+Rawalpindi"
  },
  {
    name: "Benazir Bhutto Hospital",
    city: "rawalpindi",
    cityLabel: "Rawalpindi",
    address: "Murree Road, Rawalpindi, Pakistan",
    specialty: "Orthopedic Department",
    phone: "+92-51-926-5780",
    directions: "https://maps.google.com/?q=Benazir+Bhutto+Hospital+Rawalpindi"
  },
  {
    name: "Mayo Hospital Lahore",
    city: "lahore",
    cityLabel: "Lahore",
    address: "Nila Gumbad, Lahore, Pakistan",
    specialty: "Spine & Orthopedic Surgery",
    phone: "+92-42-9921-1050",
    directions: "https://maps.google.com/?q=Mayo+Hospital+Lahore"
  },
  {
    name: "Shaukat Khanum Memorial Hospital",
    city: "lahore",
    cityLabel: "Lahore",
    address: "7-A, Block R-3, M.A. Johar Town, Lahore",
    specialty: "Oncology & Bone Surgery",
    phone: "+92-42-3590-5000",
    directions: "https://maps.google.com/?q=Shaukat+Khanum+Hospital+Lahore"
  },
  {
    name: "Aga Khan University Hospital",
    city: "karachi",
    cityLabel: "Karachi",
    address: "Stadium Road, Karachi, Pakistan",
    specialty: "Spine Surgery & Neurosurgery",
    phone: "+92-21-3486-1000",
    directions: "https://maps.google.com/?q=Aga+Khan+University+Hospital+Karachi"
  },
  {
    name: "Liaquat National Hospital",
    city: "karachi",
    cityLabel: "Karachi",
    address: "Stadium Road, Karachi, Pakistan",
    specialty: "Orthopedic & Spine Care",
    phone: "+92-21-3412-7700",
    directions: "https://maps.google.com/?q=Liaquat+National+Hospital+Karachi"
  }
];

// Hospital icon SVG
function hospitalIcon() {
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 21V8l9-5 9 5v13H3z" stroke="#14B8A6" stroke-width="1.4" stroke-linejoin="round" fill="rgba(20,184,166,0.08)"/>
    <rect x="9" y="13" width="6" height="8" rx="1" stroke="#14B8A6" stroke-width="1.3"/>
    <path d="M12 7v4M10 9h4" stroke="#14B8A6" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`;
}

function cityBadgeColor(city) {
  const map = { islamabad:'badge-accent', rawalpindi:'badge-blue', lahore:'badge-warn', karachi:'badge-danger' };
  return map[city] || 'badge-muted';
}

function renderHospitals(filter) {
  const grid = document.getElementById('hospitalGrid');
  const filtered = filter === 'all' ? hospitals : hospitals.filter(h => h.city === filter);
  grid.innerHTML = filtered.map(h => `
    <div class="hosp-card" data-city="${h.city}">
      <div class="hosp-card-top">
        <div class="hosp-icon">${hospitalIcon()}</div>
        <div>
          <div class="hosp-name">${h.name}</div>
          <span class="badge ${cityBadgeColor(h.city)} hosp-city">${h.cityLabel}</span>
        </div>
      </div>
      <div class="hosp-info">
        <div class="hosp-row">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5C4.5 1.5 2.5 3.5 2.5 6c0 3.5 4.5 7 4.5 7s4.5-3.5 4.5-7c0-2.5-2-4.5-4.5-4.5z" stroke="#64748B" stroke-width="1.2"/><circle cx="7" cy="6" r="1.5" stroke="#64748B" stroke-width="1.2"/></svg>
          <span>${h.address}</span>
        </div>
        <div class="hosp-row">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2h2.5l1 3-1.5 1A7.5 7.5 0 009.5 9.5l1-1.5 3 1V11a1 1 0 01-1 1C5 12 2 9 2 3a1 1 0 011-1z" stroke="#64748B" stroke-width="1.2" stroke-linejoin="round"/></svg>
          <span>${h.phone}</span>
        </div>
        <div class="hosp-row">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2a5 5 0 100 10A5 5 0 007 2z" stroke="#3B82F6" stroke-width="1.2"/><path d="M7 4v3l2 1" stroke="#3B82F6" stroke-width="1.2" stroke-linecap="round"/></svg>
          <span class="hosp-specialty">${h.specialty}</span>
        </div>
      </div>
      <div class="hosp-actions">
        <a href="${h.directions}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5C4.5 1.5 2.5 3.5 2.5 6c0 3.5 4.5 7 4.5 7s4.5-3.5 4.5-7c0-2.5-2-4.5-4.5-4.5z" stroke="currentColor" stroke-width="1.2"/><circle cx="7" cy="6" r="1.5" stroke="currentColor" stroke-width="1.2"/></svg>
          Get Directions
        </a>
        <a href="tel:${h.phone}" class="btn btn-primary btn-sm">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2h2.5l1 3L5 6.5A7.5 7.5 0 009.5 11l1.5-1.5 3 1V13a1 1 0 01-1 1C4 14 0 10 0 3a1 1 0 011-1z" stroke="white" stroke-width="1.2" stroke-linejoin="round"/></svg>
          Call Now
        </a>
      </div>
    </div>
  `).join('');
}

// Init grid
renderHospitals('all');

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderHospitals(btn.dataset.city);
  });
});

// Cobb checker
document.getElementById('checkBtn').addEventListener('click', () => {
  const val = parseFloat(document.getElementById('cobbInput').value);
  const resultDiv = document.getElementById('checkerResult');
  const recCard   = document.getElementById('recCard');
  if (isNaN(val) || val < 0) { alert('Please enter a valid Cobb angle.'); return; }

  let cls, level, title, desc, action;
  if (val < 10) {
    cls='normal'; level='Normal'; title='No Scoliosis Detected';
    desc='Your Cobb angle is within the normal range. No scoliosis is indicated. Continue with routine health check-ups.';
    action='✓ No specialist referral needed at this stage.';
  } else if (val < 25) {
    cls='mild'; level='Mild'; title='General Orthopedic Consultation';
    desc='Mild scoliosis. A general orthopedic physician can monitor the curve progression with periodic X-rays every 4–6 months.';
    action='→ See a General Orthopedic Physician.';
  } else if (val < 40) {
    cls='moderate'; level='Moderate'; title='Spine Specialist + Physiotherapist';
    desc='Moderate scoliosis requiring active management. A spine specialist will evaluate bracing options. Physiotherapy (Schroth Method) is strongly recommended.';
    action='→ See a Spine Specialist & Physiotherapist.';
  } else {
    cls='severe'; level='Severe'; title='Orthopedic Surgeon — Urgent';
    desc='Severe scoliosis. Surgical evaluation is recommended. Consult an orthopedic surgeon experienced in spinal fusion procedures as soon as possible.';
    action='→ See an Orthopedic Surgeon urgently.';
  }

  recCard.className = `rec-card ${cls}`;
  recCard.innerHTML = `
    <div class="rec-level">${level} Scoliosis</div>
    <div class="rec-title">${title}</div>
    <div class="rec-desc">${desc}</div>
    <div class="rec-action">${action}</div>
  `;
  resultDiv.style.display = 'block';
});

// Checklist progress
const checkboxes = document.querySelectorAll('.checklist input[type="checkbox"]');
function updateProgress() {
  const done = Array.from(checkboxes).filter(c => c.checked).length;
  const pct  = Math.round((done / checkboxes.length) * 100);
  document.getElementById('aptProgFill').style.width  = pct + '%';
  document.getElementById('aptProgLabel').textContent = `${done} / ${checkboxes.length} completed`;
  checkboxes.forEach(c => {
    c.closest('.check-item').classList.toggle('checked', c.checked);
  });
}
checkboxes.forEach(c => c.addEventListener('change', updateProgress));

// Download checklist
document.getElementById('downloadChecklist').addEventListener('click', () => {
  const items = Array.from(checkboxes).map(c => {
    const label = c.closest('.check-item').querySelector('span').textContent;
    return `<li style="padding:6px 0;border-bottom:1px solid #e2e8f0;">${c.checked ? '✅' : '☐'} ${label}</li>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <title>Appointment Checklist — Scoliosis Detection</title>
  <style>body{font-family:'Segoe UI',sans-serif;max-width:600px;margin:40px auto;padding:0 24px;color:#0F172A;}
  h1{color:#14B8A6;font-size:1.5rem;}ul{padding:0;list-style:none;}
  .footer{margin-top:2rem;font-size:0.8rem;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:1rem;}</style>
  </head><body>
  <h1>Appointment Preparation Checklist</h1>
  <p style="color:#64748B;font-size:0.9rem;">Generated by Scoliosis Detection System — ${new Date().toDateString()}</p>
  <ul>${items}</ul>
  <div class="footer">Scoliosis Detection — AI Research Prototype · Always consult a qualified medical professional.</div>
  </body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'appointment-checklist.html'; a.click();
  URL.revokeObjectURL(url);
});
