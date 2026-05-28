/* =============================================
   DASHBOARD JS — upload, analysis, gauge, report
   ============================================= */

const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadZone = document.getElementById('uploadZone');
const uploadPreview = document.getElementById('uploadPreview');
const previewImg = document.getElementById('previewImg');
const removePreview = document.getElementById('removePreview');
const uploadActions = document.getElementById('uploadActions');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingSection = document.getElementById('loadingSection');
const uploadSection = document.getElementById('upload');
const resultsSection = document.getElementById('resultsSection');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const compOriginal = document.getElementById('compOriginal');

let uploadedFile = null;
let predictionResult = null; // Store API response

// --- Browse ---
browseBtn.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('click', (e) => {
  if (e.target === uploadZone || e.target.classList.contains('upload-icon-wrap') ||
    e.target.tagName === 'svg' || e.target.tagName === 'path' || e.target.tagName === 'circle') {
    fileInput.click();
  }
});

// --- Drag & Drop ---
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFile(file);
});

// --- File Input ---
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

function handleFile(file) {
  uploadedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    uploadPreview.style.display = 'block';
    uploadActions.style.display = 'flex';
    // update comparison panel
    if (compOriginal) {
      compOriginal.innerHTML = `<img src="${e.target.result}" alt="Uploaded X-Ray" style="width:100%;height:100%;object-fit:cover;"/>`;
    }
  };
  reader.readAsDataURL(file);
}

// --- Remove preview ---
removePreview.addEventListener('click', () => {
  uploadedFile = null;
  previewImg.src = '';
  uploadPreview.style.display = 'none';
  uploadActions.style.display = 'none';
  fileInput.value = '';
});

// --- Analyze ---
analyzeBtn.addEventListener('click', async () => {
  if (!uploadedFile) {
    alert('Please select an image first');
    return;
  }

  uploadSection.style.display = 'none';
  loadingSection.style.display = 'block';
  await analyzeImage();
});

async function analyzeImage() {
  const steps = ['ls1', 'ls2', 'ls3', 'ls4'];
  let stepIndex = 0;

  try {
    // Mark step 1 as active
    document.getElementById(steps[0])?.classList.add('active');

    // Step 1: Preprocessing (1.5s simulation)
    await new Promise(resolve => setTimeout(resolve, 1500));
    document.getElementById(steps[0])?.classList.remove('active');
    document.getElementById(steps[0])?.classList.add('done');

    // Step 2: Model screening (2s simulation)
    document.getElementById(steps[1])?.classList.add('active');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Actual API call (real time)
    document.getElementById(steps[1])?.classList.remove('active');
    document.getElementById(steps[1])?.classList.add('done');
    document.getElementById(steps[2])?.classList.add('active');

    // Call backend API
    predictionResult = await window.spineAIClient.predict(uploadedFile);
    console.log('Prediction result:', predictionResult);

    document.getElementById(steps[2])?.classList.remove('active');
    document.getElementById(steps[2])?.classList.add('done');

    // Step 4: Report generation (1s simulation)
    document.getElementById(steps[3])?.classList.add('active');
    await new Promise(resolve => setTimeout(resolve, 1000));
    document.getElementById(steps[3])?.classList.remove('active');
    document.getElementById(steps[3])?.classList.add('done');

    // Show results
    setTimeout(showResults, 500);
  } catch (error) {
    console.error('Analysis error:', error);
    document.getElementById(steps[stepIndex])?.classList.remove('active');

    loadingSection.style.display = 'none';
    uploadSection.style.display = 'block';

    alert(`Analysis failed: ${error.message}`);

    // Reset loading steps
    steps.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active', 'done');
    });
    document.getElementById('ls1')?.classList.add('active');
  }
}

function showResults() {
  loadingSection.style.display = 'none';
  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Update dynamic values first
  updateUIResults();

  // Re-trigger fade-ins
  setTimeout(() => {
    resultsSection.querySelectorAll('.fade-in').forEach(el => {
      el.classList.remove('visible');
      setTimeout(() => el.classList.add('visible'), 50);
    });
  }, 100);

  // Draw gauge
  setTimeout(drawGauge, 300);
}

