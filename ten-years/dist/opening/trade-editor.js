export function openTradeEditor({stage, year, explanation, counter, update}) {
  const key = 'trade-summary-editor-v1';
  const targets = {year, number:counter, note:explanation};
  const names = {year:'年份', number:'中央数字', note:'统计说明'};
  let values = {};
  try { values = JSON.parse(localStorage.getItem(key)) || {}; } catch {}
  const panel = document.createElement('details');
  panel.id = 'trade-editor';
  panel.open = true;
  panel.innerHTML = '<summary>第四幕 · 排版调试</summary><div class="fields"></div><button type="button">恢复默认</button>';
  const style = document.createElement('style');
  style.textContent = `
    #trade-editor{position:fixed;z-index:50;top:10px;left:10px;padding:12px;width:min(235px,85vw);max-height:85vh;overflow:auto;background:#081b26f5;color:white;border:1px solid #7498a6;border-radius:10px;font:13px/1.4 system-ui}
    #trade-editor summary,#trade-editor button{cursor:pointer}#trade-editor fieldset{border:0;border-top:1px solid #47606c;margin:10px 0;padding:4px}
    #trade-editor legend{padding-right:6px}#trade-editor label{display:flex;align-items:center;justify-content:space-between;margin:4px 0}
    #trade-editor input{width:70px;box-sizing:border-box}#trade-editor button{padding:4px 12px}
  `;
  document.head.append(style);
  document.body.append(panel);
  const fields = panel.querySelector('.fields');
  function apply() {
    const size = values.numberSize ?? Math.min(innerWidth*.11,128);
    stage.dataset.editorSize = size;
    for(const [id, node] of Object.entries(targets)){
      const color = (values[id+'Color'] || '#edf7fb') +
        Math.round((values[id+'Alpha'] ?? (id==='year'?60:100))*2.55).toString(16).padStart(2,'0');
      if(id==='number') stage.dataset.editorColor=color;
      else {
        node.style.color=color;
        const sizeValue=values[id+'Size'] == null ? '' : values[id+'Size']+'px';
        node.style.setProperty(id==='note'?'--note-size':'font-size',sizeValue);
      }
    }
    const upperGap = values.yearGap ?? 8;
    const lowerGap = values.noteGap ?? 32;
    year.style.bottom='calc(50% + '+(size*.56+upperGap)+'px)';
    explanation.style.top='calc(50% + '+(size*.56+lowerGap)+'px)';
    update();
  }
  function build(){
    fields.replaceChildren();
    for(const [id,node] of Object.entries(targets)){
      const group=document.createElement('fieldset');
      const legend=document.createElement('legend');legend.textContent=names[id];group.append(legend);
      function input(suffix,title,type,fallback,min,max){
        const prop=id+suffix,label=document.createElement('label'),control=document.createElement('input');
        label.textContent=title;control.type=type;
        if(type==='number'){control.min=min;control.max=max;control.step='1'}
        control.value=values[prop]??fallback;
        control.oninput=()=>{
          if(!control.value||!control.validity.valid)return;
          values[prop]=type==='number'?Number(control.value):control.value;
          try{localStorage.setItem(key,JSON.stringify(values))}catch{}
          apply();
        };
        label.append(control);group.append(label);
      }
      input('Size','字号（px）','number',Math.round(parseFloat(getComputedStyle(node).fontSize)),1,320);
      input('Color','颜色','color','#edf7fb');
      input('Alpha','不透明度（%）','number',id==='year'?60:100,0,100);
      if(id!=='number'){
        const box=node.getBoundingClientRect(),digits=counter.getBoundingClientRect();
        input('Gap','与数字间距（px）','number',Math.round(id==='year'?digits.top-box.bottom:box.top-digits.bottom),-100,360);
      }
      fields.append(group);
    }
  }
  apply();build();
  panel.querySelector('button').onclick=()=>{
    values={};try{localStorage.removeItem(key)}catch{}
    apply();build();
  };
  addEventListener('resize',()=>{apply();build()});
}
