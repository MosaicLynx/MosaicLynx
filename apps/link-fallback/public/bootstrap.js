(() => {
  'use strict';
  const fragment = window.location.hash.slice(1);
  window.history.replaceState(null, '', window.location.pathname);
  const values = new URLSearchParams(fragment);
  const valid =
    [...values.keys()].sort().join(',') === 'a,s' &&
    /^[A-Za-z0-9_-]{43}$/.test(values.get('a') || '') &&
    /^[A-Za-z0-9_-]{43}$/.test(values.get('s') || '');
  values.delete('a');
  values.delete('s');
  const status = document.getElementById('status');
  if (status)
    status.textContent = valid
      ? 'Install MosaicLynx Testnet from the official App Store or Google Play listing, then start a new request from the dApp.'
      : 'This MosaicLynx handoff link is invalid or incomplete. Return to the dApp and start a new request.';
})();
