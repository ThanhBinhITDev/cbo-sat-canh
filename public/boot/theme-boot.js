(function(){try{
var o=localStorage.getItem('cbosc.theme.override');
if(!o)return;
var t=JSON.parse(o),r=document.documentElement.style,m={
primary:'--brand-primary',dark:'--brand-dark',ink:'--brand-ink',
surface:'--brand-surface',muted:'--brand-muted',accent:'--brand-accent',
line:'--brand-line'};
Object.keys(m).forEach(function(k){if(typeof t[k]==='string')r.setProperty(m[k],t[k]);});
if(typeof t.radius==='number')r.setProperty('--brand-radius',t.radius+'px');
if(typeof t.fontScale==='number')r.setProperty('--brand-font-scale',String(t.fontScale));
}catch(e){}})();