function updateUIResults() {
  if (!predictionResult) return;
  const { pt_angle, mt_angle, tl_angle, severity } = predictionResult;

  const updateCard = (idPrefix, val) => {
    document.getElementById(`val${idPrefix}`).innerText = val.toFixed(1);
    const bar = document.getElementById(`bar${idPrefix}`);
    const badge = document.getElementById(`badge${idPrefix}`);
    
    // Set bar width (max 90 deg)
    const pct = Math.min((val / 90) * 100, 100);
    bar.style.setProperty('--pct', `${pct}%`);
    
    if (val < 25) {
      bar.style.setProperty('--color', '#10B981');
      badge.className = 'badge badge-success';
      badge.innerText = 'Normal';
    } else if (val < 40) {
      bar.style.setProperty('--color', '#F59E0B');
      badge.className = 'badge badge-warn';
      badge.innerText = 'Mild';
    } else if (val < 50) {
      bar.style.setProperty('--color', '#F97316');
      badge.className = 'badge badge-warn'; // or create badge-moderate
      badge.innerText = 'Moderate';
    } else {
      bar.style.setProperty('--color', '#EF4444');
      badge.className = 'badge badge-error'; // or create badge-severe
      badge.innerText = 'Severe';
    }
  };

  updateCard('PT', pt_angle);
  updateCard('MT', mt_angle);
  updateCard('TL', tl_angle);

  // Update Gauge Labels
  document.getElementById('gaugeVal').innerText = `${mt_angle.toFixed(1)}°`;
  const severityFormatted = severity.charAt(0).toUpperCase() + severity.slice(1);
  document.getElementById('gaugeDesc').innerText = `${severityFormatted} Scoliosis`;

  // Update Assessment Badge
  const badgeColors = {
    normal: 'badge-success',
    mild: 'badge-warn',
    moderate: 'badge-warn', // mapped to warn if moderate class is missing
    severe: 'badge-error'
  };
  const badgeClass = badgeColors[severity] || 'badge-warn';
  document.getElementById('assessmentBadgeContainer').innerHTML = 
    `<span class="badge ${badgeClass}" id="assessmentBadge" style="font-size:0.95rem;padding:6px 16px;">${severityFormatted} Scoliosis Detected</span>`;

  // Update Assessment List
  let assessmentListHTML = '';
  if (pt_angle < 25) {
    assessmentListHTML += `<li><span class="al-dot" style="background:#10B981"></span>PT angle within normal range</li>`;
  } else {
    assessmentListHTML += `<li><span class="al-dot" style="background:#F59E0B"></span>PT angle is elevated</li>`;
  }

  if (mt_angle < 25) {
    assessmentListHTML += `<li><span class="al-dot" style="background:#10B981"></span>MT angle within normal range</li>`;
  } else if (mt_angle < 40) {
    assessmentListHTML += `<li><span class="al-dot" style="background:#F59E0B"></span>MT angle indicates mild curve — monitoring recommended</li>`;
  } else if (mt_angle < 50) {
    assessmentListHTML += `<li><span class="al-dot" style="background:#F97316"></span>MT angle indicates moderate curve — specialist evaluation advised</li>`;
  } else {
    assessmentListHTML += `<li><span class="al-dot" style="background:#EF4444"></span>MT angle indicates severe curve — immediate attention needed</li>`;
  }

  if (tl_angle < 25) {
    assessmentListHTML += `<li><span class="al-dot" style="background:#10B981"></span>TL angle within acceptable range</li>`;
  } else {
    assessmentListHTML += `<li><span class="al-dot" style="background:#F59E0B"></span>TL angle requires attention</li>`;
  }
  
  assessmentListHTML += `<li><span class="al-dot" style="background:#3B82F6"></span>Regular orthopedic follow-up suggested</li>`;
  document.getElementById('assessmentList').innerHTML = assessmentListHTML;
}

