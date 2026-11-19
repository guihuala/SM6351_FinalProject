// Product disclosures and museum examples are independent of the CITES extract.
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = value => new Intl.NumberFormat('en').format(value);
const asset = key => globalThis.__marineAsset ? globalThis.__marineAsset(key) : `./${key}`;

export const PRODUCT_CASES = Object.freeze([
  {
    id:'perfume', risk:'VU', species:'Physeter macrocephalus', candidateID:'41755', commonName:'Sperm whale',
    product:'Love Lotus perfume', type:'PERFUMERY', material:'Natural ambergris',
    image:'assets/products/love-lotus-bottle.png', imageClass:'bottle',
    alt:'Love Lotus bottle illustration derived from the maker’s product photograph',
    heading:'Ambergris in perfume',
    description:'Bariberry lists natural ambergris in Love Lotus and describes sperm whales as its source.',
    evidence:'Brand declaration', sourcing:'The maker says it uses only beach-cast ambergris.',
    note:'The ingredient and source animal are the maker’s statements, not independent tests of this bottle. CITES excludes naturally excreted ambergris; this perfume is not linked to a shipment in this study.',
    source:'https://www.bariberry.jp/blog/archives/28060', sourceLabel:'Brand product explanation',
    sources:[
      {label:'Love Lotus product information',url:'https://www.bariberry.com/view/item/000000000368'},
      {label:'Brand explanation of the ingredient and source animal',url:'https://www.bariberry.jp/blog/archives/28060'},
      {label:'Brand statement on beach-cast sourcing',url:'https://www.bariberry.jp/ryuzenko/'},
      {label:'CITES Conf. 9.6: naturally excreted ambergris (p. 145)',url:'https://cites.org/sites/default/files/documents/E-SC78-Inf-16.pdf'}
    ]
  },
  {
    id:'unagi', risk:'EN', species:'Anguilla japonica', candidateID:'166184', commonName:'Japanese eel',
    product:'Yutaka unagi kabayaki', type:'PREPARED FOOD', material:'Eel',
    image:'assets/products/unagi-kabayaki.webp', imageClass:'unagi',
    alt:'Official Yutaka Unagi Kabayaki 250g cream and orange frozen-food package',
    heading:'Japanese eel in kabayaki',
    description:'Yutaka lists Japanese eel as 70% of this prepared food.',
    evidence:'Manufacturer ingredient list', sourcing:'Its product page states: farmed and processed in China.',
    note:'The product page does not state the source of its juvenile stock. No Japanese-eel record was matched in this study’s 2015–2024 CITES extract; this does not establish an absence of trade.',
    source:'https://yutaka.london/products/frozen/frozen-unagi-kabayaki-250g/', sourceLabel:'Official ingredients',
    sources:[{label:'Yutaka ingredient list and farmed origin',url:'https://yutaka.london/products/frozen/frozen-unagi-kabayaki-250g/'}]
  },
  {
    id:'jewellery', risk:'CR', species:'Eretmochelys imbricata', candidateID:'8005', commonName:'Hawksbill turtle',
    product:'Tortoiseshell jewellery', type:'DECORATIVE OBJECTS', material:'Tortoiseshell',
    image:'assets/products/tortoiseshell-earrings-illustrative.png', imageClass:'earrings',
    alt:'Illustrative amber-brown tortoiseshell-type drop earrings; not a photograph of an authenticated object',
    heading:'Hawksbill shell in jewellery',
    description:'The Australian Museum shows bracelets and earrings made from hawksbill shell.',
    evidence:'Museum article and photographs', sourcing:'This image illustrates the documented object type.',
    note:'The earrings shown are an illustration, not a museum object or an authenticated product. Plastic jewellery with a tortoiseshell pattern is a different material.',
    source:'https://australian.museum/blog/amri-news/surrender-your-shell-using-dna-to-protect-the-hawksbill-turtle/', sourceLabel:'Museum article and photographs',
    sources:[{label:'Australian Museum: Surrender Your Shell',url:'https://australian.museum/blog/amri-news/surrender-your-shell-using-dna-to-protect-the-hawksbill-turtle/'}]
  }
]);

export const productForRisk = risk => PRODUCT_CASES.find(item => item.risk === risk);
export const productByID = id => PRODUCT_CASES.find(item => item.id === id);

export function validateProductCases(data, imageByName) {
  for (const item of PRODUCT_CASES) {
    const species = data.species.find(s => String(s.candidateID) === item.candidateID);
    if (!species || species.scientificName !== item.species || species.risk !== item.risk) {
      throw new Error(`Product source does not match the verified species list: ${item.id}`);
    }
    if (!imageByName.has(item.species)) throw new Error(`Missing source-species illustration: ${item.species}`);
  }
}

function productImage(item, miniature = false) {
  return `<span class="product-cutout product-cutout-${item.imageClass}${miniature?' product-cutout-mini':''}"><img src="${escape(asset(item.image))}" alt="${escape(item.alt)}" loading="lazy" decoding="async"></span>`;
}

