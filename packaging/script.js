(async function init(){
  const sheetID = "1nmLZXO_OKk52Ya06ONY0IHi9RzWURj8E8sQcrC30PcI";
  const tabName = "Sheet1";
  const opensheet_uri = `https://opensheet.elk.sh/${sheetID}/${tabName}`;

  const graffitiFonts = {
    Floral: "floral",
    Woody: "woody",
    Spicy: "spicy",
    Aquatic: "aquatic"
  };

  const fontsToLoad = Object.values(graffitiFonts).map(f => `${400} 24px "${f}"`);
  try {
    await document.fonts.ready;
    await Promise.all(fontsToLoad.map(desc => document.fonts.load(desc)));
    await new Promise(r => setTimeout(r, 60));
    console.log("Custom fonts loaded");
  } catch(e){
    console.warn("Fonts may not be fully loaded:", e);
  }

  let perfumeDB = [];
  try {
    const res = await fetch(opensheet_uri);
    const rows = await res.json();
    // read columns whatever their capitalisation or stray spaces ("Longevity ", "longevity")
    const get = (r, key) => {
      const k = Object.keys(r).find(k => k.trim().toLowerCase() === key);
      return k === undefined ? "" : r[k];
    };
    perfumeDB = rows.map(r => ({
      name: String(get(r, "name") || "").trim(),
      scent: String(get(r, "scent") || "").trim(),
      intensity: Number(get(r, "intensity")) || 6,
      longevity: Number(get(r, "longevity")) || 5,     // NEW: 1–10, how long the scent lasts
      time: String(get(r, "time") || "").trim().toLowerCase()
    }));
    // check in the browser console (right-click → Inspect → Console) that longevity came through
    console.table(perfumeDB);
  } catch(err){
    console.error("Sheet loading error:", err);
    perfumeDB = [
      { name:"SANTAL 33", scent:"Woody", intensity:9, longevity:9, time:"evening" },
      { name:"BERGAMOTE 22", scent:"Floral", intensity:7, longevity:4, time:"morning" }
    ];
  }

  const container = document.getElementById("gridContainer");
  container.innerHTML = "";

  perfumeDB.forEach(perfume => {
    const card = document.createElement("div");
    card.className = "labelCard";

    const canvas = document.createElement("canvas");
    canvas.className = "particleCanvas";
    card.appendChild(canvas);

    const sr = document.createElement("div");
    sr.className = "labelPreview";
    sr.innerText = perfume.name;
    card.appendChild(sr);

    container.appendChild(card);
    sizeCanvasToCardAndDraw(canvas, card, perfume);
  });

  // ---------- DOWNLOAD ----------
  // Click any label to download it, or use "Download all labels".
  // Each file is a transparent PNG drawn 4× larger than on screen, so it stays sharp for printing
  // (the spray is random, so the downloaded file is a fresh spray, not a copy of the one on screen).
  const EXPORT_SCALE = 4;

  function labelToPNG(perfume, card){
    const rect = card.getBoundingClientRect();
    const out = document.createElement("canvas");
    out.width = Math.round(rect.width * EXPORT_SCALE);
    out.height = Math.round(rect.height * EXPORT_SCALE);
    const octx = out.getContext("2d");
    octx.setTransform(EXPORT_SCALE, 0, 0, EXPORT_SCALE, 0, 0);
    drawParticleTextOptimized(octx, rect.width, rect.height, perfume.name,
      graffitiFonts[perfume.scent] || "Arial", "#000", perfume.intensity, perfume.longevity);
    return new Promise(res => out.toBlob(res, "image/png"));
  }

  async function downloadLabel(perfume, card){
    const blob = await labelToPNG(perfume, card);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (perfume.name || "label").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  document.querySelectorAll(".labelCard").forEach((card, idx) => {
    card.style.cursor = "pointer";
    card.title = "Click to download";
    card.addEventListener("click", () => downloadLabel(perfumeDB[idx], card));
  });

  const allBtn = document.createElement("button");
  allBtn.textContent = "Download all labels";
  Object.assign(allBtn.style, {
    position: "fixed", top: "16px", right: "16px", zIndex: 10,
    padding: "10px 18px", border: "none", borderRadius: "999px",
    background: "#111", color: "#fff", font: "13px Arial, sans-serif", cursor: "pointer"
  });
  allBtn.addEventListener("click", async () => {
    const cards = document.querySelectorAll(".labelCard");
    for(let i = 0; i < cards.length; i++){
      await downloadLabel(perfumeDB[i], cards[i]);
      await new Promise(r => setTimeout(r, 350));   // small gap so the browser accepts each download
    }
  });
  document.body.appendChild(allBtn);

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document.querySelectorAll(".labelCard").forEach((card, idx) => {
        const canvas = card.querySelector("canvas.particleCanvas");
        const p = perfumeDB[idx];
        if (canvas && p) sizeCanvasToCardAndDraw(canvas, card, p);
      });
    }, 120);
  });

  function sizeCanvasToCardAndDraw(canvas, card, perfume){
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const rect = card.getBoundingClientRect();
    const cssW = rect.width;
    const cssH = rect.height;

    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawParticleTextOptimized(
      ctx,
      cssW,
      cssH,
      perfume.name,
      graffitiFonts[perfume.scent] || "Arial",
      "#000",
      perfume.intensity,
      perfume.longevity
    );
  }

  function drawParticleTextOptimized(ctx, cssW, cssH, text, fontFamily, color, intensity, longevity){
    ctx.clearRect(0,0,cssW,cssH);

    const SUPERSAMPLE = 3;
    const bw = Math.round(cssW * SUPERSAMPLE);
    const bh = Math.round(cssH * SUPERSAMPLE);

    const buffer = document.createElement("canvas");
    buffer.width = bw;
    buffer.height = bh;
    const bctx = buffer.getContext("2d");

    bctx.clearRect(0,0,bw,bh);

    // fit text
    let testSize = Math.round(bh * 0.5);
    const maxWidth = bw * 0.92;
    bctx.textAlign = "center";
    bctx.textBaseline = "middle";

    while(testSize > 8){
      bctx.font = `${testSize}px "${fontFamily}"`;
      if(bctx.measureText(text).width <= maxWidth) break;
      testSize -= 2;
    }

    // draw mask
    bctx.fillStyle = "#000";
    bctx.font = `${testSize}px "${fontFamily}"`;
    bctx.fillText(text, bw/2, bh/2);

    const img = bctx.getImageData(0,0,bw,bh).data;

    // intensity mapping
    const intSettings = {
      5:  { radius: 0.6, step: 6 },
      6:  { radius: 0.7, step: 5 },
      7:  { radius: 0.8, step: 5 },
      8:  { radius: 0.9, step: 4 },
      9:  { radius: 1.0, step: 3 },
      10: { radius: 1.1, step: 3 }
    };

    const clampedIntensity = Math.max(5, Math.min(10, Number(intensity) || 5));
    const particleRadius = intSettings[clampedIntensity].radius;
    const step = intSettings[clampedIntensity].step;

    // ============================
    // ✅ SPRAY SETTINGS (VISIBLE)
    // ============================
    const outsideA = 10;     // outside threshold
    const insideA  = 230;    // strong inside threshold

    const sprayDensity = 3.0;   // was 4.0
    // NEW: spray distance comes from longevity (1–10), exaggerated.
    // Longevity 1 stays tight around the letters; longevity 10 sprays
    // all the way out to the edges of the label.
    const textHalfH = testSize * 0.4;                      // roughly half the letter height
    const toEdge = Math.max(bh / 2 - textHalfH, bw * 0.04); // distance from the letters to the label edge
    // The sheet's longevity runs from 4 (lowest) to 10, so 4 is a barely-there haze
    // and every step above it spreads much further, with 10 spilling off the label.
    const LONGEVITY_LOW  = 4;                 // lowest longevity in the sheet
    const LONGEVITY_HIGH = 10;
    const LONGEVITY_MIN_DIST = 6;             // spray at longevity 4: hugs the letters
    const LONGEVITY_MAX_DIST = toEdge * 1.15; // spray at longevity 10: past the label edges
    const clampedLongevity = Math.max(LONGEVITY_LOW, Math.min(LONGEVITY_HIGH, Number(longevity) || 7));
    const lt = (clampedLongevity - LONGEVITY_LOW) / (LONGEVITY_HIGH - LONGEVITY_LOW);   // 0 → 1
    // power under 1 makes the jump big from the very first step above 4
    const sprayMaxDist = LONGEVITY_MIN_DIST + Math.pow(lt, 0.7) * (LONGEVITY_MAX_DIST - LONGEVITY_MIN_DIST);
    const sprayMinDist = 2.0;
    const spraySpread  = 0.6;    // wider cone

    const sprayAlphaMin = 0.06;  // was 0.05
    const sprayAlphaMax = 0.22;  // was 0.22

    // ============================

    ctx.fillStyle = "#000";

    function alphaAt(x, y){
      if(x < 0 || y < 0 || x >= bw || y >= bh) return 0;
      return img[(y * bw + x) * 4 + 3];
    }

    function outwardDir(x, y){
      const aL = alphaAt(x - 1, y);
      const aR = alphaAt(x + 1, y);
      const aU = alphaAt(x, y - 1);
      const aD = alphaAt(x, y + 1);

      let gx = (aR - aL);
      let gy = (aD - aU);

      gx = -gx; gy = -gy;
      const len = Math.hypot(gx, gy) || 1;
      return { x: gx / len, y: gy / len };
    }

    // ---- PASS 1: draw inside particles + collect edge points ----
    const edgePts = [];

    for(let by = 0; by < bh; by += step){
      for(let bx = 0; bx < bw; bx += step){
        const a = alphaAt(bx, by);
        if(a <= 150) continue;

        // inside particle
        const px = bx / SUPERSAMPLE;
        const py = by / SUPERSAMPLE;

        const jitter = (Math.random() - 0.5) * 0.35;
        const r = Math.max(0.2, particleRadius + jitter);

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();

        // edge check: strong inside but touches outside nearby
        if(a >= insideA){
          const d = 2;
          const isEdge =
            alphaAt(bx - d, by) < outsideA ||
            alphaAt(bx + d, by) < outsideA ||
            alphaAt(bx, by - d) < outsideA ||
            alphaAt(bx, by + d) < outsideA ||
            alphaAt(bx - d, by - d) < outsideA ||
            alphaAt(bx + d, by - d) < outsideA ||
            alphaAt(bx - d, by + d) < outsideA ||
            alphaAt(bx + d, by + d) < outsideA;

          if(isEdge){
            const dir = outwardDir(bx, by);
            edgePts.push({ bx, by, dx: dir.x, dy: dir.y });
          }
        }
      }
    }

    // ---- PASS 2: spray outward from edges (THIS makes it visible) ----
    if(edgePts.length){
      const sprayCount = Math.floor(edgePts.length * sprayDensity * Math.max(0.35, sprayMaxDist / 40));   // more dots the further they travel

    for(let i = 0; i < sprayCount; i++){
    const p = edgePts[(Math.random() * edgePts.length) | 0];

    // each burst reaches a different distance, so the outer edge is ragged, not a clean outline
    const reach = sprayMaxDist * (0.55 + Math.random() * 0.75);   // 55%–130% of the longevity distance

    // cluster burst per edge point (this makes it look sprayed)
    const burst = 2 + ((Math.random() * 5) | 0); // 2–6 dots per hit

    for(let k = 0; k < burst; k++){
        const angle = (Math.random() - 0.5) * spraySpread;
        const ca = Math.cos(angle), sa = Math.sin(angle);
        const ndx = p.dx * ca - p.dy * sa;
        const ndy = p.dx * sa + p.dy * ca;

        // most dots land close to the letters and get rarer further out (like real spray paint);
        // the old formula did the opposite and piled dots up at the limit, which made the hard edge
        const dist = sprayMinDist + Math.pow(Math.random(), 1.15) * reach;   // lower = more dots carried far from the letters

        const sx = (p.bx + ndx * dist) / SUPERSAMPLE;
        const sy = (p.by + ndy * dist) / SUPERSAMPLE;

        // how far out this dot is (0 at the letters, 1 at the furthest a burst can go)
        const far = Math.min(1, dist / (sprayMaxDist * 1.3));

        // dots shrink a little as they drift out
        const sr = Math.max(0.2, (particleRadius * 0.9 + Math.random() * 0.9) * (1 - far * 0.45));

        // fade all the way to nothing at the outer edge, so the spray dissolves instead of stopping
        const falloff = Math.pow(1 - far, 1.4);
        ctx.globalAlpha =
        (sprayAlphaMin + Math.random() * (sprayAlphaMax - sprayAlphaMin)) *
        Math.max(0, falloff);

        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
    }

    // occasional larger splat
    // keep the number of big splats the same however wide the spray gets
    if(Math.random() < 0.06 / Math.max(1, sprayMaxDist / 50)){
        const splatDist = sprayMinDist + Math.random() * (sprayMaxDist * 0.4);
        const sx = (p.bx + p.dx * splatDist) / SUPERSAMPLE;
        const sy = (p.by + p.dy * splatDist) / SUPERSAMPLE;
        const sr = particleRadius * (1.8 + Math.random() * 2.2);

        ctx.globalAlpha = 0.25 + Math.random() * 0.35;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
    }
    }
    ctx.globalAlpha = 1;

        }

        ctx.globalAlpha = 1;
    }

})();
