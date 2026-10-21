/* =========================================================
   Elevated Ink — simple photo editing for TJ, Ariana and artists
   Loaded on the homepage and every artist page.

   - Visitors: nothing happens (just a small "Staff sign-in" link in the footer).
   - Staff: sign in from the footer link. The page then shows a big bar at the
     bottom ("Add a photo") and every photo you can change gets an Edit tag.
     Tap a photo -> a window opens to change its caption, mark it as a
     favorite, or delete it.
   Permissions are enforced by the database (supabase_roles.sql), not here.
   ========================================================= */
(function(){
  const SB_URL = "https://bvsgrgdardumiabfewwr.supabase.co";
  const SB_KEY = "sb_publishable__Qic8J69dJyd76lnVw2m-A_OaF0R9nO";
  const STORE_KEY = "sb-bvsgrgdardumiabfewwr-auth-token";
  const BUCKET = "portfolio";
  const NAMES = { tj:"TJ", ariana:"Ariana", makenzi:"Makenzi", aaron:"Aaron", austin:"Austin", doug:"Doug", freddy:"Freddy (test)" };

  const PAGE_ARTIST = (typeof ARTIST !== "undefined") ? ARTIST : null;          // artist pages
  const IS_GALLERY = !PAGE_ARTIST && !!document.getElementById("galleryGrid");  // homepage
  if(PAGE_ARTIST ? typeof loadPortfolio !== "function" : !IS_GALLERY) return;

  let hasSession = false;
  try{ hasSession = !!localStorage.getItem(STORE_KEY); }catch(e){}

  /* ---------- load the Supabase library only when needed ---------- */
  let sbPromise = null;
  function getSb(){
    if(sbPromise) return sbPromise;
    sbPromise = new Promise((resolve, reject) => {
      if(window.supabase) return resolve(window.supabase.createClient(SB_URL, SB_KEY));
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload = () => resolve(window.supabase.createClient(SB_URL, SB_KEY));
      s.onerror = () => reject(new Error("Couldn't load. Check your internet connection."));
      document.head.appendChild(s);
    });
    return sbPromise;
  }

  const el = (tag, attrs, kids) => { const e = document.createElement(tag); Object.entries(attrs || {}).forEach(([k, v]) => k === "text" ? e.textContent = v : e.setAttribute(k, v)); (kids || []).forEach(c => e.appendChild(c)); return e; };
  function say(node, t, ok){ node.textContent = t || ""; node.classList.toggle("ok", !!ok); }

  /* ---------- styles (only added when something is shown) ---------- */
  let styled = false;
  function addStyles(){
    if(styled) return; styled = true;
    const st = document.createElement("style");
    st.textContent = `
    .gcard.editable{cursor:pointer;}
    .gcard.editable::after{content:"\\270E  Edit"; position:absolute; top:8px; right:8px; background:#d4a94f; color:#221c14; font:700 13px 'Libre Franklin',sans-serif; padding:6px 11px; z-index:2;}
    .pe-top{display:flex; gap:20px; align-items:center; margin-right:14px; flex-shrink:0;}
    .pe-top a{font:600 14px 'Libre Franklin',sans-serif; color:#b9ab8c; text-decoration:none; padding-bottom:3px; border-bottom:2px solid transparent;}
    .pe-top a:hover{color:#ece0c3; border-color:#c14a3a;}
    .pe-switch{display:flex; align-items:center; gap:9px; background:none; border:0; padding:0; cursor:pointer; font:700 14px 'Libre Franklin',sans-serif; color:#b9ab8c;}
    .pe-switch .trk{width:42px; height:24px; border-radius:12px; background:#443a2c; position:relative; transition:background .2s; flex-shrink:0;}
    .pe-switch .trk::after{content:""; position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:#ece0c3; transition:left .2s;}
    .pe-switch[aria-checked="true"]{color:#d4a94f;}
    .pe-switch[aria-checked="true"] .trk{background:#d4a94f;}
    .pe-switch[aria-checked="true"] .trk::after{left:21px; background:#221c14;}
    @media(max-width:820px){ header nav.wrap{flex-wrap:wrap; height:auto !important; padding-top:10px;} .pe-top{order:5; flex:0 0 100%; justify-content:center; margin:8px 0 0; padding:10px 0 12px; border-top:1px solid #443a2c;} }
    .pe-manage{font:700 14px 'Libre Franklin',sans-serif; padding:9px 16px; border:2px solid #d4a94f; color:#d4a94f; background:transparent; cursor:pointer; white-space:nowrap; transition:all .2s; margin-right:10px; flex-shrink:0;}
    .pe-manage:hover{background:#d4a94f; color:#221c14;}
    .pe-manage.on{background:#d4a94f; color:#221c14;}
    @media(max-width:600px){ .pe-manage{padding:8px 11px; font-size:13px; margin-right:6px;} }
    .staff-link{display:inline-block; margin-top:6px; font:12px 'Libre Franklin',sans-serif; color:#b9ab8c; text-decoration:underline; opacity:.8;}
    .staff-link:hover{color:#ece0c3; opacity:1;}
    .pe-bar{position:fixed; left:50%; bottom:14px; transform:translateX(-50%); z-index:150; background:#221c14; border:3px solid #d4a94f; padding:12px 14px; display:flex; flex-direction:column; align-items:center; gap:10px; width:calc(100vw - 24px); max-width:640px; font-family:'Libre Franklin',sans-serif; box-shadow:0 8px 30px rgba(0,0,0,.55);}
    .pe-tip{font-size:14px; color:#ece0c3; text-align:center; line-height:1.4;}
    .pe-tip b{color:#d4a94f;}
    .pe-row{display:flex; gap:10px; align-items:center; flex-wrap:wrap; justify-content:center; width:100%;}
    .pe-btn{font:inherit; font-weight:700; font-size:16px; padding:13px 20px; background:#ece0c3; color:#17130e; border:2px solid #ece0c3; cursor:pointer; text-decoration:none; display:inline-block; min-height:48px;}
    .pe-btn:hover{background:#c14a3a; border-color:#c14a3a; color:#ece0c3;}
    .pe-btn.big{font-size:18px; padding:14px 26px; background:#7fd4a0; border-color:#7fd4a0; color:#102416;}
    .pe-btn.big:hover{background:#9fe4b8; border-color:#9fe4b8; color:#102416;}
    .pe-btn.ghost{background:transparent; color:#ece0c3;}
    .pe-btn.ghost:hover{background:#ece0c3; color:#17130e;}
    .pe-btn.small{font-size:13px; padding:8px 12px; min-height:0;}
    .pe-btn.danger{background:transparent; border-color:#c14a3a; color:#d65b46;}
    .pe-btn.danger:hover{background:#c14a3a; color:#ece0c3;}
    .pe-btn[disabled]{opacity:.55; cursor:not-allowed;}
    .pe-select{font:inherit; font-size:16px; font-weight:600; padding:12px 12px; background:#17130e; color:#ece0c3; border:2px solid #443a2c; min-height:48px;}
    .pe-overlay{position:fixed; inset:0; z-index:400; background:rgba(10,8,5,.88); display:none; align-items:center; justify-content:center; padding:18px; overflow:auto;}
    .pe-overlay.open{display:flex;}
    .pe-box{background:#221c14; color:#ece0c3; border:2px solid #ece0c3; padding:24px; width:100%; max-width:460px; margin:auto; font-family:'Libre Franklin',sans-serif;}
    .pe-box h3{font-family:'Alfa Slab One',serif; font-weight:400; font-size:24px; margin:0 0 6px;}
    .pe-box p.sub{margin:0 0 16px; color:#b9ab8c; font-size:14px;}
    .pe-box img{width:100%; max-height:260px; object-fit:contain; background:#2b241a; margin-bottom:16px; display:block;}
    .pe-box label.lbl{display:block; font-weight:700; font-size:14px; color:#ece0c3; margin-bottom:6px;}
    .pe-box input[type=text], .pe-box input[type=email], .pe-box input[type=password]{width:100%; padding:13px 14px; font:inherit; font-size:16px; background:#17130e; color:#ece0c3; border:2px solid #443a2c; margin-bottom:16px;}
    .pe-box input:focus{outline:none; border-color:#c14a3a;}
    .pe-check{display:flex; gap:12px; align-items:center; font-size:16px; margin-bottom:16px; cursor:pointer;}
    .pe-check input{width:24px; height:24px; accent-color:#c14a3a; flex-shrink:0;}
    .pe-msg{min-height:22px; font-size:15px; color:#ff8a76; margin-bottom:12px;}
    .pe-msg.ok{color:#7fd4a0;}
    .pe-actions{display:flex; gap:10px; flex-wrap:wrap; justify-content:space-between; align-items:center;}
    .pe-actions .grp{display:flex; gap:10px;}
    body.pe-on{padding-bottom:150px;}
    `;
    document.head.appendChild(st);
  }

  /* ---------- staff sign-in window (from the footer link) ---------- */
  let signInOv = null;
  function openSignIn(){
    addStyles();
    if(!signInOv){
      const email = el("input", { type:"email", id:"peEmail", autocomplete:"username", placeholder:"you@example.com" });
      const pw = el("input", { type:"password", id:"pePw", autocomplete:"current-password" });
      const msg = el("div", { class:"pe-msg", role:"status" });
      const go = el("button", { class:"pe-btn", type:"button", text:"Sign in" });
      const cancel = el("button", { class:"pe-btn ghost", type:"button", text:"Cancel" });
      signInOv = el("div", { class:"pe-overlay", role:"dialog", "aria-modal":"true" }, [el("div", { class:"pe-box" }, [
        el("h3", { text:"Staff sign-in" }), el("p", { class:"sub", text:"Sign in to add and edit photos on the website." }),
        el("label", { class:"lbl", for:"peEmail", text:"Email" }), email,
        el("label", { class:"lbl", for:"pePw", text:"Password" }), pw,
        msg, el("div", { class:"pe-actions" }, [cancel, go])
      ])]);
      document.body.appendChild(signInOv);
      signInOv.addEventListener("click", e => { if(e.target === signInOv) signInOv.classList.remove("open"); });
      cancel.addEventListener("click", () => signInOv.classList.remove("open"));
      async function submit(){
        if(!email.value.trim() || !pw.value){ say(msg, "Please type your email and password."); return; }
        go.disabled = true; say(msg, "Signing in…");
        try{
          const sb = await getSb();
          const { error } = await sb.auth.signInWithPassword({ email: email.value.trim(), password: pw.value });
          if(error){ go.disabled = false; say(msg, "That email or password didn't work. Please try again."); return; }
          say(msg, "Signed in!", true); location.href = "staff.html";
        }catch(err){ go.disabled = false; say(msg, err.message || "Something went wrong."); }
      }
      go.addEventListener("click", submit);
      pw.addEventListener("keydown", e => { if(e.key === "Enter") submit(); });
    }
    signInOv.classList.add("open");
    setTimeout(() => document.getElementById("peEmail").focus(), 50);
  }
  const link = document.getElementById("staffSignIn");
  if(link){ link.textContent = "Staff menu"; link.setAttribute("href", "staff.html"); }

  if(!hasSession) return;
  init();

  /* ---------- signed-in: editing tools ---------- */
  async function init(){
    let sb;
    try{ sb = await getSb(); }catch(e){ return; }
    const { data: sess } = await sb.auth.getSession();
    if(!sess.session) return;
    const [roleRes, profRes] = await Promise.all([
      sb.from("staff_roles").select("role").maybeSingle(),
      sb.from("artist_profiles").select("artist_id").maybeSingle()
    ]);
    const role = roleRes.data && roleRes.data.role;
    const isManager = role === "master" || role === "social";
    const ownId = profRes.data && profRes.data.artist_id;
    const canEditArtist = a => isManager || ownId === a;
    const allowed = PAGE_ARTIST ? canEditArtist(PAGE_ARTIST) : (isManager || !!ownId);
    console.log("[page-edit] role:", role || "none", "| linked artist:", ownId || "none", "| page:", PAGE_ARTIST || "homepage", roleRes.error ? "| role lookup error: " + roleRes.error.message : "");
    let topSwitch = null, switchHandler = null;
    if(ownId || isManager){
      addStyles();
      const strip = el("div", { class:"pe-top" }, [
        el("a", { href: isManager ? "portfolio-manager.html?manage=1" : "portfolio-manager.html", text:"Portfolio" }),
        el("a", { href:"scheduler.html", text:"Scheduler" })]);
      if(isManager){
        topSwitch = el("button", { class:"pe-switch", type:"button", role:"switch", "aria-checked":"false", "aria-label":"Manage mode (edit photos on the site)" }, [el("span", { text:"Manage" }), el("span", { class:"trk" })]);
        topSwitch.addEventListener("click", () => { if(switchHandler) switchHandler(topSwitch.getAttribute("aria-checked") !== "true"); });
        strip.appendChild(topSwitch);
      }
      const nav = document.querySelector("header nav");
      if(nav){
        const actions = nav.querySelector(".nav-actions"), toggle = nav.querySelector(".navtoggle");
        if(actions) nav.insertBefore(strip, actions);
        else if(toggle) nav.insertBefore(strip, toggle);
        else nav.appendChild(strip);
      }
    }
    if(!allowed){
      if(/[?&]editdebug\b/.test(location.search) || roleRes.error){
        addStyles();
        document.body.appendChild(el("div", { class:"pe-bar", style:"border-color:#c14a3a;" }, [el("div", { class:"pe-tip", text:
          "Signed in, but this account can't edit this page. Role: " + (role || "none") + ". Linked artist: " + (ownId || "none") + ". This page: " + (PAGE_ARTIST || "homepage") + "." +
          (roleRes.error ? " Role lookup failed (" + roleRes.error.message + ") - supabase_roles.sql may not have been run." : " Ask the shop owner to check your account in Supabase.") })]));
      }
      return;
    }

    addStyles();
    let startOn = false;
    try{ startOn = sessionStorage.getItem("eiManage") === "1"; }catch(e){}
    const API = window.EIEdit = { on:startOn, canEdit: canEditArtist };

    /* ----- data helpers ----- */
    let starterData = null;
    async function starterJson(){
      if(starterData) return starterData;
      starterData = {};
      try{ const r = await fetch("portfolio.json"); if(r.ok) starterData = await r.json(); }catch(e){}
      return starterData;
    }
    async function starters(artist){ const j = await starterJson(); return new Set((j[artist] || []).map(p => p.file)); }
    function refresh(){
      if(IS_GALLERY) return loadFeatured();
      return loadPortfolio().then(items => renderPortfolio(items.length ? items : FALLBACK)).catch(() => renderPortfolio(FALLBACK));
    }
    async function toJpeg(file, maxSide){
      if(!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("\"" + file.name + "\" isn't a JPG, PNG or WebP picture.");
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(bmp, 0, 0, w, h);
      const blob = await new Promise(res => c.toBlob(res, "image/jpeg", 0.85));
      if(!blob) throw new Error("Couldn't prepare \"" + file.name + "\".");
      return blob;
    }

    /* ----- the edit window ----- */
    const title = el("h3", { text:"Edit this photo" });
    const sub = el("p", { class:"sub", text:"Change the caption, mark it as a favorite, or delete it." });
    const prev = el("img", { alt:"" });
    const cap = el("input", { type:"text", maxlength:"80", id:"peCap", placeholder:"For example: Traditional rose, forearm" });
    const feat = el("input", { type:"checkbox", id:"peFeat" });
    let featLabel;
    const msg = el("div", { class:"pe-msg", role:"status" });
    const bSave = el("button", { class:"pe-btn big", type:"button", text:"Save" });
    const bCancel = el("button", { class:"pe-btn ghost", type:"button", text:"Cancel" });
    const bDel = el("button", { class:"pe-btn danger", type:"button", text:"Delete photo" });
    const ov = el("div", { class:"pe-overlay", role:"dialog", "aria-modal":"true" }, [el("div", { class:"pe-box" }, [
      title, sub, prev,
      el("label", { class:"lbl", for:"peCap", text:"Caption (optional)" }), cap,
      featLabel = el("label", { class:"pe-check" }, [feat, document.createTextNode("⭐ Favorite — show this photo first")]),
      msg, el("div", { class:"pe-actions" }, [bDel, el("div", { class:"grp" }, [bCancel, bSave])])
    ])]);
    document.body.appendChild(ov);
    let cur = null, confirmDel = false;
    function close(){ ov.classList.remove("open"); cur = null; confirmDel = false; bDel.textContent = "Delete photo"; }
    ov.addEventListener("click", e => { if(e.target === ov) close(); });
    document.addEventListener("keydown", e => { if(e.key === "Escape") close(); });
    bCancel.addEventListener("click", close);

    API.edit = async p => {
      cur = Object.assign({ artist: PAGE_ARTIST }, p); confirmDel = false; bDel.textContent = "Delete photo"; say(msg, "");
      prev.src = cur.file; cap.value = cur.caption || ""; feat.checked = false;
      title.textContent = IS_GALLERY ? "Edit this photo (" + (NAMES[cur.artist] || cur.artist) + ")" : "Edit this photo";
      featLabel.style.display = IS_GALLERY ? "none" : "";
      ov.classList.add("open"); setTimeout(() => cap.focus(), 50);
      // look up what is saved: Favorite starts unchecked unless it was chosen before
      const want = cur;
      const { data: row } = await sb.from("portfolio_photos").select("caption,featured").eq("artist_id", want.artist).eq("src", want.file).maybeSingle();
      let flag = row ? !!row.featured : false;
      if(!row && IS_GALLERY){ const j = await starterJson(); const sp = (j[want.artist] || []).find(x => x.file === want.file); flag = !!(sp && sp.featured); }
      if(cur === want){
        want.featured = flag; feat.checked = IS_GALLERY ? false : flag;
        if(p.caption === undefined){ want.caption = row ? row.caption : ""; cap.value = want.caption; }
      }
    };

    bSave.addEventListener("click", async () => {
      if(!cur) return;
      bSave.disabled = true; say(msg, "Saving…");
      const { error } = await sb.from("portfolio_photos").upsert(
        { artist_id: cur.artist, src: cur.file, caption: cap.value.trim(), featured: IS_GALLERY ? !!cur.featured : feat.checked, hidden: false },
        { onConflict: "artist_id,src" });
      bSave.disabled = false;
      if(error){ say(msg, "Sorry, that didn't save (" + error.message + ")."); return; }
      close(); await refresh(); flash("Saved ✓");
    });

    bDel.addEventListener("click", async () => {
      if(!cur) return;
      const isStarter = (await starters(cur.artist)).has(cur.file);
      if(!confirmDel){
        confirmDel = true; bDel.textContent = "Yes, delete it";
        say(msg, isStarter ? "This takes the photo off the website." : "This deletes the photo for good.");
        return;
      }
      bDel.disabled = true; say(msg, "Deleting…");
      let error = null;
      if(isStarter){
        ({ error } = await sb.from("portfolio_photos").upsert(
          { artist_id: cur.artist, src: cur.file, caption: cur.caption || "", featured: !!cur.featured, hidden: true },
          { onConflict: "artist_id,src" }));
      } else {
        const { data: row } = await sb.from("portfolio_photos").select("id,storage_path").eq("artist_id", cur.artist).eq("src", cur.file).maybeSingle();
        if(row && row.storage_path) await sb.storage.from(BUCKET).remove([row.storage_path]);
        ({ error } = await sb.from("portfolio_photos").delete().eq("artist_id", cur.artist).eq("src", cur.file));
      }
      bDel.disabled = false;
      if(error){ say(msg, "Sorry, that didn't work (" + error.message + ")."); return; }
      close(); await refresh(); flash("Photo deleted ✓");
    });

    /* ----- the bottom bar ----- */
    const tip = el("div", { class:"pe-tip" });
    const defaultTip = () => { tip.textContent = ""; tip.style.display = "none"; };
    let flashTimer = null;
    function flash(t){ tip.textContent = t; tip.style.display = ""; clearTimeout(flashTimer); flashTimer = setTimeout(defaultTip, 4000); }
    defaultTip();

    const file = el("input", { type:"file", accept:"image/jpeg,image/png,image/webp", multiple:"multiple", style:"display:none;" });
    const pick = el("select", { class:"pe-select", "aria-label":"Which artist to add the photo to" });
    ["tj","ariana","freddy"].filter(canEditArtist).forEach(id => pick.appendChild(el("option", { value:id, text:"For " + NAMES[id] })));
    if(ownId && canEditArtist(ownId)) pick.value = ownId;
    if(!IS_GALLERY) pick.style.display = "none";
    const bAdd = el("button", { class:"pe-btn big", type:"button", text:"➕ Add photo" });
    const bar = el("div", { class:"pe-bar" }, [tip, el("div", { class:"pe-row" }, [pick, bAdd]), file]);
    bar.style.cssText = "left:auto;right:14px;bottom:14px;transform:none;width:auto;max-width:300px;padding:8px 10px;border-width:2px;gap:8px;";
    if(pick.options.length < 2) pick.style.display = "none";
    document.body.appendChild(bar);

    /* ----- the Manage button at the top: turns editing on/off ----- */
    async function setMode(on, redraw){
      API.on = on;
      if(topSwitch) topSwitch.setAttribute("aria-checked", String(on));
      bar.style.display = on ? "flex" : "none";
      
      try{ sessionStorage.setItem("eiManage", on ? "1" : "0"); }catch(e){}
      if(slideBtn) slideBtn.style.display = on ? "block" : "none";
      if(on) defaultTip(); else close();
      if(redraw !== false) await refresh();
    }

    bAdd.addEventListener("click", () => file.click());
    file.addEventListener("change", async () => {
      const files = [...file.files]; file.value = ""; if(!files.length) return;
      const tgt = PAGE_ARTIST || pick.value;
      bAdd.disabled = true; let ok = 0, fail = 0, lastErr = "", lastSrc = null;
      for(let i = 0; i < files.length; i++){
        tip.textContent = "Adding photo " + (i + 1) + " of " + files.length + "… please wait";
        try{
          const blob = await toJpeg(files[i], 1600);
          const path = tgt + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
          const up = await sb.storage.from(BUCKET).upload(path, blob, { contentType:"image/jpeg", cacheControl:"31536000" });
          if(up.error) throw up.error;
          const pub = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
          const ins = await sb.from("portfolio_photos").insert({ artist_id: tgt, src: pub, storage_path: path });
          if(ins.error){ await sb.storage.from(BUCKET).remove([path]); throw ins.error; }
          ok++; lastSrc = pub;
        }catch(err){ fail++; lastErr = err.message || String(err); }
      }
      bAdd.disabled = false;
      await refresh();
      if(fail){ flash(ok + " added, " + fail + " didn't work (" + lastErr + ")"); return; }
      flash(ok === 1 ? "Photo added ✓" : ok + " photos added ✓");
      // one photo: open it right away so a caption can be added
      if(ok === 1 && lastSrc) API.edit({ file:lastSrc, artist:tgt, caption:"", featured:false });
    });


    /* ----- slideshow editor (homepage, managers only) ----- */
    let slideBtn = null;
    if(IS_GALLERY && isManager && document.getElementById("spotFrame")){
      slideBtn = el("button", { type:"button", class:"pe-slide-edit", text:"✎ Edit slideshow" });
      slideBtn.style.cssText = "position:absolute;top:10px;right:10px;z-index:5;background:#d4a94f;color:#221c14;border:0;font:700 13px 'Libre Franklin',sans-serif;padding:7px 12px;cursor:pointer;display:none;";
      const fr = document.getElementById("spotFrame"); fr.style.position = fr.style.position || "relative"; fr.appendChild(slideBtn);
      let rows = [], removed = [], sov = null, listEl, smsg, sSave;
      const draw = () => {
        listEl.innerHTML = "";
        rows.forEach((r, i) => {
          const th = el("img", { src:r.img, alt:"" }); th.style.cssText = "width:84px;height:64px;object-fit:cover;margin:0;flex-shrink:0;";
          const t = el("input", { type:"text", placeholder:"Title", value:r.title || "" }); t.style.marginBottom = "6px";
          t.addEventListener("input", () => r.title = t.value);
          const x = el("input", { type:"text", placeholder:"Short description", value:r.text || "" }); x.style.marginBottom = "8px";
          x.addEventListener("input", () => r.text = x.value);
          const up = el("button", { type:"button", class:"pe-btn ghost small", text:"↑" }), dn = el("button", { type:"button", class:"pe-btn ghost small", text:"↓" });
          const ph = el("button", { type:"button", class:"pe-btn ghost small", text:"Change photo" }), rm = el("button", { type:"button", class:"pe-btn danger small", text:"Remove" });
          up.disabled = i === 0; dn.disabled = i === rows.length - 1;
          up.addEventListener("click", () => { [rows[i-1], rows[i]] = [rows[i], rows[i-1]]; draw(); });
          dn.addEventListener("click", () => { [rows[i+1], rows[i]] = [rows[i], rows[i+1]]; draw(); });
          rm.addEventListener("click", () => { if(rm.dataset.sure !== "1"){ rm.dataset.sure = "1"; rm.textContent = "Yes, remove"; return; } if(r.storage_path) removed.push(r.storage_path); if(r.id) r._del = true; if(r.id) removedIds.push(r.id); rows.splice(i, 1); draw(); });
          ph.addEventListener("click", () => pickFile(async f => {
            smsg.textContent = "Uploading photo…";
            try{
              const blob = await toJpeg(f, 2000);
              const path = "slides/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
              const u = await sb.storage.from(BUCKET).upload(path, blob, { contentType:"image/jpeg", cacheControl:"31536000" });
              if(u.error) throw u.error;
              if(r.storage_path) removed.push(r.storage_path);
              r.img = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; r.storage_path = path; r.fit = null; smsg.textContent = ""; draw();
            }catch(err){ smsg.textContent = err.message || "That photo didn't work."; }
          }));
          listEl.appendChild(el("div", { style:"border:1px solid #443a2c;padding:12px;margin-bottom:12px;" }, [
            el("div", { style:"display:flex;gap:12px;align-items:flex-start;margin-bottom:8px;" }, [th, el("div", { style:"flex:1;min-width:0;" }, [t, x])]),
            el("div", { class:"pe-row", style:"justify-content:flex-start;" }, [up, dn, ph, rm])]));
        });
      };
      let removedIds = [];
      const sfile = el("input", { type:"file", accept:"image/jpeg,image/png,image/webp", style:"display:none;" });
      let onFile = null;
      sfile.addEventListener("change", () => { const f = sfile.files[0]; sfile.value = ""; if(f && onFile) onFile(f); });
      const pickFile = cb => { onFile = cb; sfile.click(); };
      async function openSlides(){
        addStyles();
        if(!sov){
          listEl = el("div"); smsg = el("div", { class:"pe-msg", role:"status" });
          const add = el("button", { type:"button", class:"pe-btn ghost", text:"➕ Add a slide" });
          const cancel = el("button", { type:"button", class:"pe-btn ghost", text:"Cancel" });
          sSave = el("button", { type:"button", class:"pe-btn big", text:"Save" });
          sov = el("div", { class:"pe-overlay", role:"dialog", "aria-modal":"true" }, [el("div", { class:"pe-box", style:"max-width:560px;" }, [
            el("h3", { text:"Edit slideshow" }), el("p", { class:"sub", text:"Change the pictures and words in the homepage Spotlight. Use the arrows to reorder." }),
            listEl, add, el("div", { style:"height:14px;" }), smsg, el("div", { class:"pe-actions" }, [cancel, sSave]), sfile])]);
          document.body.appendChild(sov);
          cancel.addEventListener("click", () => sov.classList.remove("open"));
          add.addEventListener("click", () => pickFile(async f => {
            smsg.textContent = "Uploading photo…";
            try{
              const blob = await toJpeg(f, 2000);
              const path = "slides/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
              const u = await sb.storage.from(BUCKET).upload(path, blob, { contentType:"image/jpeg", cacheControl:"31536000" });
              if(u.error) throw u.error;
              rows.push({ img: sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, storage_path:path, title:"", text:"", link:"", link_text:"" }); smsg.textContent = ""; draw();
            }catch(err){ smsg.textContent = err.message || "That photo didn't work."; }
          }));
          sSave.addEventListener("click", async () => {
            sSave.disabled = true; smsg.textContent = "Saving…";
            try{
              if(removedIds.length){ const d = await sb.from("site_slides").delete().in("id", removedIds); if(d.error) throw d.error; }
              for(let i = 0; i < rows.length; i++){
                const r = rows[i];
                const rec = { position:i, img:r.img, storage_path:r.storage_path || null, fit:r.fit || null, title:(r.title || "").trim(), text:(r.text || "").trim(), link:r.link || "", link_text:r.link_text || "" };
                const q = r.id ? sb.from("site_slides").update(rec).eq("id", r.id) : sb.from("site_slides").insert(rec);
                const res = await q; if(res.error) throw res.error;
              }
              if(removed.length) await sb.storage.from(BUCKET).remove(removed);
              sov.classList.remove("open"); if(window.EISlides) await window.EISlides.reload(); flash("Slideshow saved ✓");
            }catch(err){ smsg.textContent = "Sorry, that didn't save (" + (err.message || err) + ")."; }
            sSave.disabled = false;
          });
        }
        smsg.textContent = "Loading…"; removed = []; removedIds = []; sov.classList.add("open");
        const { data, error } = await sb.from("site_slides").select("*").order("position", { ascending:true });
        if(error){ smsg.textContent = "Couldn't load the slideshow (" + error.message + "). Has supabase_slides.sql been run?"; return; }
        rows = (data && data.length) ? data.map(d => Object.assign({}, d)) : (window.EISlideDefaults || []).map(d => ({ img:d.img, fit:d.fit || null, title:d.title, text:d.text, link:d.link, link_text:d.linkText }));
        smsg.textContent = ""; draw();
      }
      slideBtn.addEventListener("click", e => { e.stopPropagation(); openSlides(); });
    }

    switchHandler = on => setMode(on);
    await setMode(startOn, startOn); // off: plain site, nothing extra on screen. on: draw Edit tags.
  }
})();
