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
          say(msg, "Signed in!", true); location.reload();
        }catch(err){ go.disabled = false; say(msg, err.message || "Something went wrong."); }
      }
      go.addEventListener("click", submit);
      pw.addEventListener("keydown", e => { if(e.key === "Enter") submit(); });
    }
    signInOv.classList.add("open");
    setTimeout(() => document.getElementById("peEmail").focus(), 50);
  }
  const link = document.getElementById("staffSignIn");
  if(link){
    if(hasSession){ link.style.display = "none"; }
    else { addStyles(); link.classList.add("staff-link"); link.addEventListener("click", e => { e.preventDefault(); openSignIn(); }); }
  }

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
    document.body.classList.add("pe-on");
    const API = window.EIEdit = { on:true, canEdit: canEditArtist };

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
    const msg = el("div", { class:"pe-msg", role:"status" });
    const bSave = el("button", { class:"pe-btn big", type:"button", text:"Save" });
    const bCancel = el("button", { class:"pe-btn ghost", type:"button", text:"Cancel" });
    const bDel = el("button", { class:"pe-btn danger", type:"button", text:"Delete photo" });
    const ov = el("div", { class:"pe-overlay", role:"dialog", "aria-modal":"true" }, [el("div", { class:"pe-box" }, [
      title, sub, prev,
      el("label", { class:"lbl", for:"peCap", text:"Caption (optional)" }), cap,
      el("label", { class:"pe-check" }, [feat, document.createTextNode("⭐ Favorite — show this photo first")]),
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
      prev.src = cur.file; cap.value = cur.caption || ""; feat.checked = !!cur.featured;
      title.textContent = IS_GALLERY ? "Edit this photo (" + (NAMES[cur.artist] || cur.artist) + ")" : "Edit this photo";
      ov.classList.add("open"); setTimeout(() => cap.focus(), 50);
      if(p.caption === undefined){ // opened from the homepage gallery: look up what is saved
        const want = cur;
        const { data: row } = await sb.from("portfolio_photos").select("caption,featured").eq("artist_id", want.artist).eq("src", want.file).maybeSingle();
        let featured = row ? row.featured : false;
        if(!row){ const j = await starterJson(); const sp = (j[want.artist] || []).find(x => x.file === want.file); featured = !!(sp && sp.featured); }
        if(cur === want){ want.caption = row ? row.caption : ""; want.featured = featured; cap.value = want.caption; feat.checked = featured; }
      }
    };

    bSave.addEventListener("click", async () => {
      if(!cur) return;
      bSave.disabled = true; say(msg, "Saving…");
      const { error } = await sb.from("portfolio_photos").upsert(
        { artist_id: cur.artist, src: cur.file, caption: cap.value.trim(), featured: feat.checked, hidden: false },
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
    const defaultTip = () => { tip.innerHTML = ""; tip.append(
      document.createTextNode(API.on ? "You are editing. " : "Editing is paused. "),
      el("b", { text: API.on ? "Tap any photo marked Edit to change or delete it." : "Press \"Start editing\" to change photos." }));
    };
    let flashTimer = null;
    function flash(t){ tip.textContent = t; clearTimeout(flashTimer); flashTimer = setTimeout(defaultTip, 4000); }
    defaultTip();

    const file = el("input", { type:"file", accept:"image/jpeg,image/png,image/webp", multiple:"multiple", style:"display:none;" });
    const pick = el("select", { class:"pe-select", "aria-label":"Which artist to add the photo to" });
    Object.keys(NAMES).filter(canEditArtist).forEach(id => pick.appendChild(el("option", { value:id, text:"For " + NAMES[id] })));
    if(ownId && canEditArtist(ownId)) pick.value = ownId;
    if(!IS_GALLERY) pick.style.display = "none";
    const bAdd = el("button", { class:"pe-btn big", type:"button", text:"➕ Add a photo" });
    const bBio = el("a", { class:"pe-btn ghost small", href: isManager ? "portfolio-manager.html?manage=1" : "portfolio-manager.html", text:"Edit bio" });
    if(IS_GALLERY) bBio.style.display = "none";
    const bMode = el("button", { class:"pe-btn ghost small", type:"button", text:"Stop editing" });
    const bOut = el("button", { class:"pe-btn ghost small", type:"button", text:"Sign out" });
    document.body.appendChild(el("div", { class:"pe-bar" }, [tip, el("div", { class:"pe-row" }, [pick, bAdd]), el("div", { class:"pe-row" }, [bBio, bMode, bOut]), file]));

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
    bMode.addEventListener("click", async () => {
      API.on = !API.on; bMode.textContent = API.on ? "Stop editing" : "Start editing"; defaultTip(); await refresh();
    });
    bOut.addEventListener("click", async () => { await sb.auth.signOut(); location.reload(); });

    await refresh(); // re-draw so photos get their Edit tags
  }
})();
