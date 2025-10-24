import { API_BASE, getToken, isLoggedIn } from './main.js';

async function showConfirmation(){
  const el = document.getElementById('confirmation-details');
  const raw = localStorage.getItem('bookingConfirmation');
  if(!raw){
    el.innerHTML = '<div class="card">No confirmation data found.</div>';
    return;
  }
  const conf = JSON.parse(raw);
  el.innerHTML = `<div><strong>PNR:</strong> ${conf.pnr ?? 'N/A'}</div>
    <div style="margin-top:8px"><strong>Ticket ID:</strong> ${conf.ticketId}</div>`;
  // optionally fetch ticket details
  if (isLoggedIn() && conf.ticketId){
    try {
      const res = await fetch(`${API_BASE}/tickets/${encodeURIComponent(conf.ticketId)}`, {
        headers: { 'Authorization': 'Bearer ' + getToken() }
      });
      if (res.ok){
        const ticket = await res.json();
        el.innerHTML += `<pre style="margin-top:10px;background:#f8fafc;padding:10px;border-radius:8px">${JSON.stringify(ticket,null,2)}</pre>`;
      }
    } catch (err) {
      console.warn('Could not fetch detailed ticket', err);
    }
  }
  localStorage.removeItem('bookingConfirmation');
}

document.addEventListener('DOMContentLoaded', showConfirmation);