// --- Gauge ---
function drawGauge() {
  const canvas = document.getElementById('gaugeCanvas');
  if (!canvas || !predictionResult) return;

  const ctx = canvas.getContext('2d');
  const cx = 140, cy = 140, r = 100;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;

  // Use actual MT angle from prediction, max out at 90 degrees
  const mtAngle = Math.min(predictionResult.mt_angle, 90);
  const targetAngle = mtAngle / 90; // Normalize to 0-1

  // Severity-based segments
  const segments = [
    { color: '#10B981', from: 0, to: 0.25 },    // Normal (0-22.5°)
    { color: '#F59E0B', from: 0.25, to: 0.5 },    // Mild (22.5-45°)
    { color: '#F97316', from: 0.5, to: 0.75 },    // Moderate (45-67.5°)
    { color: '#EF4444', from: 0.75, to: 1 },    // Severe (67.5-90°)
  ];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw segments
  segments.forEach(seg => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle + seg.from * Math.PI, startAngle + seg.to * Math.PI);
    ctx.lineWidth = 22;
    ctx.strokeStyle = seg.color;
    ctx.lineCap = 'butt';
    ctx.stroke();
  });

  // Background track
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.lineWidth = 22;
  ctx.strokeStyle = 'rgba(0,0,0,0.04)';
  ctx.stroke();

  // Needle animation
  let current = 0;

  function animateNeedle() {
    current += 0.018;
    if (current > targetAngle) current = targetAngle;
    const angle = startAngle + current * Math.PI;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw arcs
    segments.forEach(seg => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle + seg.from * Math.PI, startAngle + seg.to * Math.PI);
      ctx.lineWidth = 22;
      ctx.strokeStyle = seg.color;
      ctx.lineCap = 'butt';
      ctx.stroke();
    });

    // Needle
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (r - 14) * Math.cos(angle), cy + (r - 14) * Math.sin(angle));
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0F172A';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#0F172A';
    ctx.fill();

    if (current < targetAngle) requestAnimationFrame(animateNeedle);
  }

  animateNeedle();
}

// --- Reset ---
resetBtn.addEventListener('click', () => {
  resultsSection.style.display = 'none';
  loadingSection.style.display = 'none';
  uploadSection.style.display = 'block';
  uploadPreview.style.display = 'none';
  uploadActions.style.display = 'none';
  previewImg.src = '';
  fileInput.value = '';
  uploadedFile = null;
  if (compOriginal) {
    compOriginal.innerHTML = `<div class="comp-placeholder">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#EEF6FF"/><path d="M10 30V15a3 3 0 013-3h14a3 3 0 013 3v15" stroke="#3B82F6" stroke-width="1.5"/><circle cx="16" cy="20" r="2.5" stroke="#14B8A6" stroke-width="1.3"/><path d="M10 30l6-7 4 4 3-3 7 6" stroke="#14B8A6" stroke-width="1.3" stroke-linejoin="round"/></svg>
      <span>Your uploaded X-ray</span>
    </div>`;
  }
  // reset loading steps
  ['ls1', 'ls2', 'ls3', 'ls4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('active', 'done'); }
  });
  document.getElementById('ls1')?.classList.add('active');
  uploadSection.scrollIntoView({ behavior: 'smooth' });
});

