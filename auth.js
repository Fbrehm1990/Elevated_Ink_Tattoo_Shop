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
  /* ---------- header "Staff menu" link ---------- */
  function mountMenu(container, current){
    if(!container) return;
    container.classList.add("ea-menu");
    const a = el("a", { href:"staff.html", class:"ea-menu-btn", text:"Staff menu" });
    a.style.textDecoration = "none";
    container.appendChild(a);
    const show = s => container.classList.toggle("show", !!s);
    sb.auth.getSession().then(({ data }) => { show(data.session); });
    sb.auth.onAuthStateChange((_evt, session) => { show(session); });
  }

  window.ArtistAuth = {
    init(client){ sb = client; },
    mountMenu
  };
})();
