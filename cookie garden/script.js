const STORAGE_KEY = "social_garden_relationships_v3";
  const VIRTUAL_DAY_MS = 30000;
  const DECAY_PER_DAY = 3;
  const MAX_STRENGTH = 100;
  const MIN_STRENGTH = 0;

  function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + encodeURIComponent(cvalue) + ";" + expires + ";path=/";
  }

  function getCookie(cname) {
    const name = cname + "=";
    const decoded = decodeURIComponent(document.cookie);
    const ca = decoded.split(';');
    for (let c of ca) {
      c = c.trim();
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

const PALETTES = [
  { inner: "radial-gradient(circle at 50% 90%, rgba(30,60,100,0.9) 0%, rgba(10,20,40,0.9) 60%, rgba(5,10,20,1) 100%)" },

  { inner: "radial-gradient(circle at 50% 80%, rgba(255,190,145,0.9) 0%, rgba(255,210,175,0.7) 20%, rgba(80,160,210,0.9) 70%, rgba(40,90,150,1) 100%)" },

  { inner: "radial-gradient(circle at 50% 85%, rgba(255,120,70,0.9) 0%, rgba(255,140,90,0.7) 25%, rgba(190,80,120,0.85) 65%, rgba(80,40,100,1) 100%)" },

  { inner: "radial-gradient(circle at 50% 85%, rgba(255,165,180,0.95) 0%, rgba(230,110,150,0.8) 30%, rgba(140,60,150,0.9) 70%, rgba(70,30,100,1) 100%)" },

  { inner: "radial-gradient(circle at 50% 20%, rgba(26,15,45,0.95) 10%, rgba(60,39,84,0.7) 45%, rgba(138,94,153,0.5) 65%, rgba(244,160,119,0.35) 85%, rgba(194,74,20,0.25) 98%, rgba(0,0,0,0) 100%)" }

];


  const nodesLayer = document.getElementById("nodes-layer");
  const svg = document.getElementById("connections-svg");
  const selectedSummaryEl = document.getElementById("selected-summary");
  const statusMessage = document.getElementById("status-message");
  const actionButtons = document.getElementById("action-buttons");

  const addOrb = document.getElementById("add-orb");
  const addForm = document.getElementById("add-form");
  const addNameInput = document.getElementById("add-name");
  const addTypeInput = document.getElementById("add-type");
  const addSaveBtn = document.getElementById("add-save");
  const addCancelBtn = document.getElementById("add-cancel");

  let relationships = [];
  let selectedId = null;

  function loadRelationships() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultRelationships();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return createDefaultRelationships();
      relationships = parsed;
    } catch {
      createDefaultRelationships();
    }
  }

  function saveRelationships() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(relationships));
  }

  function createDefaultRelationships() {
    const now = Date.now();
    const garden = document.querySelector(".garden-container");
    const rect = garden.getBoundingClientRect();

    const centerX = rect.width * 0.5;
    const baseY  = rect.height * 0.5;
    const spreadX = rect.width * 0.22;

    relationships = [
      {
        id: "rel-1",
        name: "Best Friend",
        type: "friend",
        strength: 82,
        lastUpdated: now,
        x: centerX - spreadX,
        y: baseY,
        palette: 0
      },
      {
        id: "rel-2",
        name: "Sibling",
        type: "family",
        strength: 63,
        lastUpdated: now - VIRTUAL_DAY_MS * 1.5,
        x: centerX + spreadX,
        y: baseY,
        palette: 2
      },
      {
        id: "rel-3",
        name: "Partner",
        type: "romantic",
        strength: 90,
        lastUpdated: now - VIRTUAL_DAY_MS * 0.7,
        x: centerX - spreadX * 0.35,
        y: baseY + rect.height * 0.13,
        palette: 1
      },
      {
        id: "rel-4",
        name: "Myself",
        type: "self",
        strength: 40,
        lastUpdated: now - VIRTUAL_DAY_MS * 3.2,
        x: centerX + spreadX * 0.35,
        y: baseY + rect.height * 0.13,
        palette: 3
      }
    ];
    saveRelationships();
  }

  function typeLabel(type) {
    switch (type) {
      case "friend": return "Friend";
      case "family": return "Family";
      case "romantic": return "Romantic";
      case "self": return "Self";
      default: return "Other";
    }
  }

  function strengthStatus(s) {
    if (s >= 75) return "Thriving";
    if (s >= 50) return "Stable";
    if (s >= 25) return "Fragile";
    return "Strained";
  }

  function strengthEmoji(s) {
    if (s >= 75) return "🌸";
    if (s >= 50) return "🌱";
    if (s >= 25) return "🍂";
    return "💔";
  }

  function strengthToSize(strength) {
    const rs = getComputedStyle(document.documentElement);
    const min = parseInt(rs.getPropertyValue("--node-min-size"), 10);
    const max = parseInt(rs.getPropertyValue("--node-max-size"), 10);
    const clamped = Math.max(MIN_STRENGTH, Math.min(MAX_STRENGTH, strength));
    return min + ((max - min) * clamped) / 100;
  }

  // Assign fixed palette per relationship type
  const TYPE_PALETTE = {
    friend: 0,
    family: 1,
    romantic: 2,
    self: 3,
    other: 4
  };

  function render() {
    renderNodes();
    renderConnections();
    renderSelected();
  }

  function renderNodes() {
    nodesLayer.innerHTML = "";
    relationships.forEach((rel) => {
      const size = strengthToSize(rel.strength);
      const node = document.createElement("div");
      node.className = "node";
      if (rel.strength < 30) node.classList.add("node-weak");
      if (rel.strength < 8) node.classList.add("node-dead");
      if (rel.id === selectedId) node.classList.add("selected");

      node.style.width = size + "px";
      node.style.height = size + "px";
      node.style.left = rel.x + "px";
      node.style.top = rel.y + "px";

      const inner = document.createElement("div");
      inner.className = "node-inner";

      if (rel.strength >= 30) {
        const paletteIndex = TYPE_PALETTE[rel.type] ?? 4;
        const palette = PALETTES[paletteIndex];
        inner.style.background = palette.inner;
      }

      const label = document.createElement("div");
      label.className = "node-label";
      label.innerHTML = `
        ${rel.name}
        <span class="node-percent">${Math.round(rel.strength)}%</span>
      `;

      node.appendChild(inner);
      node.appendChild(label);

      node.addEventListener("click", () => {
        selectedId = rel.id;
        setCookie("identity_garden_selected", selectedId, 365);
        render();
      });

      nodesLayer.appendChild(node);
    });
  }

  function renderConnections() {
    svg.innerHTML = "";

    const rect = document
      .querySelector(".garden-container")
      .getBoundingClientRect();

    svg.setAttribute("width", rect.width);
    svg.setAttribute("height", rect.height);

    if (relationships.length <= 1) return;

    relationships.forEach((rel, idx) => {
      const next = relationships[(idx + 1) % relationships.length];

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", rel.x);
      line.setAttribute("y1", rel.y);
      line.setAttribute("x2", next.x);
      line.setAttribute("y2", next.y);
      line.setAttribute("stroke", "rgba(0,0,0,0.22)");
      line.setAttribute("stroke-width", 1.2);
      line.setAttribute("stroke-linecap", "round");
      svg.appendChild(line);
    });
  }

  function renderSelected() {
    const rel = relationships.find((r) => r.id === selectedId);
    if (!rel) {
      selectedSummaryEl.textContent = "Select a connection from the garden.";
      actionButtons.style.display = "none";
      return;
    }

    selectedSummaryEl.innerHTML = `
      <strong>${rel.name}</strong> • ${typeLabel(rel.type)} — 
      <strong>${strengthStatus(rel.strength)}</strong>
    `;
    actionButtons.style.display = "flex";
  }

  function applyDecay() {
    const now = Date.now();
    let changed = false;

    relationships.forEach((rel) => {
      const elapsed = now - rel.lastUpdated;
      if (elapsed <= 0) return;
      const virtualDays = elapsed / VIRTUAL_DAY_MS;
      if (virtualDays < 0.1) return;

      const decayAmount = virtualDays * DECAY_PER_DAY;
      const newStrength = Math.max(MIN_STRENGTH, rel.strength - decayAmount);
      if (newStrength !== rel.strength) {
        rel.strength = newStrength;
        rel.lastUpdated = now;
        changed = true;
      }
    });

    if (changed) {
      saveRelationships();
      render();
    }
  }

  function waterSelected(boost) {
    const rel = relationships.find((r) => r.id === selectedId);
    if (!rel) return;

    const now = Date.now();
    const elapsed = now - rel.lastUpdated;
    const virtualDays = elapsed / VIRTUAL_DAY_MS;
    if (virtualDays > 0) {
      const decayAmount = virtualDays * (DECAY_PER_DAY * 0.4);
      rel.strength = Math.max(MIN_STRENGTH, rel.strength - decayAmount);
    }

    rel.strength = Math.min(MAX_STRENGTH, rel.strength + boost);
    rel.lastUpdated = now;
    saveRelationships();
    render();
  }

  actionButtons.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-boost]");
    if (!btn) return;
    const boost = parseFloat(btn.dataset.boost || "5");
    waterSelected(boost);
  });

  /* plus orb interactions */

  addOrb.addEventListener("click", () => {
    addForm.style.display = "block";
    addNameInput.value = "";
    addTypeInput.value = "friend";
    addNameInput.focus();
  });

  addCancelBtn.addEventListener("click", () => {
    addForm.style.display = "none";
  });

  addSaveBtn.addEventListener("click", () => {
    const name = addNameInput.value.trim();
    const type = addTypeInput.value || "other";
    if (!name) {
      alert("Give the new connection a name first.");
      return;
    }

    const rect = document
      .querySelector(".garden-container")
      .getBoundingClientRect();

    const id = `rel-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = Date.now();

    const centerX = rect.width * 0.5;
    const baseY  = rect.height * 0.5;
    const spreadX = rect.width * 0.22;

    const x = centerX + (Math.random() * 2 - 1) * spreadX;
    const y = baseY + (Math.random() * 2 - 1) * rect.height * 0.12;

    relationships.push({
      id,
      name,
      type,
      strength: 55,
      lastUpdated: now,
      x,
      y,
      palette: TYPE_PALETTE[type] ?? 4
    });

    saveRelationships();
    selectedId = id;
    setCookie("identity_garden_selected", selectedId, 365);
    addForm.style.display = "none";
    render();
  });

  function init() {
    loadRelationships();

    // default selection
    if (!selectedId && relationships[0]) {
      selectedId = relationships[0].id;
    }

    // try to restore last selected from cookie
    const lastFromCookie = getCookie("identity_garden_selected");
    if (lastFromCookie) {
      const exists = relationships.find(r => r.id === lastFromCookie);
      if (exists) {
        selectedId = lastFromCookie;
      }
    }

    render();
    setInterval(applyDecay, 2000);
  }

  window.addEventListener("load", init);