export function productStoryHTML(group, imageByName) {
  const item = productForRisk(group.code), image = imageByName.get(item.species);
  const imageNote = item.id === 'jewellery' ? 'Illustration' : item.id === 'perfume' ? 'Illustration from the maker’s photograph' : '';
  const animal = `<img src="${escape(asset(image.file.replace(/^\.\//,'')))}" width="${image.width||600}" height="${image.height||400}" alt="${escape(item.commonName)} — scientific illustration" loading="lazy" decoding="async">`;
  const composition = item.id === 'unagi' ? `<div class="ingredient-composition"><div class="ingredient-labels"><span>Eel <strong>70%</strong></span><span>Other ingredients <strong>30%</strong></span></div><div class="ingredient-track" role="img" aria-label="Manufacturer-declared food ingredients: eel 70 percent, other ingredients 30 percent. This is not trade volume."><span class="ingredient-eel"></span><span class="ingredient-other"></span></div><p>Manufacturer-declared food composition.</p></div>` : '';
  return `<section class="product-story" id="product-${item.id}" data-product-case="${item.id}" aria-labelledby="product-title-${item.id}">
    <div class="product-story-heading"><p class="eyebrow">PRODUCT · MATERIAL · SOURCE SPECIES</p><h3 class="product-story-title" id="product-title-${item.id}">${escape(item.heading)}</h3></div>
    <div class="product-stage">
      <figure class="product-good"><button class="product-object" data-product-preview="${item.id}" aria-label="Read the source of ${escape(item.product)}">${productImage(item)}</button><figcaption><span class="product-kind">${item.type}</span><strong>${escape(item.product)}</strong>${imageNote?`<small class="product-image-note">${escape(imageNote)}</small>`:''}</figcaption></figure>
      <div class="product-material" aria-hidden="true"><span>${escape(item.material)}</span><i></i></div>
      <figure class="product-life product-life-${item.id}"><button class="product-animal" data-species="${item.candidateID}" aria-label="Explore ${escape(item.commonName)}, ${escape(group.label)}">${animal}</button><figcaption><strong>${escape(item.commonName)}</strong><em>${escape(item.species)}</em><span class="product-risk">${escape(group.label)}</span></figcaption></figure>
    </div>
    <div class="product-story-bottom"><div class="product-explanation"><p>${escape(item.description)}</p><p class="product-provenance">${escape(item.sourcing)}</p><button class="product-source-button" data-product-preview="${item.id}" aria-label="Read the evidence for ${escape(item.product)}">${escape(item.evidence)}<span aria-hidden="true">+</span></button></div>${composition}</div>
  </section>`;
}

export function productConnectionsHTML(data) {
  return `<ul class="product-connections-rows">${PRODUCT_CASES.map(item => {
    const group = data.groups.find(g => g.code === item.risk);
    return `<li><a href="#product-${item.id}" class="product-connection-row" style="--connection-risk:${escape(group.color)}"><span class="connection-product">${productImage(item,true)}<span>${escape(item.product)}${item.id==='jewellery'?'<small>Illustration</small>':''}</span></span><span class="connection-material">${escape(item.material)}</span><span class="connection-species"><strong>${escape(item.commonName)}</strong><em>${escape(item.species)}</em><small>${escape(group.label)}</small></span></a></li>`;
  }).join('')}</ul><p class="product-connections-note">These product-origin examples are separate from the narrower CITES record shown below. They are not linked to individual shipments.</p>
  <div class="product-record-context"><div><h3>Entries with CITES records</h3><p>Recorded entries / all entries in this study</p></div><div class="product-record-bars" role="group" aria-label="Share of entries in this study with matched CITES records, by risk group">${data.groups.map(group => {
    const fraction = group.tradeCount / group.count;
    return `<div class="product-record-row" style="--connection-risk:${escape(group.color)}"><span>${escape(group.label)}</span><span class="product-record-track" role="img" aria-label="${escape(group.label)}: ${group.tradeCount} of ${group.count} entries in this study, ${(fraction*100).toFixed(1)} percent"><i style="width:${fraction*100}%"></i></span><span class="product-record-value">${number(group.tradeCount)} / ${number(group.count)}<small>${(fraction*100).toFixed(1)}%</small></span></div>`;
  }).join('')}</div><p class="product-record-scope">2015–2024 · Appendix I–III · All reported purposes, commercial and non-commercial. Entry counts, not trade quantities or brand sales.</p></div>`;
}

export function productPreviewHTML(item, group) {
  const citesSource = item.sources.find(source => source.url.startsWith('https://cites.org/'));
  return `<p class="popover-eyebrow">${escape(item.evidence.toUpperCase())}</p><span class="risk-badge" style="--risk:${escape(group.color)}">${escape(group.label)}</span><h3 id="popover-title">${escape(item.product)}</h3><p class="popover-scientific"><em>${escape(item.species)}</em></p><p class="product-popover-material">${escape(item.material)}</p><p class="popover-record">${escape(item.description)} ${escape(item.sourcing)}</p><p class="popover-footnote">${escape(item.note)}</p><a class="product-primary-source" href="${escape(item.source)}" target="_blank" rel="noopener">${escape(item.sourceLabel)}</a>${citesSource?`<a class="product-primary-source" href="${escape(citesSource.url)}" target="_blank" rel="noopener">${escape(citesSource.label)}</a>`:''}<button class="popover-action" data-open-details="${item.candidateID}">Species details &amp; sources</button>`;
}

export function productSourceCreditsHTML() {
  return PRODUCT_CASES.map(item => `<div class="product-credit-entry"><h4>${escape(item.product)} · ${escape(item.material)}</h4><p><em>${escape(item.species)}</em>. ${escape(item.description)} ${escape(item.sourcing)} ${escape(item.note)}</p><ul>${item.sources.map(source=>`<li><a href="${escape(source.url)}" target="_blank" rel="noopener">${escape(source.label)}</a></li>`).join('')}</ul></div>`).join('');
}
