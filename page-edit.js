/* =========================================================
   Elevated Ink — in-page photo editing for signed-in managers
   Loaded by every artist page. Does NOTHING for normal visitors:
   it exits immediately unless this browser has a saved sign-in.
   If the signed-in person is TJ (master), Ariana (social media
   manager) or the artist who owns the page, clicking a photo opens
   a pop-out window to edit its caption, feature it, or remove it,
   and a bar at the bottom adds new photos. All permissions are
   enforced by the database (supabase_roles.sql), not by this file.
   ========================================================= */
(function(){
  const SB_URL = "https://bvsgrgdardumiabfewwr.supabase.co";
  const SB_KEY = "sb_publishable__Qic8J69dJyd76lnVw2m-A_OaF0R9nO";
  const STORE_KEY = "sb-bvsgrgdardumiabfewwr-auth-token";
  const BUCKET = "portfolio";
  try{ if(!localStorage.getItem(STORE_KEY)) return; }catch(e){ return; }
  if(typeof ARTIST === "undefined" || typeof loadPortfolio !== "function") return;

  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  s.onload = init;
  document.head.appendChild(s);

  async function init(){
    const sb = window.supabase.createClient(SB_URL, SB_KEY);
    const { data: sess } = await sb.auth.getSession();
    if(!sess.session) return;
    const [roleRes, profRes] = await Promise.all([
      sb.from("staff_roles").select("role").maybeSingle(),
      sb.from("artist_profiles").select("artist_id").maybeSingle()
    ]);
    const role = roleRes.data && roleRes.data.role;
    const isManager = role === "master" || role === "social";
    const isOwner = !!(profRes.data && profRes.data.artist_id === ARTIST);
    if(!isManager && !isOwner) return;

    /* ---------- styles ---------- */
    const st = document.createElement("style");
    st.textContent = `
    .gcard.editable{cursor:pointer;}
    .gcard.editable::after{content:"\\270E  Edit"; position:absolute; top:8px; right:8px; background:#d4a94f; color:#221c14; font:700 11px 'Libre Franklin',sans-serif; padding:4px 9px; letter-spacing:.02em; z-index:2;}
    .pe-bar{position:fixed; left:50%; bottom:16px; transform:translateX(-50%); z-index:150; background:#221c14; border:2px solid #d4a94f; padding:10px 14px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; justify-content:center; max-width:calc(100vw - 24px); font-family:'Libre Franklin',sans-serif; box-shadow:0 8px 30px rgba(0,0,0,.5);}
    .pe-bar span{font-size:13px; font-weight:700; color:#d4a94f;}
    .pe-btn{font:inherit; font-weight:700; font-size:13px; padding:8px 14px; background:#ece0c3; color:#17130e; border:2px solid #ece0c3; cursor:pointer; text-decoration:none; display:inline-block;}
    .pe-btn:hover{background:#c14a3a; border-color:#c14a3a; color:#ece0c3;}
    .pe-btn.ghost{background:transparent; color:#ece0c3;}
    .pe-btn.ghost:hover{background:#ece0c3; color:#17130e;}
    .pe-btn.danger{background:transparent; border-color:#c14a3a; color:#d65b46;}
    .pe-btn.danger:hover{background:#c14a3a; color:#ece0c3;}
    .pe-btn[disabled]{opacity:.55; cursor:not-allowed;}
    .pe-overlay{position:fixed; inset:0; z-index:400; background:rgba(10,8,5,.86); display:none; align-items:center; justify-content:center; padding:18px; overflow:auto;}
    .pe-overlay.open{display:flex;}
    .pe-box{background:#221c14; color:#ece0c3; border:2px solid #ece0c3; padding:24px; width:100%; max-width:440px; margin:auto; font-family:'Libre Franklin',sans-serif;}
    .pe-box h3{font-family:'Alfa Slab One',serif; font-weight:400; font-size:22px; margin:0 0 14px;}
    .pe-box img{width:100%; max-height:260px; object-fit:contain; background:#2b241a; margin-bottom:14px; display:block;}
    .pe-box label.lbl{display:block; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.02em; color:#b9ab8c; margin-bottom:6px;}
    .pe-box input[type=text]{width:100%; padding:11px 13px; font:inherit; font-size:15px; background:#17130e; color:#ece0c3; border:2px solid #443a2c; margin-bottom:14px;}
    .pe-box input[type=text]:focus{outline:none; border-color:#c14a3a;}
    .pe-check{display:flex; gap:10px; align-items:center; font-size:14px; margin-bottom:14px; cursor:pointer;}
    .pe-check input{width:18px; height:18px; accent-color:#c14a3a;}
    .pe-msg{min-height:20px; font-size:14px; color:#d65b46; margin-bottom:10px;}
    .pe-msg.ok{color:#7fd4a0;}
    .pe-actions{display:flex; gap:10px; flex-wrap:wrap; justify-content:space-between;}
    .pe-actions .grp{display:flex; gap:10px;}
    body{padding-bottom:76px;}
    `;
    document.head.appendChild(st);

    /* ---------- helpers ---------- */
    const API = window.EIEdit = { on:true };
    let starterSet = null;
    async function starters(){
      if(starterSet) return starterSet;
      starterSet = new Set();
      try{ const r = await fetch("portfolio.json"); if(r.ok){ const j = await r.json(); (j[ARTIST] || []).forEach(p => starterSet.add(p.file)); } }catch(e){}
      return starterSet;
    }
    function refresh(){ return loadPortfolio().then(items => renderPortfolio(items.length ? items : FALLBACK)).catch(() => renderPortfolio(FALLBACK)); }
    API.refresh = refresh;
    const el = (tag, attrs, kids) => { const e = document.createElement(tag); Object.entries(attrs || {}).forEach(([k, v]) => k === "text" ? e.textContent = v : e.setAttribute(k, v)); (kids || []).forEach(c => e.appendChild(c)); return e; };
    function say(node, t, ok){ node.textContent = t || ""; node.classList.toggle("ok", !!ok); }

    async function toJpeg(file, maxSide){
      if(!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error(file.name + " isn't a JPG, PNG or WebP image.");
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(bmp, 0, 0, w, h);
      const blob = await new Promise(res => c.toBlob(res, "image/jpeg", 0.85));
      if(!blob) throw new Error("Couldn't process " + file.name);
      return blob;
    }

    /* ---------- edit pop-out ---------- */
    const ov = el("div", { class:"pe-overlay", role:"dialog", "aria-modal":"true" });
    const prev = el("img", { alt:"" });
    const cap = el("input", { type:"text", maxlength:"80", placeholder:"Leave blank to show just the artist's name", id:"peCap" });
    const feat = el("input", { type:"checkbox", id:"peFeat" });
    const msg = el("div", { class:"pe-msg", role:"status" });
    const bSave = el("button", { class:"pe-btn", type:"button", text:"Save" });
    const bCancel = el("button", { class:"pe-btn ghost", type:"button", text:"Cancel" });
    const bDel = el("button", { class:"pe-btn danger", type:"button", text:"Remove photo" });
    ov.appendChild(el("div", { class:"pe-box" }, [
      el("h3", { text:"Edit photo" }), prev,
      el("label", { class:"lbl", for:"peCap", text:"Caption (optional)" }), cap,
      el("label", { class:"pe-check" }, [feat, document.createTextNode("Feature this photo (shows in the Featured section and the homepage gallery)")]),
      msg,
      el("div", { class:"pe-actions" }, [bDel, el("div", { class:"grp" }, [bCancel, bSave])])
    ]));
    document.body.appendChild(ov);
    let cur = null, confirmDel = false;
    function close(){ ov.classList.remove("open"); cur = null; confirmDel = false; bDel.textContent = "Remove photo"; }
    ov.addEventListener("click", e => { if(e.target === ov) close(); });
    document.addEventListener("keydown", e => { if(e.key === "Escape") close(); });
    bCancel.addEventListener("click", close);

    API.edit = p => {
      cur = p; confirmDel = false; bDel.textContent = "Remove photo"; say(msg, "");
      prev.src = p.file; cap.value = p.caption || ""; feat.checked = !!p.featured;
      ov.classList.add("open"); setTimeout(() => cap.focus(), 50);
    };

    bSave.addEventListener("click", async () => {
      if(!cur) return;
      bSave.disabled = true; say(msg, "Saving…");
      const { error } = await sb.from("portfolio_photos").upsert(
        { artist_id: ARTIST, src: cur.file, caption: cap.value.trim(), featured: feat.checked, hidden: false },
        { onConflict: "artist_id,src" });
      bSave.disabled = false;
      if(error){ say(msg, "Couldn't save: " + error.message); return; }
      close(); await refresh();
    });

    bDel.addEventListener("click", async () => {
      if(!cur) return;
      const isStarter = (await starters()).has(cur.file);
      if(!confirmDel){
        confirmDel = true; bDel.textContent = "Tap again to confirm";
        say(msg, isStarter ? "This hides the photo from the page. It can be restored later from Manage Portfolios." : "This permanently deletes the uploaded photo.");
        return;
      }
      bDel.disabled = true; say(msg, "Removing…");
      let error = null;
      if(isStarter){
        ({ error } = await sb.from("portfolio_photos").upsert(
          { artist_id: ARTIST, src: cur.file, caption: cur.caption || "", featured: !!cur.featured, hidden: true },
          { onConflict: "artist_id,src" }));
      } else {
        const { data: row } = await sb.from("portfolio_photos").select("id,storage_path").eq("artist_id", ARTIST).eq("src", cur.file).maybeSingle();
        if(row && row.storage_path) await sb.storage.from(BUCKET).remove([row.storage_path]);
        ({ error } = await sb.from("portfolio_photos").delete().eq("artist_id", ARTIST).eq("src", cur.file));
      }
      bDel.disabled = false;
      if(error){ say(msg, "Couldn't remove: " + error.message); return; }
      close(); await refresh();
    });

    /* ---------- bottom bar: add photos + toggle ---------- */
    const file = el("input", { type:"file", accept:"image/jpeg,image/png,image/webp", multiple:"multiple", style:"display:none;" });
    const bAdd = el("button", { class:"pe-btn", type:"button", text:"+ Add photos" });
    const bText = el("a", { class:"pe-btn ghost", href: isManager ? "portfolio-manager.html?manage=1" : "portfolio-manager.html", text:"Edit bio & profile" });
    const bMode = el("button", { class:"pe-btn ghost", type:"button", text:"Edit mode: On" });
    const status = el("span", { text:"Editing " + (typeof ARTIST_NAME !== "undefined" ? ARTIST_NAME : ARTIST) + "'s page" });
    const bar = el("div", { class:"pe-bar" }, [status, bAdd, bText, bMode, file]);
    document.body.appendChild(bar);
    bAdd.addEventListener("click", () => file.click());
    file.addEventListener("change", async () => {
      const files = [...file.files]; file.value = ""; if(!files.length) return;
      bAdd.disabled = true; let ok = 0, fail = 0, lastErr = "";
      for(let i = 0; i < files.length; i++){
        status.textContent = "Uploading " + (i + 1) + " of " + files.length + "…";
        try{
          const blob = await toJpeg(files[i], 1600);
          const path = ARTIST + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
          const up = await sb.storage.from(BUCKET).upload(path, blob, { contentType:"image/jpeg", cacheControl:"31536000" });
          if(up.error) throw up.error;
          const pub = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
          const ins = await sb.from("portfolio_photos").insert({ artist_id: ARTIST, src: pub, storage_path: path });
          if(ins.error){ await sb.storage.from(BUCKET).remove([path]); throw ins.error; }
          ok++;
        }catch(err){ fail++; lastErr = err.message || String(err); }
      }
      bAdd.disabled = false;
      status.textContent = ok + " photo" + (ok === 1 ? "" : "s") + " added" + (fail ? ", " + fail + " failed (" + lastErr + ")" : "");
      await refresh();
      setTimeout(() => { status.textContent = "Editing " + (typeof ARTIST_NAME !== "undefined" ? ARTIST_NAME : ARTIST) + "'s page"; }, 5000);
    });
    bMode.addEventListener("click", async () => {
      API.on = !API.on; bMode.textContent = "Edit mode: " + (API.on ? "On" : "Off");
      status.textContent = API.on ? "Editing " + (typeof ARTIST_NAME !== "undefined" ? ARTIST_NAME : ARTIST) + "'s page" : "Viewing as a visitor";
      await refresh();
    });

    await refresh(); // re-draw so photos get their Edit badges
  }
})();
