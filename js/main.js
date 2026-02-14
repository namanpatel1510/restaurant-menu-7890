document.addEventListener('DOMContentLoaded', () => {
  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  document.querySelectorAll('.menu-item').forEach((item, idx) => {
    const id = item.dataset.id || `item-${idx+1}`;
    const card = item.querySelector('.flip-card');
    const inner = card && card.querySelector('.flip-card-inner');
    const back = item.querySelector('.flip-card-back');
    const ingredients = (item.dataset.ingredients||'').split(',').map(s=>s.trim()).filter(Boolean);
    const ul = back && back.querySelector('.ingredients ul');
    if(ul){ ingredients.forEach(ing=>{ const li=document.createElement('li'); li.textContent=ing; ul.appendChild(li); }); }

    // initialize order count
    const storageKey = `orders:${id}`;
    const countSpan = item.querySelector('.count');
    const orderBtn = item.querySelector('.order-btn');
    let count = parseInt(localStorage.getItem(storageKey)||'0',10);
    if(countSpan) countSpan.textContent = count;
    if(orderBtn){ orderBtn.addEventListener('click', (e)=>{ e.stopPropagation(); count = (count||0)+1; localStorage.setItem(storageKey, String(count)); if(countSpan) countSpan.textContent = count; }); }

    // flip handlers + drag popup
    if(card && inner){
      function toggleFlip(){ inner.classList.toggle('is-flipped'); const pressed = inner.classList.contains('is-flipped'); card.setAttribute('aria-pressed', String(pressed)); }

      // drag/popup behavior on the front image (pointer events)
      const front = card.querySelector('.flip-card-front');
      const imgEl = front && front.querySelector('img');
      let dragState = { active:false, moved:false, pointerId:null, startX:0, startY:0 };

      function endDrag(){
        if(!imgEl) return;
        imgEl.classList.remove('img-popup');
        dragState.active = false; dragState.moved = false;
        if(card.dataset.dragging) delete card.dataset.dragging;
      }

      if(imgEl){
        imgEl.addEventListener('pointerdown', (e)=>{
          imgEl.setPointerCapture(e.pointerId);
          dragState.active = true; dragState.pointerId = e.pointerId; dragState.startX = e.clientX; dragState.startY = e.clientY; dragState.moved = false;
        });

        window.addEventListener('pointermove', (e)=>{
          if(!dragState.active || e.pointerId !== dragState.pointerId) return;
          const dx = e.clientX - dragState.startX; const dy = e.clientY - dragState.startY;
          if(!dragState.moved && Math.hypot(dx,dy) > 8){
            dragState.moved = true;
            imgEl.classList.add('img-popup');
            card.dataset.dragging = 'true';
          }
        });

        imgEl.addEventListener('pointerup', (e)=>{
          try{ imgEl.releasePointerCapture(e.pointerId); }catch(_){ }
          if(dragState.moved){ setTimeout(()=> endDrag(), 180); } else { endDrag(); }
        });
        imgEl.addEventListener('pointercancel', (e)=>{ try{ imgEl.releasePointerCapture(e.pointerId); }catch(_){ } endDrag(); });
      }

      card.addEventListener('click', (e)=>{
        // don't flip when interacting with controls or after dragging
        if(e.target.closest('.order-btn') || e.target.closest('.toggle-review-form') || e.target.closest('.review-form') || (e.target.closest('button') && !e.target.classList.contains('order-btn'))) return;
        if(card.dataset.dragging === 'true'){ delete card.dataset.dragging; return; }
        toggleFlip();
      });
      card.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggleFlip(); } });
    }

    // reviews
    const reviewsKey = `reviews:${id}`;
    const reviewsList = item.querySelector('.reviews-list');
    const avgSpan = item.querySelector('.avg-rating');
    const revCountSpan = item.querySelector('.reviews-count');
    const form = item.querySelector('.review-form');
    const toggleBtn = item.querySelector('.toggle-review-form');

    function renderReviews(){
      const arr = JSON.parse(localStorage.getItem(reviewsKey)||'[]');
      reviewsList.innerHTML = '';
      if(!arr || arr.length===0){ if(avgSpan) avgSpan.textContent = '—'; if(revCountSpan) revCountSpan.textContent = '0'; return; }
      let sum = 0;
      arr.forEach(r=>{
        sum += Number(r.rating||0);
        const li = document.createElement('li');
        li.innerHTML = `<strong>${escapeHtml(r.name)}</strong> — <span class="review-rating">${escapeHtml(r.rating)}★</span><p>${escapeHtml(r.comment)}</p>`;
        reviewsList.appendChild(li);
      });
      if(avgSpan) avgSpan.textContent = (sum/arr.length).toFixed(1);
      if(revCountSpan) revCountSpan.textContent = arr.length;
    }

    renderReviews();

    if(toggleBtn && form){
      toggleBtn.addEventListener('click', (e)=>{ e.stopPropagation(); form.style.display = form.style.display==='none' || !form.style.display ? 'block' : 'none'; const input = form.querySelector('input[name=name]'); if(input) input.focus(); });
      form.addEventListener('submit', (e)=>{
        e.preventDefault(); e.stopPropagation(); const fd = new FormData(form); const review = { name: fd.get('name'), rating: fd.get('rating'), comment: fd.get('comment') }; const arr = JSON.parse(localStorage.getItem(reviewsKey)||'[]'); arr.unshift(review); localStorage.setItem(reviewsKey, JSON.stringify(arr)); form.reset(); form.style.display='none'; renderReviews(); });
    }
  });
});
