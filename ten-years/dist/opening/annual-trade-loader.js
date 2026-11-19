const tradeIntro = document.querySelector('#trade-intro');
const chart = document.querySelector('#annual-trade');
const observer = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) loadAnnualTrade();
}, { rootMargin: '100% 0px' });

function loadAnnualTrade() {
  observer.disconnect();
  import('./annual-trade.js?v=chapter-reveal').catch(error => {
    const fallback = document.createElement('p');
    fallback.className = 'opening-trade-status';
    fallback.append('The annual trade charts could not load. ');
    const link = document.createElement('a');
    link.href = '../project.html#annual-trade';
    link.textContent = 'Open the standalone charts';
    fallback.append(link);
    chart.replaceChildren(fallback);
    console.error(error);
  });
}

if (['#trade-intro', '#annual-trade', '#product-forms'].includes(location.hash)) {
  loadAnnualTrade();
} else {
  observer.observe(tradeIntro);
  observer.observe(chart);
}
