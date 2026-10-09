/* =========================================================
   Elevated Ink — shared artist account helpers
   Used by scheduler.html and portfolio-manager.html.

   Accounts are created by the shop owner in the Supabase dashboard
   (public sign-up is off), so this file only provides the "Menu"
   dropdown (Scheduler / My Portfolio / Change password / Sign out)
   that appears in the header once an artist is signed in.
   ========================================================= */
(function(){
  let sb = null;
  const css = `
  header nav.wrap{position:relative;}
  .ea-tabs{display:none; gap:34px; align-items:center; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); white-space:nowrap;}
  .ea-tabs.show{display:flex;}
  .ea-tab{font-family:'Libre Franklin',sans-serif; font-weight:600; font-size:14px; color:#b9ab8c; text-decoration:none; padding-bottom:4px; border-bottom:2px solid transparent; transition:color .2s;}
  .ea-tab:hover{color:#ece0c3; border-color:#c14a3a;}
  .ea-tab.current{color:#ece0c3; border-color:#c14a3a;}
  @media(max-width:820px){
    header nav.wrap{flex-wrap:wrap; height:auto !important; padding-top:10px; padding-bottom:0;}
    .ea-tabs{position:static; transform:none; order:3; flex:0 0 100%; justify-content:center; gap:40px; padding:10px 0 12px; margin-top:8px; border-top:1px solid #443a2c;}
  }
  .ea-menu{position:relative; display:none;}
  .ea-menu.show{display:block;}
  .ea-menu-btn{font-family:'Libre Franklin',sans-serif; font-weight:600; font-size:13px; background:transparent; color:#ece0c3; border:2px solid #ece0c3; padding:8px 14px; cursor:pointer; display:flex; gap:8px; align-items:center;}
  .ea-menu-btn:hover, .ea-menu-btn[aria-expanded="true"]{background:#ece0c3; color:#17130e;}
  .ea-menu-btn svg{width:10px; height:10px; fill:currentColor;}
  .ea-menu-list{position:absolute; right:0; top:calc(100% + 6px); min-width:230px; background:#221c14; border:2px solid #ece0c3; z-index:120; display:none; padding:6px 0;}
  .ea-menu-list.open{display:block;}
  .ea-menu-list a, .ea-menu-list button{display:block; width:100%; text-align:left; padding:11px 16px; font-family:'Libre Franklin',sans-serif; font-size:14px; font-weight:600; color:#ece0c3; background:none; border:0; text-decoration:none; cursor:pointer;}
  .ea-menu-list a:hover, .ea-menu-list button:hover{background:#443a2c;}
  .ea-menu-list a.current{color:#d4a94f;}
  .ea-menu-list small{display:block; font-weight:400; color:#b9ab8c; font-size:12px; margin-top:1px;}
  .ea-menu-list hr{border:0; border-top:1px solid #443a2c; margin:6px 0;}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function el(tag, attrs, children){
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => { if(k === "text") e.textContent = v; else e.setAttribute(k, v); });
    (children || []).forEach(c => e.appendChild(c));
    return e;
  }
  /* ---------- header dropdown ---------- */
  function mountMenu(container, current){
    if(!container) return;
    container.classList.add("ea-menu");
    const btn = el("button", { class:"ea-menu-btn", type:"button", "aria-haspopup":"true", "aria-expanded":"false" });
    btn.appendChild(document.createTextNode("Menu "));
    const svgNS = "http://www.w3.org/2000/svg", svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 10 10"); const poly = document.createElementNS(svgNS, "path"); poly.setAttribute("d", "M0 2 L10 2 L5 8 Z"); svg.appendChild(poly); btn.appendChild(svg);
    const list = el("div", { class:"ea-menu-list", role:"menu" });
    function item(href, title, sub, key){
      const a = el("a", { href, role:"menuitem" });
      a.appendChild(document.createTextNode(title));
      a.appendChild(el("small", { text:sub }));
      if(current === key) a.classList.add("current");
      return a;
    }
    list.appendChild(item("scheduler.html", "Scheduler", "Calendar, appointments, blocked time", "scheduler"));
    list.appendChild(item("portfolio-manager.html", "My Portfolio", "Upload, edit and remove photos", "portfolio"));
    list.appendChild(item("change-password.html", "Change password", "Choose your own password", "password"));
    list.appendChild(el("hr"));
    const so = el("button", { type:"button", role:"menuitem", text:"Sign out" });
    so.addEventListener("click", async () => { await sb.auth.signOut(); location.href = (current === "portfolio" ? "portfolio-manager.html" : "scheduler.html"); });
    list.appendChild(so);
    container.append(btn, list);
    function close(){ list.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    btn.addEventListener("click", e => { e.stopPropagation(); const o = list.classList.toggle("open"); btn.setAttribute("aria-expanded", o ? "true" : "false"); });
    document.addEventListener("click", e => { if(!container.contains(e.target)) close(); });
    document.addEventListener("keydown", e => { if(e.key === "Escape") close(); });
    const bar = el("div", { class:"ea-tabs" });
    [["scheduler.html","Scheduler","scheduler"],["portfolio-manager.html","My Portfolio","portfolio"]].forEach(([h,t,k]) => {
      const x = el("a", { href:h, class:"ea-tab", text:t }); if(current === k) x.classList.add("current"); bar.appendChild(x);
    });
    const nav = document.querySelector("header nav");
    if(nav) nav.appendChild(bar); else document.body.prepend(bar);
    const show = s => { container.classList.toggle("show", !!s); bar.classList.toggle("show", !!s); };
    sb.auth.getSession().then(({ data }) => show(data.session));
    sb.auth.onAuthStateChange((_evt, session) => show(session));
  }

  window.ArtistAuth = {
    init(client){ sb = client; },
    mountMenu
  };
})();
