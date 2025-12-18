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
    perfumeDB = rows.map(r => ({
      name: String(r.name || "").trim(),
      scent: String(r.scent || "").trim(),
      intensity: Number(r.intensity) || 6,
      time: String(r.time || "").trim().toLowerCase()
    }));
  } catch(err){
    console.error("Sheet loading error:", err);
    perfumeDB = [
      { name:"SANTAL 33", scent:"Woody", intensity:9, time:"evening" },
      { name:"BERGAMOTE 22", scent:"Floral", intensity:7, time:"morning" }
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
      perfume.intensity
    );
  }

  function drawParticleTextOptimized(ctx, cssW, cssH, text, fontFamily, color, intensity){
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
    const sprayMaxDist = 50;    // was 40
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
      const sprayCount = Math.floor(edgePts.length * sprayDensity);

    for(let i = 0; i < sprayCount; i++){
    const p = edgePts[(Math.random() * edgePts.length) | 0];

    // cluster burst per edge point (this makes it look sprayed)
    const burst = 2 + ((Math.random() * 5) | 0); // 2–6 dots per hit

    for(let k = 0; k < burst; k++){
        const angle = (Math.random() - 0.5) * spraySpread;
        const ca = Math.cos(angle), sa = Math.sin(angle);
        const ndx = p.dx * ca - p.dy * sa;
        const ndy = p.dx * sa + p.dy * ca;

        const t = Math.random();
        const dist = sprayMinDist + (1 - t*t) * sprayMaxDist;

        const sx = (p.bx + ndx * dist) / SUPERSAMPLE;
        const sy = (p.by + ndy * dist) / SUPERSAMPLE;

        // bigger dots (more visible)
        const sr = Math.max(0.2, particleRadius * 0.9 + (Math.random() * 0.9));

        const falloff = 1 - Math.pow(dist / sprayMaxDist, 1.6);
        ctx.globalAlpha =
        (sprayAlphaMin + Math.random() * (sprayAlphaMax - sprayAlphaMin)) *
        Math.max(0, falloff);

        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
    }

    // occasional larger splat
    if(Math.random() < 0.06){
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