// --- Download Report ---
downloadBtn.addEventListener('click', () => {
  if (!predictionResult) {
    alert('No analysis results to download');
    return;
  }

  const { pt_angle, mt_angle, tl_angle, severity, model_used, routing_reason, processing_ms } = predictionResult;

  // Determine severity badges and ranges
  const getSeverityBadge = (angle) => {
    if (angle < 20) return '<span class="badge normal">Normal</span>';
    if (angle < 40) return '<span class="badge mild">Mild</span>';
    if (angle < 50) return '<span class="badge moderate">Moderate</span>';
    return '<span class="badge severe">Severe</span>';
  };

  const reportHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Scoliosis Detection Report</title>
<style>
  body{font-family:'Segoe UI',sans-serif;max-width:720px;margin:40px auto;padding:0 24px;color:#0F172A;background:#F8FAFC;}
  h1{color:#14B8A6;font-size:2rem;margin-bottom:0.2rem;}
  .sub{color:#64748B;margin-bottom:2rem;}
  .meta{background:#EEF6FF;border-radius:10px;padding:1rem 1.5rem;margin-bottom:2rem;font-size:0.9rem;color:#64748B;}
  table{width:100%;border-collapse:collapse;margin-bottom:2rem;}
  th{background:#14B8A6;color:white;padding:10px 14px;text-align:left;font-size:0.9rem;}
  td{padding:10px 14px;border-bottom:1px solid #DCE7F5;font-size:0.9rem;}
  tr:hover td{background:#EEF6FF;}
  .badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:0.78rem;font-weight:600;}
  .normal{background:rgba(16,185,129,0.12);color:#10B981;}
  .mild{background:rgba(245,158,11,0.12);color:#F59E0B;}
  .moderate{background:rgba(249,115,22,0.12);color:#F97316;}
  .severe{background:rgba(239,68,68,0.12);color:#EF4444;}
  .assessment{background:#fff;border:1px solid #DCE7F5;border-radius:10px;padding:1.2rem 1.5rem;margin-bottom:2rem;}
  .disclaimer{background:rgba(245,158,11,0.08);border-left:4px solid #F59E0B;padding:0.8rem 1rem;border-radius:4px;font-size:0.85rem;color:#92400e;}
  .footer{text-align:center;margin-top:3rem;font-size:0.8rem;color:#94a3b8;}
  .tech-info{background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:0.8rem;margin-top:1rem;font-size:0.8rem;}
</style>
</head>
<body>
<h1>Scoliosis Detection Report</h1>
<p class="sub">AI-Powered Spine Analysis — Research Prototype</p>
<div class="meta">
  <strong>Date:</strong> ${new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}&nbsp;&nbsp;
  <strong>Time:</strong> ${new Date().toLocaleTimeString()}&nbsp;&nbsp;
  <strong>Model:</strong> ${model_used}
</div>
<h2>Cobb Angle Measurements</h2>
<table>
  <thead><tr><th>Region</th><th>Cobb Angle</th><th>Normal Range</th><th>Severity</th></tr></thead>
  <tbody>
    <tr><td>Proximal Thoracic (PT)</td><td><strong>${pt_angle}°</strong></td><td>&lt; 25°</td><td>${getSeverityBadge(pt_angle)}</td></tr>
    <tr><td>Main Thoracic (MT)</td><td><strong>${mt_angle}°</strong></td><td>25–40°</td><td>${getSeverityBadge(mt_angle)}</td></tr>
    <tr><td>Thoracolumbar (TL)</td><td><strong>${tl_angle}°</strong></td><td>&lt; 25°</td><td>${getSeverityBadge(tl_angle)}</td></tr>
  </tbody>
</table>
<h2>Overall Assessment</h2>
<div class="assessment">
  <p><strong>Primary Finding:</strong> ${severity.charAt(0).toUpperCase() + severity.slice(1)} Scoliosis (Main Thoracic curve — ${mt_angle}°)</p>
  <p><strong>Routing Decision:</strong> ${routing_reason}</p>
  <ul style="margin-top:0.8rem;padding-left:1.2rem;line-height:2;">
    <li>PT angle: ${pt_angle < 20 ? 'Within normal range — no intervention required' : pt_angle < 40 ? 'Mild — monitoring recommended' : 'Moderate to severe — specialist evaluation needed'}</li>
    <li>MT angle: ${mt_angle < 20 ? 'Within normal range' : mt_angle < 40 ? 'Mild range — regular monitoring recommended' : mt_angle < 50 ? 'Moderate range — specialist consultation advised' : 'Severe range — immediate specialist evaluation required'}</li>
    <li>TL angle: ${tl_angle < 25 ? 'Within acceptable limits' : 'Requires attention'}</li>
    <li>Regular orthopedic follow-up suggested every 3–6 months</li>
  </ul>
</div>
<div class="tech-info">
  <strong>Analysis Details:</strong><br/>
  Processing Time: ${processing_ms}ms<br/>
  Model: ${model_used}<br/>
  Status: Research Prototype
</div>
<div class="disclaimer">
  ⚠️ <strong>Medical Disclaimer:</strong> This report is generated by an AI research prototype and is intended for educational/research purposes only. It does not constitute a medical diagnosis. Please consult a qualified spinal specialist or orthopedic surgeon for clinical evaluation.
</div>
<div class="footer">Scoliosis Detection — AI Research Prototype · Generated on ${new Date().toDateString()}</div>
</body>
</html>`;

  const blob = new Blob([reportHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scoliosis-report-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
});
