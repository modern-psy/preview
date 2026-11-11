import {readFile, writeFile} from 'node:fs/promises';
const here = new URL('./', import.meta.url);
const atoms = JSON.parse(await readFile(new URL('data/source-atoms.json', here)));
const records = JSON.parse(await readFile(new URL('data/source-records.json', here)));
const row = id => atoms.find(r => r.id === id);
const texts = id => row(id).atoms.filter(a => a.type === 'text').sort((a,b) => Math.abs(a.y-b.y)<16?a.x-b.x:a.y-b.y);
const images = id => records.find(r => r.id === id).images;
const pairs = id => {
  const ts = texts(id), result = [];
  for (const x of [...new Set(ts.map(t=>t.x))]) {
    const column=ts.filter(t=>t.x===x);
    for(let i=0;i<column.length;i+=2)result.push({title:column[i].text,body:column[i+1]?.html||'',x,y:column[i].y});
  }
  return result.sort((a,b)=>Math.abs(a.y-b.y)<4?a.x-b.x:a.y-b.y);
};
const intro = texts('rec780869673');
const foundation = pairs('rec780889143').map((item,i)=>({...item,image:images('rec780889143')[i]?.src}));
const benefitImages=JSON.parse(await readFile(new URL('data/benefit-images.json',here)));
const benefits = pairs('rec780898902').map(item=>({...item,image:benefitImages.find(im=>Math.abs(im.y-item.y)<16&&Math.abs(im.x-(item.x-88))<4)?.src}));
const standards = texts('rec1943313511');
const international = texts('rec1944630111');
const outcomeTexts = texts('rec1944686531');
const outcomeImages = row('rec1944686531').atoms.filter(a=>a.type==='image');
const programs = [
  ['rec1945603281','rec1945605591'],['rec1945607171','rec1945607431'],['rec1945609441','rec1945613561'],['rec1945626921','rec1945626961'],['rec1945630161','rec1945630611']
];
// В исходнике третий модуль имеет несколько подблоков; сохраняем их все.
const thirdContent = atoms.filter(r=>r.atoms.some(a=>a.text.includes('Модуль 3.'))).map(r=>r.id);
const program = programs.map(([head,body],i)=>({number:i+1,head:texts(head),body:i===2?thirdContent.map(id=>({id,texts:texts(id)})):[{id:body,texts:row(body)?texts(body):[]}]}));
// Точные ID скрытых раскрытий берём из порядка исходной страницы, без обрезания тем.
for (const item of program) {
  if (!item.body.some(b=>b.texts.length)) {
    const headIndex=atoms.findIndex(r=>r.id===programs[item.number-1][0]);
    const next=atoms.slice(headIndex+1).find(r=>r.atoms.some(a=>a.type==='text'&&/^1[. ]/.test(a.text)));
    if(next)item.body=[{id:next.id,texts:texts(next.id)}];
  }
}
const teacherIds=['rec780981927','rec781039647','rec781044014','rec1111341456','rec1958751401','rec1958761001','rec1958766551','rec2429227641'];
const teachers=teacherIds.map(id=>({name:texts(id)[0].text,bio:texts(id)[1].html,image:images(id)[0].src}));
const reviewAtoms=row('rec1219754591').atoms;
const reviews=reviewAtoms.filter(a=>a.type==='video').sort((a,b)=>a.x-b.x).map((a,i)=>({video:a.video,poster:images('rec1219754591')[i]?.src,name:reviewAtoms.find(t=>t.type==='text'&&t.x===a.x+16&&t.y===477)?.text||'',body:reviewAtoms.find(t=>t.type==='text'&&t.x===a.x+16&&t.y===525)?.html||''}));
const why=texts('rec1853593881');
const whyCards=why.filter(a=>[108,368].includes(a.y)).map(a=>({title:a.text,body:why.find(t=>t.x===a.x&&t.y>a.y)?.html||''}));
const payment=pairs('rec781058269').map((item,i)=>({...item,image:images('rec781058269')[i].src}));
const data={source:'https://modern-psy.ru/act',captured:'2026-10-13',intro:{title:intro[0].text,body:intro[1].html,cards:foundation},community:{title:texts('rec780892608')[0].text,body:texts('rec780892608')[1].html,videos:row('rec780892608').atoms.filter(a=>a.type==='video').sort((a,b)=>a.x-b.x).map(a=>a.video)},benefits:{title:texts('rec780898308')[0].text,cards:benefits},standards:{title:texts('rec1943214821')[0].text,quote:standards[0].html,statement:standards[1].html,intro:standards.find(a=>a.x===32&&a.y===212).html,cards:standards.filter(a=>a.x>=464&&[236,353].includes(a.y)).map(a=>({title:a.text,body:standards.find(t=>t.x===a.x&&t.y===a.y+42)?.html||''})),questionImage:images('rec1943313511')[0].src,logo:images('rec1943313511')[1].src,international:{title:international[0].text,body:international[1].html,note:international[2].html,image:images('rec1944630111')[0].src}},outcomes:{title:outcomeTexts[0].text,cards:outcomeTexts.slice(1).map(a=>({body:a.html,image:outcomeImages.find(im=>Math.abs(im.x-a.x)<2&&im.y<a.y)?.src||outcomeImages[0].src}))},program:{title:texts('rec781058490')[0].text,description:texts('rec781058490')[1].html,modules:program},teachers:{title:texts('rec780981825')[0].text,description:texts('rec780981825')[1].html,items:teachers},diploma:{texts:texts('rec781044635'),image:images('rec781044635')[0].src},reviews:{title:texts('rec781044565')[0].text,items:reviews},why:{title:why[0].text,cards:whyCards},payment,faq:{heading:records.find(r=>r.id==='rec781058308').texts[0].text,items:row('rec781058331').faq},trialImage:'https://static.tildacdn.com/tild3262-6630-4038-a263-393061343030/b158c7afae390960dd97.png'};
await writeFile(new URL('data/content.json',here),JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({foundation:foundation.length,benefits:benefits.length,standards:data.standards.cards.length,outcomes:data.outcomes.cards.length,modules:program.map(m=>({number:m.number,parts:m.body.map(b=>b.id),texts:m.body.reduce((n,b)=>n+b.texts.length,0)})),teachers:teachers.length,reviews:reviews.length,videos:data.community.videos,faq:data.faq.items.length},null,2));
