import { mkdir, writeFile } from 'node:fs/promises';
// Original vector pixel-art concept boards. These are review choices, not shipped sprite atlases.
const palettes=[['#09182b','#193954','#ffcd80','#ff688b','#72e5d6','#fff1d5'],['#242137','#555074','#eed7a7','#b74c67','#92c7bd','#faf2df'],['#111c37','#30577d','#ffdc66','#ed5a91','#a1e8ff','#ffffff']];
const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const text=(x,y,s,c='#fff1d5',size=8)=>`<text x="${x}" y="${y}" fill="${c}" font-size="${size}" font-family="monospace">${s}</text>`;
const path=(d,c)=>`<path d="${d}" fill="${c}"/>`;
function person(x,y,kind,v,p){let out='';const skin=kind==='trump'?'#ed9854':kind==='elephant'?'#a3a2b3':'#d8b194';out+=rect(x+8,y+4,16,19,skin)+rect(x+5,y,22,v===1?7:5,kind==='trump'?'#f4d057':kind==='worker'?'#bcdcca':'#574b49');out+=rect(x+3,y+23,26,23,kind==='elephant'?p[3]:p[1]);out+=rect(x+14,y+23,5,20,p[3]);out+=rect(x+5,y+46,8,13,p[1])+rect(x+20,y+46,8,13,p[1]);out+=rect(x+11,y+11,3,3,p[0])+rect(x+21,y+11,3,3,p[0]);if(kind==='elephant'){out+=rect(x,y+5,8,16,skin)+rect(x+25,y+5,8,16,skin)+rect(x+16,y+17,7,15,skin)}if(kind==='trump'){out+=rect(x,y+33,32,14,p[1])+rect(x+15,y+38,5,19,p[3]);if(v===2)out+=rect(x-10,y+10,12,21,skin)+rect(x+31,y+10,12,21,skin);}if(kind==='worker')out+=rect(x+8,y+27,17,17,p[4]);return out;}
function art(kind,v){const p=palettes[v];let o='';switch(kind){
case 'eagle':o+=path(v===1?'M18 42L36 15L57 33L82 12L101 29L72 48Z':'M12 24L41 34L65 30L96 17L84 39L61 54L35 46Z','#956947');o+=rect(57,23,22,17,p[5])+path('M79 28L94 34L79 38Z',p[2])+rect(70,28,3,3,p[0])+rect(49,49,29,16,p[2])+text(51,59,'FILES',p[0],6);break;
case 'files':o+=rect(24,15,58,42,p[5])+rect(20,24,66,41,p[2])+rect(20,18,27,8,p[2])+text(25,37,'EPSTEIN',p[0],8)+text(25,47,'FILES',p[0],8);o+=v===1?rect(27,51,47,5,p[0]):rect(28,54,27,3,p[3]);break;
case 'elephant':o+=person(40,6,v===1?'senator':'elephant',v,p)+rect(29,67,54,8,p[2])+text(33,73,v===1?'SENATOR':'GOP',p[0],6);break;
case 'hanging':o+=rect(20,0,76,12,p[2])+`<g transform="translate(0 73) scale(1 -1)">${person(40,10,'elephant',v,p)}</g>`;break;
case 'plaque':o+=rect(15,22,90,32,v===1?p[3]:v===2?p[0]:p[2])+rect(18,25,3,3,p[5])+rect(98,25,3,3,p[5])+text(27,41,'REAL NAME',v===0?p[0]:p[5],9);break;
case 'trump':o+=person(42,8,'trump',v,p)+rect(7,29,29,27,'#ed9854')+rect(79,29,29,27,'#ed9854');for(let i=0;i<4;i++)o+=rect(7+i*7,18-i%2*3,5,15,'#ed9854')+rect(79+i*7,18-i%2*3,5,15,'#ed9854');break;
case 'burger':o+=path('M30 32L36 22L46 17H72L83 23L89 32Z',p[2])+rect(29,34,61,5,p[4])+rect(31,40,58,9,'#70432f')+rect(30,51,59,10,p[2]);if(v===2)o+=rect(33,46,55,4,p[3]);if(v===1)o+=path('M23 40L36 52H86L96 39L88 70H30Z',p[3]);o+=rect(45,23,3,2,p[5])+rect(63,21,3,2,p[5]);break;
case 'crowd':o+=person(14,12,'worker',v,p)+person(48,5,'person',v,p)+person(81,12,'worker',v,p);if(v===1)o+=rect(17,49,91,11,p[2])+rect(22,60,5,12,p[2])+rect(96,60,5,12,p[2]);break;
case 'skyline':o+=rect(10,42,25,31,p[1])+rect(43,28,36,45,p[1])+path('M38 29L61 12L84 29Z',p[5])+rect(91,33,17,40,p[1]);for(let x=49;x<77;x+=8)o+=rect(x,35,4,31,p[2]);break;
case 'traveler':o+=person(42,8,'person',v,p)+rect(30,31,12,18,p[4])+rect(68,31,10,18,p[2]);break;
case 'factions':o+=`<g transform="translate(0 8) scale(.72)">${person(7,4,'person',v,p)}${person(46,4,'worker',v,p)}${person(85,4,'person',v,[...p.slice(0,1),'#526a4c',...p.slice(2)])}${person(124,4,'person',v,p)}</g>`+text(8,67,'BP  ICE  PM  CT',p[5],8);break;
case 'billboard':o+=rect(11,3,99,61,p[1])+`<g transform="translate(4 2) scale(.7)">${person(19,4,'trump',v,p)}${person(94,4,'person',v,p)}</g>`+rect(20,64,6,13,p[2])+rect(94,64,6,13,p[2])+text(15,59,'TRUMP / VANCE',p[5],8);break;
case 'tiles':for(let y=0;y<3;y++)for(let x=0;x<3;x++)o+=path(`M${58+(x-y)*16} ${12+(x+y)*9}l16 9 -16 9 -16 -9Z`,(x+y)%2?p[1]:p[4]);if(v===1)o+=rect(48,19,20,25,p[2]);break;
case 'office':o+=rect(25,27,70,47,p[1])+path(v===1?'M20 27L60 4L100 27Z':'M19 21H101V32H19Z',p[2])+rect(52,48,18,26,p[4])+rect(30,36,14,13,p[5])+rect(78,36,12,13,p[5])+text(25,19,'ASYLUM OFFICE',p[5],8);break;
case 'water':o+=rect(48,19,25,47,p[4])+rect(53,10,15,9,p[5])+rect(51,35,19,15,p[5]);break;
case 'distraction':o+=rect(21,24,30,24,p[3])+path('M51 24L79 9V66L51 48Z',p[2])+rect(28,48,10,21,p[1])+text(84,23,'!',p[5],18);break;
case 'clash':for(const [x,y,w,h]of[[21,34,76,25],[29,23,56,43],[13,39,93,14]])o+=rect(x,y,w,h,p[5]);o+=text(34,47,v===1?'?!':'POOF',p[3],13)+rect(17,12,5,5,p[2])+rect(94,16,5,5,p[2]);break;
case 'convoy':o+=`<g transform="translate(2 15) scale(.7)">${person(0,14,'worker',v,p)}${person(39,14,'person',v,p)}${person(78,2,'person',v,p)}${person(117,2,'person',v,p)}</g>`;break;
case 'welcome':o+=rect(23,28,74,45,p[1])+path('M15 30L60 3L107 30Z',p[2])+rect(48,44,24,29,p[4])+text(28,41,'WELCOME',p[5],8);break;
case 'float':o+=path('M8 49H109L95 67H22Z',p[2])+`<g transform="translate(27 -2) scale(.8)">${person(24,3,'trump',v,p)}</g>`+rect(14,69,92,4,p[4]);break;
case 'tape':o+=rect(7,24,105,22,p[3])+text(14,38,v===1?'PENDING':'RED TAPE',p[5],10)+rect(14,47,5,23,p[2])+rect(100,47,5,23,p[2]);break;
case 'aid':o+=rect(27,28,66,41,p[2])+path('M34 29L46 13H74L88 29Z',p[4])+rect(54,35,12,27,p[5])+rect(46,43,29,11,p[5]);break;
case 'crew':o+=person(20,9,'worker',v,p)+person(68,9,'worker',v,p);break;
case 'crate':o+=rect(22,22,74,47,p[2])+rect(22,22,74,9,p[1])+text(33,50,v===0?'SCHOOL':v===1?'CLINIC':'PANTRY',p[0],10);break;
case 'sleeve':o+=rect(19,19,80,49,p[2])+rect(17,27,84,27,p[3])+text(26,44,v===0?'TRUMP':v===1?'MARKUP':'VIP',p[5],12);break;
case 'gate':o+=rect(13,18,91,36,p[1])+text(20,41,v===0?'SCHOOL >':v===1?'CLINIC >':'PANTRY >',p[5],10)+rect(56,54,8,19,p[2]);break;
case 'belt':o+=rect(5,30,110,24,p[1]);for(let x=9;x<116;x+=12)o+=rect(x,33,2,18,p[4]);o+=rect(19,18,21,16,p[2])+rect(72,16,24,18,p[3]);break;
case 'bell':o+=path('M30 49L38 39V28L46 17H72L82 28V39L89 49Z',p[2])+rect(53,50,13,11,p[2])+rect(57,11,6,6,p[5]);break;
case 'net':o+=path('M14 25H109L95 67H28Z',p[4]);for(let x=22;x<108;x+=14)o+=path(`M${x} 27l9 38h-3l-9 -38Z`,p[1]);o+=rect(13,21,98,5,p[2]);break;
case 'tower':o+=rect(36,15,50,59,p[2])+rect(28,11,66,9,p[2])+rect(50,1,21,11,p[2]);for(let y=26;y<67;y+=16)for(let x=43;x<84;x+=17)o+=rect(x,y,9,8,p[0]);break;
case 'resources':o+=rect(9,27,29,30,p[3])+rect(23,27,2,30,p[5])+rect(48,26,27,31,p[4])+rect(59,30,6,22,p[5])+rect(51,38,22,6,p[5])+path('M90 25H109V42H100V62H92V39H85V25Z',p[2]);break;
case 'promise':o+=path('M36 14H80L90 24V44L79 54H38L28 43V25Z',p[2])+text(32,37,'PROMISE',p[0],9)+rect(58,54,3,20,p[5]);break;
case 'scissors':o+=path('M21 19L89 64L94 57L26 12ZM24 64L91 17L86 10L19 57Z',p[5])+rect(57,32,7,7,p[3]);break;
case 'services':o+=rect(9,32,30,41,p[4])+rect(45,20,30,53,p[3])+rect(81,36,30,37,p[2])+text(13,51,'EDU',p[0],8)+text(48,39,'CARE',p[0],8)+text(84,56,'HOME',p[0],8);break;
default:o+=rect(25,20,70,44,p[4]);}
return o;}
const sheets={
'flappy-files':[['Eagle courier','eagle'],['Epstein Files packet','files'],['Named GOP obstacle','elephant'],['Top-column hanging pose','hanging'],['Name plaque','plaque'],['Trump distraction / hands','trump'],['Hamburger pickup','burger'],['Public recipients','crowd'],['National Mall backdrop','skyline']],
'against-the-wall':[['Adult traveler','traveler'],['Four pursuer factions','factions'],['Named billboard','billboard'],['Isometric cover tiles','tiles'],['Asylum intake office','office'],['Water pickup','water'],['Distraction token','distraction'],['Confusion fight cloud','clash']],
'rio-rescue':[['Volunteer and convoy','convoy'],['Welcome center','welcome'],['Trump photo-op float','float'],['Vance red-tape barrier','tape'],['Mutual aid pickup','aid'],['People arriving','crowd']],
'supply-the-people':[['Cooperative crew','crew'],['Destination crates','crate'],['Branded sleeve','sleeve'],['Destination gates','gate'],['Conveyor belt','belt'],['Collective bargaining bell','bell'],['Political cameo panels','billboard']],
 'trickle-down-tycoon':[['Community safety net','net'],['Promise tower','tower'],['Books / care / home resources','resources'],['Empty promise target','promise'],['Budget scissors','scissors'],['Growing public services','services'],['Trump publicity cameo','trump']],
};
await mkdir('assets/concepts',{recursive:true});
for(const[slug,rows]of Object.entries(sheets)){
 const height=160+rows.length*132;
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${height}" viewBox="0 0 960 ${height}" shape-rendering="crispEdges">${rect(0,0,960,height,'#091426')}${text(26,38,slug.toUpperCase().replaceAll('-',' '),'#72e5d6',24)}${text(26,65,'ORIGINAL PIXEL CONCEPT OPTIONS / REVIEW SHEET','#c3c9d8',12)}${text(26,87,'Fictional satire. Options are concept drawings, not finished animation atlases.','#91a1bb',11)}`;
 for(let v=0;v<3;v++)svg+=text(265+v*225,122,['A — ARCADE','B — PAPER SATIRE','C — CHUNKY CARTOON'][v],'#ffcd80',13);
 rows.forEach(([label,kind],i)=>{const y=145+i*132;svg+=rect(20,y,920,119,i%2?'#13243b':'#102036')+text(32,y+36,label,'#e9e7db',12)+text(32,y+57,`${slug.slice(0,2).toUpperCase()}-${String(i+1).padStart(2,'0')}`,'#879db7',11);for(let v=0;v<3;v++)svg+=`<g transform="translate(${268+v*225} ${y+8}) scale(1.35)">${art(kind,v)}</g>`});
 svg+='</svg>';await writeFile(`assets/concepts/${slug}.svg`,svg);
}
console.log('Wrote five original SVG art-choice sheets (37 asset families, three options each).');
