'use client'
import {useEffect,useMemo,useState} from 'react'
import {LineChart,Line,BarChart,Bar,XAxis,YAxis,Tooltip,Legend,ResponsiveContainer,CartesianGrid} from 'recharts'

// ---------- Types ----------
type Profile={goalKm:number;goalTimeSec:number;runsPerWeek:number;notify:boolean}
type Kind='Facile'|'Tempo'|'Fractionné'|'Sortie longue'
type Step={title:string;duration:string;pace:string;hr:string}
type Session={id:string;index:number;kind:Kind;detail:string;distance:number;targetDistance:number;durationSec:number;hrZone:[number,number];paceZone:[number,number];avgPaceZone?:[number,number];date:string;steps?:Step[]}
type Target={distance:number;durationSec:number;hrZone:[number,number];paceZone:[number,number];avgPaceZone?:[number,number]}
type Overrides={[id:string]:{date?:string;loggedId?:string;skipped?:boolean;target?:Target}}
type Run={id:string;date:string;distance:number;durationSec:number;avgHR?:number;elevation?:number;temperature?:string;sessionId?:string|null;label?:string;kind?:Kind}
type Mark='ok'|'warn'|'ko'|'none'
type Verdict={status:'Réussie'|'Partielle'|'Échouée';score:number;factors:string[];marks:{dist:Mark;pace:Mark;hr:Mark}}
type RenfoEvent={id:string;date:string}

// ---------- Zones cardiaques personnelles (issues de ton historique) ----------
const ZONES={Z1:[134,148] as [number,number],Z2:[148,162] as [number,number],Z3:[162,171] as [number,number],Z4:[171,178] as [number,number],Z5:[178,189] as [number,number]}

// ---------- Historique réel (importé une fois, modifiable ensuite) ----------
const RAW_HISTORY:any[]=[{date:'2026-05-25',type:'',distance:2.0,duration:'00:44:02',avgHR:167,temperature:'22°'},{date:'2026-07-08',type:'',distance:3.0,duration:'00:20:22',avgHR:167,temperature:'21°'},{date:'2026-07-29',type:'',distance:3.2,duration:'00:22:09',avgHR:164,temperature:'24°'},{date:'2026-04-12',type:'',distance:4.2,duration:'00:30:01',avgHR:171,temperature:'5°'},{date:'2026-04-06',type:'',distance:4.5,duration:'00:30:07',avgHR:174,temperature:'15°'},{date:'2026-02-28',type:'',distance:5.0,duration:'00:43:37',avgHR:164,temperature:'8°'},{date:'2026-03-02',type:'',distance:5.0,duration:'00:38:01',avgHR:171,temperature:'6°'},{date:'2026-03-16',type:'',distance:5.0,duration:'00:42:05',avgHR:168,temperature:'8°'},{date:'2026-04-13',type:'',distance:5.0,duration:'00:35:01',avgHR:176,temperature:'6°'},{date:'2026-04-17',type:'',distance:5.0,duration:'00:33:51',avgHR:174,temperature:'8°'},{date:'2026-04-27',type:'',distance:5.0,duration:'00:34:10',avgHR:172,temperature:'10°'},{date:'2026-05-02',type:'',distance:5.0,duration:'00:33:39',avgHR:173,temperature:'14°'},{date:'2026-05-03',type:'',distance:5.0,duration:'00:34:03',avgHR:171,temperature:'13°'},{date:'2026-05-10',type:'',distance:5.0,duration:'00:36:26',avgHR:168,temperature:'14°'},{date:'2026-06-03',type:'',distance:5.0,duration:'00:37:27',avgHR:173,temperature:'17°'},{date:'2026-06-10',type:'',distance:5.0,duration:'00:35:52',avgHR:174,temperature:'11°'},{date:'2026-06-11',type:'',distance:5.0,duration:'00:34:22',avgHR:170,temperature:'16°'},{date:'2026-06-13',type:'',distance:5.0,duration:'00:34:07',avgHR:176,temperature:'17°'},{date:'2026-06-15',type:'',distance:5.0,duration:'00:33:49',avgHR:172,temperature:'27°'},{date:'2026-06-20',type:'',distance:5.0,duration:'00:34:39',avgHR:173,temperature:'21°'},{date:'2026-07-01',type:'',distance:5.0,duration:'00:31:01',avgHR:175,temperature:'15°'},{date:'2026-07-18',type:'',distance:5.0,duration:'00:33:48',avgHR:177,temperature:'19°'},{date:'2026-07-22',type:'',distance:5.0,duration:'00:35:00',avgHR:174,temperature:'16°'},{date:'2026-08-14',type:'',distance:5.0,duration:'00:37:21',avgHR:173,temperature:'25°'},{date:'2026-03-04',type:'',distance:5.3,duration:'00:39:48',avgHR:171,temperature:'7°'},{date:'2026-03-18',type:'',distance:5.4,duration:'00:45:15',avgHR:176,temperature:'8°'},{date:'2026-04-08',type:'',distance:5.7,duration:'00:40:02',avgHR:175,temperature:'9°'},{date:'2026-04-20',type:'',distance:5.7,duration:'00:38:45',avgHR:174,temperature:'7°'},{date:'2026-06-26',type:'',distance:6.0,duration:'00:46:35',avgHR:167,temperature:'26°'},{date:'2026-07-24',type:'',distance:6.0,duration:'00:42:55',avgHR:174,temperature:'15°'},{date:'2026-03-30',type:'',distance:6.1,duration:'00:44:41',avgHR:173,temperature:'8°'},{date:'2026-03-08',type:'',distance:6.2,duration:'00:43:19',avgHR:166,temperature:'7°'},{date:'2026-03-01',type:'',distance:6.3,duration:'00:50:05',avgHR:164,temperature:'5°'},{date:'2026-04-01',type:'',distance:6.5,duration:'00:46:04',avgHR:178,temperature:'9°'},{date:'2026-06-06',type:'',distance:6.5,duration:'00:47:06',avgHR:175,temperature:'15°'},{date:'2026-03-07',type:'',distance:6.7,duration:'00:53:54',avgHR:170,temperature:'10°'},{date:'2026-03-23',type:'',distance:6.9,duration:'00:44:11',avgHR:174,temperature:'8°'},{date:'2026-04-29',type:'',distance:7.0,duration:'00:49:21',avgHR:176,temperature:'13°'},{date:'2026-06-04',type:'',distance:7.0,duration:'00:53:21',avgHR:174,temperature:'14°'},{date:'2026-04-15',type:'',distance:7.7,duration:'00:55:02',avgHR:176,temperature:'8°'},{date:'2026-06-22',type:'',distance:8.0,duration:'01:03:05',avgHR:162,temperature:'25°'},{date:'2026-06-24',type:'',distance:8.0,duration:'01:02:06',avgHR:169,temperature:'27°'},{date:'2026-07-07',type:'',distance:8.0,duration:'00:59:02',avgHR:160,temperature:'20°'},{date:'2026-07-17',type:'',distance:8.0,duration:'01:02:39',avgHR:169,temperature:'18°'},{date:'2026-07-27',type:'',distance:12.0,duration:'01:29:47',avgHR:164,temperature:'21°'},{date:'2026-08-08',type:'',distance:8.0,duration:'01:01:12',avgHR:176,temperature:'16°'},{date:'2026-05-06',type:'',distance:8.2,duration:'01:01:45',avgHR:162,temperature:'9°'},{date:'2026-03-25',type:'',distance:8.7,duration:'00:59:22',avgHR:175,temperature:'7°'},{date:'2026-05-04',type:'',distance:9.0,duration:'01:00:02',avgHR:170,temperature:'13°'},{date:'2026-07-02',type:'',distance:9.0,duration:'01:08:23',avgHR:158,temperature:'15°'},{date:'2026-04-25',type:'',distance:10.0,duration:'01:14:33',avgHR:167,temperature:'9°'},{date:'2026-05-08',type:'',distance:10.0,duration:'01:14:50',avgHR:162,temperature:'12°'},{date:'2026-05-31',type:'',distance:10.0,duration:'01:18:08',avgHR:168,temperature:'16°'},{date:'2026-06-08',type:'',distance:10.0,duration:'01:20:33',avgHR:173,temperature:'15°'},{date:'2026-06-17',type:'',distance:10.0,duration:'01:17:46',avgHR:169,temperature:'20°'},{date:'2026-08-12',type:'',distance:10.0,duration:'01:26:55',avgHR:158,temperature:'21°'},{date:'2026-08-17',type:'',distance:10.0,duration:'01:19:19',avgHR:168,temperature:'20°'},{date:'2026-06-14',type:'',distance:12.2,duration:'01:38:24',avgHR:158,temperature:'16°'},{date:'2026-07-19',type:'',distance:15.0,duration:'01:58:01',avgHR:164,temperature:'15°'},{date:'2026-08-19',type:'EF',distance:5.3,duration:'00:45:00',avgHR:160,temperature:'20°'},{date:'2026-08-21',type:'Qualité fractionné',distance:3.74,duration:'00:31:00',avgHR:158,temperature:'15°'},{date:'2026-08-23',type:'Longue',distance:8.28,duration:'01:10:00',avgHR:155,temperature:'15°'},{date:'2026-08-24',type:'EF',distance:5.2,duration:'00:45:00',avgHR:157,temperature:'16°'},{date:'2026-08-29',type:'Qualité',distance:4.43,duration:'00:33:30',avgHR:163,temperature:'16°'},{date:'2026-08-30',type:'Longue',distance:7.93,duration:'01:05:00',avgHR:156,temperature:'17°'},{date:'2026-09-01',type:'EF',distance:5.69,duration:'00:45:00',avgHR:156,temperature:'14°'},{date:'2026-09-02',type:'Qualité',distance:4.14,duration:'00:31:00',avgHR:161,temperature:'15°'},{date:'2026-09-05',type:'Longue',distance:8.43,duration:'01:10:00',avgHR:156,temperature:'14°'}]

function seedRuns():Run[]{
  return RAW_HISTORY.map((h,i)=>({id:`seed-${i}`,date:h.date,distance:h.distance,durationSec:parseDur(h.duration),avgHR:h.avgHR||undefined,temperature:h.temperature||undefined,sessionId:null,label:h.type||undefined}))
}

// ---------- Helpers ----------
const WEEKS=26 // 6 mois, comme ton plan d’entraînement
const PROGRAM_START='2026-09-07'
function pace2(sec:number){const s=Math.max(0,Math.round(sec));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
function dur(sec:number){const s=Math.max(0,Math.round(sec));const h=Math.floor(s/3600);const m=Math.floor((s%3600)/60);const ss=s%60;return h>0?`${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`:`${m}:${String(ss).padStart(2,'0')}`}
function minSec(sec:number){const s=Math.max(0,Math.round(sec));const m=Math.floor(s/60);const ss=s%60;return ss===0?`${m}’`:`${m}’${String(ss).padStart(2,'0')}`}
function distanceRange(km:number){return `${round1(km*0.92)}–${round1(km*1.08)} km`}
function parseDur(v:string){const parts=v.split(':').map(x=>Number(x.trim())||0);if(parts.length===3)return parts[0]*3600+parts[1]*60+parts[2];if(parts.length===2)return parts[0]*60+parts[1];return Number(v)||0}
function isoWeekStart(base:Date,weekOffset:number,dayOfWeek:number){const d=new Date(base);const cur=d.getDay()||7;d.setDate(d.getDate()-(cur-1)+weekOffset*7+(dayOfWeek-1));return d.toISOString().slice(0,10)}
function nextMonday(from:Date){const d=new Date(from);const cur=d.getDay()||7;if(cur!==1)d.setDate(d.getDate()+(8-cur));return d}
function round1(n:number){return Math.round(n*10)/10}
function roundHalfUp(n:number){return Math.ceil(n*2)/2}
function roundNearestHalf(n:number){return Math.round(n*2)/2}
function lerp(a:number,b:number,t:number){return a+(b-a)*t}

// ---------- Calibrage du programme (historique + données Garmin : séances du 14/10 au 11/11/2026) ----------
// Allures de repli (sec/km) si on n’a pas encore assez de séances de ce type : médianes réelles (Garmin Forerunner 965).
// Sortie longue : allure ramenée à 9 km (voir LONG_DRIFT).
const BASE_PACE:Record<Kind,number>={'Facile':495,'Sortie longue':529,'Tempo':450,'Fractionné':438}
// Objectif « gagner en vitesse progressivement » : sec/km gagnées par semaine sur les semaines à venir.
// Séances de qualité plus vite que l’endurance (qui, elle, est limitée par la FC). Gelé si l’allure est en recul (voir paceTrend).
const GAIN_PER_WEEK:Record<Kind,number>={'Facile':1,'Sortie longue':1,'Tempo':2,'Fractionné':1.5}
const LONG_START=8.5 // première sortie longue du programme
// Dérive cardiaque en sortie longue (FC plafonnée ≈150 bpm) : ≈ +15 s/km par km au-delà de 9 km (8:44 à 9 km, 8:53 à 9,5 km, 9:08 à 10 km)
const LONG_REF=9,LONG_DRIFT=15
// Fractionné — structure réelle relevée sur ta montre : 12 × 3' / 1'30 (54 min, ≈7,4 km). On varie ensuite le format pour développer la vitesse :
// 3'/1'30 (référence, refait en semaine 10 et 25 pour mesurer le progrès), 4'/2' (seuil), 2'/1' (rapide), 5'/2'30 (seuil long).
const INTERVALS=[
  {reps:12,eff:180,rec:90,f:0.92},{reps:12,eff:180,rec:90,f:0.92},{reps:12,eff:180,rec:90,f:0.92},
  {reps:12,eff:180,rec:90,f:0.92},{reps:8,eff:240,rec:120,f:0.935},{reps:15,eff:120,rec:60,f:0.90},
  {reps:10,eff:180,rec:90,f:0.92},{reps:6,eff:300,rec:150,f:0.95},{reps:12,eff:180,rec:90,f:0.92}
]

function median(arr:number[]){if(!arr.length)return NaN;const s=[...arr].sort((a,b)=>a-b);const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2}

// 🏷️ Type d’une course : enregistré, sinon déduit de la séance liée, sinon de l’étiquette de l’historique
function kindOfRun(r:Run):Kind|null{
  if(r.kind)return r.kind
  if(r.sessionId){
    const m=/^w(\d+)-(easy|long|work)/.exec(r.sessionId)
    if(m){if(m[2]==='easy')return 'Facile';if(m[2]==='long')return 'Sortie longue';return Number(m[1])%3===1?'Fractionné':'Tempo'}
  }
  const l=(r.label||'').toLowerCase().trim()
  if(!l)return null
  if(l.includes('tempo'))return 'Tempo'
  if(l.includes('fraction')||l.includes('qual'))return 'Fractionné'
  if(l.includes('long'))return 'Sortie longue'
  if(l==='ef'||l.startsWith('ef ')||l.includes('facile'))return 'Facile'
  return null
}

// Allure d’une sortie longue ramenée à 9 km (pour comparer des sorties de longueurs différentes à FC égale)
const longNorm=(r:Run)=>r.durationSec/r.distance-LONG_DRIFT*(r.distance-LONG_REF)

// 📚 Courses utilisables pour calibrer un type de séance, de la plus récente à la plus ancienne
function runsOfKind(history:Run[],kind:Kind){
  return history.filter(r=>r.distance>=(kind==='Sortie longue'?8:3)&&r.durationSec>0&&kindOfRun(r)===kind).sort((a,b)=>b.date.localeCompare(a.date))
}

// ⏱️ Allure de référence par type = médiane de tes dernières sorties de ce type (borne ±12 % autour du repli pour éviter une saisie aberrante)
function anchorPace(history:Run[],kind:Kind){
  const n=kind==='Sortie longue'?4:kind==='Fractionné'||kind==='Tempo'?3:6
  const paces=runsOfKind(history,kind).slice(0,n).map(r=>kind==='Sortie longue'?longNorm(r):r.durationSec/r.distance)
  const base=BASE_PACE[kind]
  if(!paces.length)return base
  const m=paces.length>=3?median(paces):(median(paces)+base)/2 // peu de données → on mélange avec le repli
  return Math.min(base*1.12,Math.max(base*0.88,m))
}

// 📈 Tendance d’allure à effort comparable : moyenne des 2 dernières séances − moyenne des 2 précédentes (sec/km ; > 0 = en recul). null si < 4 séances.
function paceTrend(history:Run[],kind:Kind):number|null{
  const rs=runsOfKind(history,kind).slice(0,4).map(r=>kind==='Sortie longue'?longNorm(r):r.durationSec/r.distance)
  if(rs.length<4)return null
  return (rs[0]+rs[1])/2-(rs[2]+rs[3])/2
}
const HOLD_THRESHOLD=10 // au-delà de +10 s/km de recul, on consolide au lieu d’accélérer

function buildProgram(profile:Profile,history:Run[]):Session[]{
  const start=new Date(`${PROGRAM_START}T00:00:00`)
  const days=profile.runsPerWeek>=5?[1,2,4,5,6]:profile.runsPerWeek===4?[1,3,5,6]:[2,4,6]
  const KINDS:Kind[]=['Facile','Sortie longue','Tempo','Fractionné']
  const anchor={} as Record<Kind,number>
  const hold={} as Record<Kind,boolean>
  KINDS.forEach(k=>{anchor[k]=anchorPace(history,k);const t=paceTrend(history,k);hold[k]=t!==null&&t>HOLD_THRESHOLD})
  // Semaine (index) de la dernière séance réalisée : le gain d’allure ne s’applique qu’aux semaines à venir
  const weekIdx=(iso:string)=>Math.floor((new Date(`${iso}T00:00:00`).getTime()-start.getTime())/(7*864e5))
  const wLast=Math.min(WEEKS-1,Math.max(0,history.filter(r=>r.date>=PROGRAM_START).reduce((m,r)=>Math.max(m,weekIdx(r.date)),0)))
  const paceFor=(k:Kind,w:number)=>anchor[k]-(hold[k]?0:GAIN_PER_WEEK[k])*Math.max(0,w-wLast)
  const deload=(w:number)=>w%4===3 // 4ᵉ semaine de chaque bloc = semaine allégée
  const longCap=Math.max(LONG_START,Math.min(12,Math.round(profile.goalKm*1.1*2)/2))
  const longDistOf=(w:number)=>{const lvl=Math.min(longCap,LONG_START+0.5*Math.floor(w/3));return deload(w)?Math.max(6,lvl-1.5):lvl}
  const easyDistOf=(w:number)=>Math.min(6.5,5.5+0.5*Math.floor((w+2)/6))-(deload(w)?0.5:0) // 5,5 → 6 → 6,5 km (tu cours déjà ~6 km en facile)
  const tempoDistOf=(w:number)=>Math.max(3,Math.min(6,4.5+0.5*Math.floor(w/4))-(deload(w)?0.5:0))
  const out:Omit<Session,'index'>[]=[]
  for(let w=0;w<WEEKS;w++){
    const isInterval=w%3===1
    const easyA=paceFor('Facile',w)
    days.forEach((dow,i)=>{
      const date=isoWeekStart(start,w,dow)
      const easySession=(id:string)=>{
        const dist=easyDistOf(w);const lo=Math.round(easyA-15),hi=Math.round(easyA+25)
        out.push({id,kind:'Facile',detail:'💛 Endurance fondamentale : tu dois pouvoir parler sans t’essouffler.',distance:dist,targetDistance:dist,durationSec:dist*(lo+hi)/2,hrZone:[148,160],paceZone:[lo,hi],date})
      }
      if(i===days.length-1){
        const dist=longDistOf(w)
        const ap=paceFor('Sortie longue',w)+LONG_DRIFT*(dist-LONG_REF) // l’allure tient compte de la distance (dérive cardiaque)
        const lo=Math.round(ap-15),hi=Math.round(ap+25)
        out.push({id:`w${w}-long`,kind:'Sortie longue',detail:'🌿 Construire l’endurance : allure calme, contrôlée, sans forcer. La FC prime sur l’allure.',distance:dist,targetDistance:dist,durationSec:dist*(lo+hi)/2,hrZone:ZONES.Z1,paceZone:[lo,hi],date})
      }else if(i===0){
        easySession(`w${w}-easy`)
      }else if(i>1){
        easySession(`w${w}-easy${i}`)
      }else if(isInterval){
        const apAvg=paceFor('Fractionné',w)
        const p=INTERVALS[Math.min(INTERVALS.length-1,Math.floor((w-1)/3))]
        const effPace=apAvg*p.f
        const recPace=(apAvg*(p.eff+p.rec)-p.eff*effPace)/p.rec // la moyenne du bloc reste égale à ton allure de référence
        const mainSec=p.reps*(p.eff+p.rec)
        const effortDist=p.reps*p.eff/effPace
        const mainDist=round1(effortDist+p.reps*p.rec/recPace) // 🎯 distance du bloc "Fractionné" = l’objectif
        const avg=mainSec/mainDist
        const effortLow=Math.round(effPace-12),effortHigh=Math.round(effPace+8)
        const warmup=600,cooldown=480
        const mainHRlow=ZONES.Z4[0],mainHRhigh=ZONES.Z5[0]
        const ea=anchor['Facile']
        // 🎯 Objectif = le bloc "Fractionné" (temps, km, bpm moyen). Échauffement/retour au calme restent indicatifs.
        out.push({id:`w${w}-work`,kind:'Fractionné',detail:`⚡️ ${p.reps}x ${minSec(p.eff)} soutenue / ${minSec(p.rec)} facile`,distance:mainDist,targetDistance:round1(effortDist),durationSec:mainSec,hrZone:[164,174],paceZone:[effortLow,effortHigh],avgPaceZone:[Math.round(avg-10),Math.round(avg+15)],
          steps:[
            {title:`🟡 Échauffement (indicatif) · ${dur(warmup)}`,duration:dur(warmup),pace:`${pace2(ea-5)}–${pace2(ea+30)}`,hr:`${ZONES.Z1[0]}–${ZONES.Z2[0]}`},
            {title:`⚡️ Fractionné · ${p.reps}x ${minSec(p.eff)} soutenue / ${minSec(p.rec)} facile · ${mainDist} km`,duration:dur(mainSec),pace:`${pace2(effortLow)}–${pace2(effortHigh)} à l’effort`,hr:`${mainHRlow}–${mainHRhigh} à l’effort`},
            {title:`🟢 Retour au calme (indicatif) · ${dur(cooldown)}`,duration:dur(cooldown),pace:`${pace2(ea+5)}–${pace2(ea+40)}`,hr:`${ZONES.Z1[0]}–${ZONES.Z2[0]}`}
          ],date})
      }else{
        const ap=paceFor('Tempo',w);const mainLow=Math.round(ap-12),mainHigh=Math.round(ap+12)
        const mainDist=tempoDistOf(w) // 🎯 étape "Tempo" seule = l’objectif
        const mainSec=Math.round(mainDist*ap)
        const warmupSec=600,cooldownSec=360
        const ea=anchor['Facile']
        out.push({id:`w${w}-work`,kind:'Tempo',detail:`🔥 ${mainDist} km à allure tempo. Échauffement et retour au calme ci-dessous à titre indicatif.`,distance:mainDist,targetDistance:mainDist,durationSec:mainSec,hrZone:[ZONES.Z3[0],ZONES.Z3[1]],paceZone:[mainLow,mainHigh],
          steps:[
            {title:`🟡 Échauffement (indicatif) · ${dur(warmupSec)}`,duration:dur(warmupSec),pace:`${pace2(ea-5)}–${pace2(ea+30)}`,hr:`${ZONES.Z1[0]}–${ZONES.Z2[0]}`},
            {title:`🔥 Tempo · ${mainDist} km`,duration:dur(mainSec),pace:`${pace2(mainLow)}–${pace2(mainHigh)}`,hr:`${ZONES.Z3[0]}–${ZONES.Z3[1]}`},
            {title:`🟢 Retour au calme (indicatif) · ${dur(cooldownSec)}`,duration:dur(cooldownSec),pace:`${pace2(ea+5)}–${pace2(ea+40)}/km`,hr:`${ZONES.Z1[0]}–${ZONES.Z2[0]} bpm`}
          ],date})
      }
    })
  }
  return out.sort((a,b)=>a.date.localeCompare(b.date)).map((s,i)=>({...s,index:i+1}))
}

function evaluate(s:Session,r:Run):Verdict{
  let score=0;const f:string[]=[]
  const marks:Verdict['marks']={dist:'ko',pace:'ko',hr:'none'}
  const ratio=r.distance/(s.distance||1)
  const distOk=ratio>=0.95
  if(distOk){score+=35;marks.dist='ok';f.push('📏 Distance : objectif atteint')}
  else if(ratio>=0.85){score+=20;marks.dist='warn';f.push('📏 Distance : légèrement sous la cible')}
  else f.push('📏 Distance : nettement sous la cible')
  const paceActual=r.durationSec/(r.distance||1)
  const[pf,ps]=s.avgPaceZone||s.paceZone // Fractionné : on compare à l’allure moyenne du bloc (effort + récupération)
  const paceOk=paceActual<=ps // à l’allure cible ou plus rapide → objectif tenu, voire dépassé
  const paceClose=!paceOk&&Math.abs(paceActual-(pf+ps)/2)<=20
  if(paceOk){score+=30;marks.pace='ok';f.push(paceActual<pf?'⚡️ Allure : objectif dépassé, plus rapide que prévu':'⚡️ Allure : dans la cible')}
  else if(paceClose){score+=18;marks.pace='warn';f.push('⚡️ Allure : proche de la cible')}
  else f.push('⚡️ Allure : plus lente que la cible')
  const hrKnown=!!r.avgHR
  let hrOk=true
  if(r.avgHR){const[hl,hh]=s.hrZone
    hrOk=r.avgHR>=hl&&r.avgHR<=hh+2 // +2 bpm de tolérance (précision de la montre)
    if(hrOk){score+=35;marks.hr='ok';f.push('❤️ FC : dans la plage cible')}
    else if(r.avgHR<=hh+8){score+=20;marks.hr='warn';f.push('❤️ FC : légèrement au-dessus')}
    else{marks.hr='ko';f.push('❤️ FC : effort plus intense que prévu')}}
  else{score+=18;f.push('❤️ FC : non renseignée')}
  if(r.elevation)f.push(`⛰ Dénivelé : ${Math.round(r.elevation)} m`)
  const criteriaMet=[distOk,paceOk,!hrKnown||hrOk].filter(Boolean).length
  const status:Verdict['status']=(distOk&&paceOk&&(!hrKnown||hrOk))?'Réussie':criteriaMet>=2?'Partielle':'Échouée'
  return{status,score:Math.min(100,score),factors:f,marks}
}

function estimateRecovery(r:Run){
  const min=r.durationSec/60
  let h=9+min*0.32
  if(r.elevation)h+=r.elevation/45
  if(r.avgHR&&r.avgHR>160)h+=6
  return Math.round(Math.min(72,Math.max(7,h)))
}

// 💬 Petite phrase + note (1 à 5) pour une course non liée au programme, comparée à tes propres standards récents
function freeAssessment(r:Run,all:Run[]):{phrase:string;stars:number}{
  const comparable=all.filter(o=>o.id!==r.id&&o.distance>=r.distance*0.7&&o.distance<=r.distance*1.3)
  const paceR=r.durationSec/r.distance
  const medianPace=(()=>{const arr=comparable.map(o=>o.durationSec/o.distance).sort((a,b)=>a-b);return arr.length?arr[Math.floor(arr.length/2)]:paceR})()
  const delta=medianPace-paceR // positif = plus rapide que d’habitude
  let stars=3,phrase='👍 Une sortie solide, dans tes standards habituels.'
  if(delta>18){stars=5;phrase='⚡️ Une de tes meilleures allures sur cette distance !'}
  else if(delta>7){stars=4;phrase='✨ Belle sortie, plus rapide que ta moyenne récente.'}
  else if(delta<-18){stars=2;phrase='💪 Séance exigeante, plus lente que d’habitude — la fatigue ou le terrain ont pu jouer.'}
  else if(delta<-7){stars=2.5;phrase='🌿 Rythme tranquille, parfait pour une sortie de récupération.'}
  return{phrase,stars:Math.round(stars*2)/2}
}
function Stars({value}:{value:number}){
  return <span aria-label={`${value}/5`}>{[1,2,3,4,5].map(i=>i<=Math.floor(value)?'⭐':(i-0.5===value?'✨':'☆'))}</span>
}
function StatusBadge({v}:{v:Verdict}){
  const cls=v.status==='Réussie'?'status-success':v.status==='Partielle'?'status-partial':'status-fail'
  const label=v.status==='Réussie'?'🟢 Réussie':v.status==='Partielle'?'🟠 Partielle':'🔴 Échouée'
  return <span className={cls}>{label}</span>
}

const load=(k:string,d:any)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??d}catch{return d}}
const save=(k:string,v:any)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}

// ---------- App ----------
function App(){
  const[tab,setTab]=useState('home')
  const[profile,setProfile]=useState<Profile>(()=>load('fl_profile',{goalKm:10,goalTimeSec:3600,runsPerWeek:3,notify:true}))
  const[overrides,setOverrides]=useState<Overrides>(()=>load('fl_overrides',{}))
  const[runs,setRuns]=useState<Run[]>(()=>load('fl_runs',null)??seedRuns())
  const[renfoEvents,setRenfoEvents]=useState<RenfoEvent[]>(()=>load('fl_renfo',[]))
  const[hiddenShoeDates,setHiddenShoeDates]=useState<string[]>(()=>load('fl_hidden_shoes',[]))
  const[strava,setStrava]=useState(false)
  const[sheet,setSheet]=useState<{open:boolean;sessionId?:string|null;editRun?:Run|null}>({open:false})

  useEffect(()=>{save('fl_profile',profile)},[profile])
  useEffect(()=>{save('fl_overrides',overrides)},[overrides])
  useEffect(()=>{save('fl_runs',runs)},[runs])
  useEffect(()=>{save('fl_renfo',renfoEvents)},[renfoEvents])
  useEffect(()=>{save('fl_hidden_shoes',hiddenShoeDates)},[hiddenShoeDates])
  useEffect(()=>{fetch('/api/strava/activities').then(r=>setStrava(r.ok)).catch(()=>{})},[])

  const sessions=useMemo(()=>{
    const base=buildProgram(profile,runs)
    // 🔒 Une séance déjà enregistrée garde l’objectif qui lui était demandé au moment de l’enregistrement (le programme futur, lui, se réadapte)
    return base.map(s=>({...s,...(overrides[s.id]?.target||{}),date:overrides[s.id]?.date||s.date,skipped:!!overrides[s.id]?.skipped,loggedId:overrides[s.id]?.loggedId}))
  },[profile,overrides,runs])

  const next=sessions.find(s=>!s.loggedId&&!s.skipped)
  const done=sessions.filter(s=>s.loggedId).length
  const progress=sessions.length?done/sessions.length:0
  const runById=(id?:string)=>runs.find(r=>r.id===id)
  const linkedVerdict=(s:typeof sessions[number])=>{const r=runById(s.loggedId);return r?evaluate(s,r):null}

  const lastRun=[...runs].sort((a,b)=>b.date.localeCompare(a.date))[0]
  const recentVerdicts=sessions.filter(s=>s.loggedId).slice(-4).map(s=>linkedVerdict(s)).filter(Boolean) as Verdict[]
  const fails=recentVerdicts.filter(v=>v.status==='Échouée').length
  const wins=recentVerdicts.filter(v=>v.status==='Réussie').length
  const slowKind=(([['Tempo','de tempo'],['Fractionné','de fractionné'],['Facile','en endurance facile'],['Sortie longue','en sortie longue']] as [Kind,string][]).map(([k,label])=>({label,t:paceTrend(runs,k)})).find(x=>x.t!==null&&x.t>HOLD_THRESHOLD)) as {label:string;t:number}|undefined
  const insight=fails>=2?{t:'Semaine allégée conseillée',d:'Plusieurs séances récentes étaient en dessous de la cible.',a:'Réduis le volume de 10–15 % cette semaine, garde l’intensité basse.'}
    :slowKind?{t:'Consolider avant d’accélérer',d:`Ton allure ${slowKind.label} est en recul d’environ ${Math.round(slowKind.t)} s/km à effort comparable sur tes 4 dernières séances de ce type.`,a:'Les gains de vitesse sont suspendus pour ce type de séance tant que la tendance ne repart pas dans le bon sens : garde 48 h entre deux séances intenses et reste dans ta zone de FC sur les sorties faciles.'}
    :wins>=3?{t:'Belle régularité',d:'Tes dernières séances sont maîtrisées.',a:'Tu peux augmenter légèrement le volume, sans changer l’intensité.'}
    :{t:'Continuité',d:'Le niveau actuel semble adapté.',a:'Garde le cap et réévalue après la prochaine séance.'}

  function openSheet(sessionId?:string|null){setSheet({open:true,sessionId:sessionId??null,editRun:null})}
  function openEditSheet(run:Run){setSheet({open:true,sessionId:run.sessionId??null,editRun:run})}
  function addRun(r:Omit<Run,'id'>){
    const id=String(Date.now())
    const sess=r.sessionId?sessions.find(x=>x.id===r.sessionId):undefined
    const run:Run={...r,id,kind:sess?.kind}
    setRuns(prev=>{const next=[...prev,run];save('fl_runs',next);return next})
    if(sess){
      const target:Target={distance:sess.distance,durationSec:sess.durationSec,hrZone:sess.hrZone,paceZone:sess.paceZone,avgPaceZone:sess.avgPaceZone}
      setOverrides(prev=>{const next={...prev,[sess.id]:{...prev[sess.id],loggedId:id,target}};save('fl_overrides',next);return next})
    }
    setSheet({open:false})
  }
  function updateRun(id:string,r:Omit<Run,'id'>){setRuns(prev=>{const next=prev.map(x=>x.id===id?{...x,...r,id}:x);save('fl_runs',next);return next});setSheet({open:false})}
  function removeRun(id:string){
    setRuns(prev=>{const next=prev.filter(r=>r.id!==id);save('fl_runs',next);return next})
    setOverrides(prev=>{const n:Overrides={...prev};for(const k in n)if(n[k].loggedId===id){const{loggedId,target,...rest}=n[k];n[k]=rest};save('fl_overrides',n);return n})
  }
  function addRenfo(date:string){setRenfoEvents(prev=>{const next=[...prev,{id:String(Date.now()),date}];save('fl_renfo',next);return next})}
  function removeRenfo(id:string){setRenfoEvents(prev=>{const next=prev.filter(e=>e.id!==id);save('fl_renfo',next);return next})}
  function hideShoe(date:string){setHiddenShoeDates(prev=>prev.includes(date)?prev:[...prev,date])}
  function resetShoe(date:string){setHiddenShoeDates(prev=>prev.filter(d=>d!==date))}
  function resetAll(){if(confirm('Effacer toutes tes données locales (courses, réglages) ?')){localStorage.removeItem('fl_profile');localStorage.removeItem('fl_overrides');localStorage.setItem('fl_runs','[]');localStorage.removeItem('fl_renfo');localStorage.removeItem('fl_hidden_shoes');location.reload()}}

  return <div className="app">
    <header className="top"><div className="topin">
      <div className="row" style={{gap:10}}><img src="/icon.png" alt="" width={38} height={38} style={{borderRadius:12}}/>
        <div><div className="brand">Lise's Coach ✨</div><div className="sub">Ton programme. Tes données. Ton rythme.</div></div></div>
      <div className="pill">{Math.round(progress*100)} %</div>
    </div></header>
    <main className="content">
      {tab==='home'&&<Home profile={profile} progress={progress} done={done} total={sessions.length} next={next} lastRun={lastRun} insight={insight} onLog={openSheet} sessions={sessions} runs={runs} renfoEvents={renfoEvents} onAddRenfo={addRenfo} onRemoveRenfo={removeRenfo} hiddenShoeDates={hiddenShoeDates} onRemoveShoe={hideShoe} onRestoreShoe={resetShoe}/>}
      {tab==='program'&&<Program sessions={sessions} next={next} runById={runById} verdictOf={linkedVerdict} onLog={openSheet} onEdit={openEditSheet} onCancel={removeRun}/>}
      {tab==='analysis'&&<Analysis runs={runs} sessions={sessions} verdictOf={linkedVerdict} onDelete={removeRun} onEdit={openEditSheet}/>}
      {tab==='profile'&&<ProfileTab profile={profile} setProfile={setProfile} strava={strava} runsCount={runs.length} onReset={resetAll}/>}
    </main>
    <button className="fab" aria-label="Ajouter une course" onClick={()=>openSheet(next?.id)}>+</button>
    <nav className="nav"><div className="navin">
      {[['home','🏠','Accueil'],['program','📋','Programme'],['analysis','📈','Analyse'],['profile','🙂','Profil']].map(x=>
        <button key={x[0]} className={tab===x[0]?'active':''} onClick={()=>setTab(x[0])}><span className="icon">{x[1]}</span>{x[2]}</button>)}
    </div></nav>
    {sheet.open&&<AddRunSheet sessions={sessions.filter(s=>!s.loggedId)} initialSessionId={sheet.sessionId} editRun={sheet.editRun} onClose={()=>setSheet({open:false})} onSave={addRun} onUpdate={updateRun}/>}
  </div>
}

function Home({profile,progress,done,total,next,lastRun,insight,onLog,sessions,runs,renfoEvents,onAddRenfo,onRemoveRenfo,hiddenShoeDates,onRemoveShoe,onRestoreShoe}:any){
  return <>
    <section className="card hero tint-lavender">
      <div className="eyebrow">Bonjour 👋</div>
      <div className="big">🎯 Objectif : {profile.goalKm} km en {dur(profile.goalTimeSec)}</div>
      <div className="lede">Allure visée : {pace2(profile.goalTimeSec/profile.goalKm)} / km</div>
      <div className="progress" style={{marginTop:14}}><i style={{width:`${progress*100}%`}}/></div>
      <div className="small muted" style={{marginTop:8}}>{done}/{total} séances réalisées</div>
    </section>

    <section className="card">
      <div className="row"><div className="h2">💗 Récupération</div>{lastRun&&<span className="pill">{estimateRecovery(lastRun)} h conseillées</span>}</div>
      {lastRun?<>
        <RecoveryRing run={lastRun}/>
        <div className="small muted" style={{marginTop:10}}>Dernière sortie : {new Date(lastRun.date).toLocaleDateString('fr-FR')} · {roundHalfUp(lastRun.distance)} km en {dur(lastRun.durationSec)}</div>
      </>:<div className="small muted">Enregistre une course pour voir ta fenêtre de récupération estimée.</div>}
    </section>

    {next&&<section className="card workout next">
      <div className="pill">🏃‍♀️ Prochaine séance</div>
      <div className="h2" style={{marginTop:9}}>{next.kind}</div>
      <div className="muted small">{next.detail}</div>
      <div className="row" style={{marginTop:12,alignItems:'stretch',gap:10}}>
        <div className="metric" style={{flex:1}}>
          <span>📏 Objectif</span>
          <b>{roundHalfUp(next.distance)} km</b>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:5}}>
          <div className="small muted">⏱️ {dur(next.durationSec*0.92)}–{dur(next.durationSec*1.08)}</div>
          <div className="small muted">⚡️ {pace2(next.paceZone[0])}–{pace2(next.paceZone[1])}</div>
          <div className="small muted">❤️ {next.hrZone[0]}–{next.hrZone[1]}</div>
        </div>
      </div>
      {next.steps&&<div style={{marginTop:14}}>
        <div className="section" style={{margin:'0 0 8px'}}>🧩 Détail de la séance</div>
        {next.steps.map((st:Step,i:number)=>{
          const isTempo=next.kind==='Tempo'
          const baseTitle=st.title.split('·')[0].trim()
          const metric=st.title.split('·').slice(1).join('·').trim()
          const timeRange=`${dur(parseDur(st.duration)*0.92)}–${dur(parseDur(st.duration)*1.08)}`
          return <div key={i} style={{padding:'8px 0',borderBottom:i<next.steps.length-1?'1px solid var(--line)':'none'}}>
            <div className="small" style={{fontWeight:600}}>{baseTitle} · <b>{isTempo?metric:st.duration}</b></div>
            <div className="small muted">
              {isTempo
                ? <>⏱ {timeRange} • ⚡️ {st.pace} • ❤️ {st.hr}</>
                : <>⚡️ {st.pace} • ❤️ {st.hr}</>}
            </div>
          </div>
        })}
      </div>}
      <button className="btn block" style={{marginTop:14}} onClick={()=>onLog(next.id)}>✅ Enregistrer cette séance</button>
    </section>}

    <section className="card tint-sage">
      <div className="h2">🧠 {insight.t}</div>
      <p className="small" style={{marginTop:6}}>{insight.d}</p>
      <div className="notice" style={{marginTop:4}}>{insight.a}</div>
    </section>

    <Calendar sessions={sessions} runs={runs} renfoEvents={renfoEvents} hiddenShoeDates={hiddenShoeDates} onAddRenfo={onAddRenfo} onRemoveRenfo={onRemoveRenfo} onRemoveShoe={onRemoveShoe} onRestoreShoe={onRestoreShoe}/>
  </>
}

function monthLabel(d:Date){return d.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}

function Calendar({sessions,runs,renfoEvents,hiddenShoeDates,onAddRenfo,onRemoveRenfo,onRemoveShoe,onRestoreShoe}:any){
  const[cursor,setCursor]=useState(()=>{const d=new Date();d.setDate(1);return d})
  const[selected,setSelected]=useState<string|null>(null)
  const year=cursor.getFullYear(),month=cursor.getMonth()
  const first=new Date(year,month,1)
  const startOffset=(first.getDay()||7)-1
  const daysInMonth=new Date(year,month+1,0).getDate()
  const cells:(string|null)[]=[]
  for(let i=0;i<startOffset;i++)cells.push(null)
  for(let d=1;d<=daysInMonth;d++)cells.push(`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
  while(cells.length%7!==0)cells.push(null)

  const sessionByDate:Record<string,any[]>={}
  sessions.forEach((s:any)=>{(sessionByDate[s.date]=sessionByDate[s.date]||[]).push(s)})
  const loggedByDate:Record<string,any[]>={}
  ;(runs||[]).forEach((r:any)=>{(loggedByDate[r.date]=loggedByDate[r.date]||[]).push(r)})
  const shoeDates=new Set(Object.keys(loggedByDate).filter((d)=>!hiddenShoeDates.includes(d)))
  const renfoByDate:Record<string,any[]>={}
  renfoEvents.forEach((e:any)=>{(renfoByDate[e.date]=renfoByDate[e.date]||[]).push(e)})
  const todayIso=new Date().toISOString().slice(0,10)

  return <section className="card">
    <div className="row">
      <button className="btn ghost" onClick={()=>setCursor(new Date(year,month-1,1))}>←</button>
      <div className="h2" style={{textTransform:'capitalize'}}>🗓️ {monthLabel(cursor)}</div>
      <button className="btn ghost" onClick={()=>setCursor(new Date(year,month+1,1))}>→</button>
    </div>
    <div className="cal-weekdays">{['L','M','M','J','V','S','D'].map((d,i)=><span key={i}>{d}</span>)}</div>
    <div className="cal-grid">
      {cells.map((iso,i)=>iso?(
        <button key={i} type="button" className={'cal-cell'+(iso===todayIso?' today':'')+(iso===selected?' selected':'')} onClick={()=>setSelected(iso===selected?null:iso)}>
          <span className="cal-num">{Number(iso.slice(8))}</span>
          <span className="cal-dots">
            {shoeDates.has(iso)&&<span className="cal-dot run" title="Course">👟</span>}
            {(renfoByDate[iso]||[]).map((e:any)=><span key={e.id} className="cal-dot renfo" title="Renforcement">💪</span>)}
          </span>
        </button>
      ):<span key={i}/>)}
    </div>
    {selected&&<div className="notice" style={{marginTop:14}}>
      <div className="small" style={{fontWeight:650,marginBottom:6,textTransform:'capitalize'}}>{new Date(selected).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
      {(sessionByDate[selected]||[]).map((s:any)=>!loggedByDate[selected]?.some((r:any)=>r.sessionId===s.id)?<div key={s.id} className="small muted" style={{marginBottom:4}}>📋 Prévu : {s.kind} · {roundHalfUp(s.distance)} km</div>:null)}
      {(loggedByDate[selected]||[]).map((r:any)=><div key={r.id} className="small" style={{marginBottom:4}}>✅ Réalisé : {roundHalfUp(r.distance)} km en {dur(r.durationSec)}</div>)}
      {(loggedByDate[selected]||[]).length>0 && (shoeDates.has(selected)
        ? <button className="btn ghost" style={{padding:'4px 10px',marginTop:4}} onClick={()=>onRemoveShoe(selected)}>Retirer la basket</button>
        : <button className="btn ghost" style={{padding:'4px 10px',marginTop:4}} onClick={()=>onRestoreShoe(selected)}>Afficher la basket</button>)}
      {(renfoByDate[selected]||[]).map((e:any)=><div key={e.id} className="small" style={{marginBottom:4}}>💪 Renforcement <button className="btn ghost" style={{padding:'2px 8px',marginLeft:8}} onClick={()=>onRemoveRenfo(e.id)}>Retirer</button></div>)}
      <button className="btn secondary" style={{marginTop:8}} onClick={()=>onAddRenfo(selected)}>+ Ajouter un renforcement 💪</button>
    </div>}
  </section>
}

function RecoveryRing({run}:{run:Run}){
  const total=estimateRecovery(run)
  const elapsedH=Math.max(0,(Date.now()-new Date(run.date).getTime())/36e5)
  const pct=Math.max(0,Math.min(100,Math.round((elapsedH/total)*100)))
  const r=36,c=2*Math.PI*r
  return <div className="row" style={{alignItems:'center',gap:16}}>
    <div className="recovery-ring">
      <svg width="86" height="86" viewBox="0 0 86 86">
        <circle cx="43" cy="43" r={r} stroke="#F1E3E6" strokeWidth="8" fill="none"/>
        <circle cx="43" cy="43" r={r} stroke={pct>=100?'#7FA88F':'#C1748D'} strokeWidth="8" fill="none" strokeDasharray={c} strokeDashoffset={c-(c*pct)/100} strokeLinecap="round"/>
      </svg>
      <div className="val">{pct}%<small>récupéré</small></div>
    </div>
    <div className="small muted">{pct>=100?'Tu es prête pour une nouvelle séance.':`Encore environ ${Math.max(0,Math.round(total-elapsedH))} h avant une séance intense.`}</div>
  </div>
}


type TypeFilter='all'|'easy'|'long'|'other'
const TYPE_FILTERS:[TypeFilter,string][]=[['all','Tous'],['easy','Facile'],['long','Longue'],['other','Autres']]
const matchesType=(k:Kind,f:TypeFilter)=>f==='all'||(f==='easy'&&k==='Facile')||(f==='long'&&k==='Sortie longue')||(f==='other'&&(k==='Tempo'||k==='Fractionné'))

// 🎯 vs ✅ : objectif demandé (figé à l’enregistrement) à côté du réalisé
function Compare({s,run,v}:{s:any;run:Run;v:Verdict|null}){
  const[pl,ph]=s.avgPaceZone||s.paceZone
  const pace=run.durationSec/(run.distance||1)
  const mk=(m?:Mark)=>m==='ok'?'✅':m==='warn'?'🟠':m==='ko'?'🔴':''
  const rows:[string,string,string,Mark|undefined][]=[
    ['📏 Distance',`${roundHalfUp(s.distance)} km`,`${run.distance} km`,v?.marks.dist],
    ['⏱️ Temps',`${dur(s.durationSec*0.92)}–${dur(s.durationSec*1.08)}`,dur(run.durationSec),undefined],
    ['⚡️ Allure',`${pace2(pl)}–${pace2(ph)}/km`,`${pace2(pace)}/km`,v?.marks.pace],
    ['❤️ FC moy.',`${s.hrZone[0]}–${s.hrZone[1]}`,run.avgHR?`${run.avgHR} bpm`:'—',v?.marks.hr],
  ]
  return <div style={{marginTop:10}}>
    <div className="cmp">
      <span/><b className="cmp-h">🎯 Objectif</b><b className="cmp-h">✅ Réalisé</b>
      {rows.map(r=><div key={r[0]} className="cmp-row">
        <span className="cmp-l">{r[0]}</span><span className="cmp-o">{r[1]}</span><span className="cmp-r">{r[2]} {mk(r[3])}</span>
      </div>)}
    </div>
    <div className="small muted" style={{marginTop:8}}>
      📅 {new Date(run.date).toLocaleDateString('fr-FR')}
      {run.elevation?` • ⛰ ${Math.round(run.elevation)} m`:''}
      {run.temperature?` • 🌡 ${run.temperature}`:''}
      {s.steps?' • Objectif = bloc principal (hors échauffement / retour au calme)':''}
    </div>
  </div>
}

function Program({sessions,next,runById,verdictOf,onLog,onEdit,onCancel}:any){
  const[filter,setFilter]=useState<'upcoming'|'done'>('upcoming')
  const[typeFilter,setTypeFilter]=useState<TypeFilter>('all')
  const visible=(filter==='upcoming'?sessions.filter((s:any)=>!s.loggedId&&!s.skipped):sessions.filter((s:any)=>!!s.loggedId)).filter((s:any)=>matchesType(s.kind,typeFilter))
  return <>
    <div className="title">📋 Programme</div>
    <div className="tabs">
      <button className={filter==='upcoming'?'on':''} onClick={()=>setFilter('upcoming')}>À venir</button>
      <button className={filter==='done'?'on':''} onClick={()=>setFilter('done')}>Réalisées</button>
    </div>
    <div className="tabs" style={{marginTop:8}} aria-label="Type de séance">
      {TYPE_FILTERS.map(([k,l])=><button key={k} className={typeFilter===k?'on soft':''} onClick={()=>setTypeFilter(k)}>{l}</button>)}
    </div>
    <div className="list" style={{marginTop:12}}>
      {visible.length===0&&<div className="empty">{filter==='done'?'Aucune séance réalisée de ce type pour l’instant.':'Aucune séance à venir de ce type.'}</div>}
      {visible.map((s:any)=>{
        const run=runById(s.loggedId);const v=run?verdictOf(s):null
        return <div key={s.id} className={'workout '+(run?'done':'')+(next?.id===s.id?' next':'')}>
          <div className="row">
            <div><div className="h2">{run?'🟢':s.skipped?'⚪️':'🏃‍♀️'} Séance {s.index} · {s.kind}</div>
              <div className="small muted">
                <b>{roundHalfUp(s.distance)} km</b>
              </div></div>
            {v&&<StatusBadge v={v}/>}
          </div>
          {run?<Compare s={s} run={run} v={v}/>:<>
            <div className="small" style={{marginTop:8}}>{s.detail}</div>
            {!s.steps&&<div className="small muted" style={{marginTop:8}}>
              ⏱️ {dur(s.durationSec*0.92)}–{dur(s.durationSec*1.08)} • ⚡️ {pace2(s.paceZone[0])}–{pace2(s.paceZone[1])} • ❤️ {s.hrZone[0]}–{s.hrZone[1]}
            </div>}
            {s.steps&&<div style={{marginTop:10}}>
              {s.steps.map((st:Step,i:number)=>{
                const isTempo=s.kind==='Tempo'
                const baseTitle=st.title.split('·')[0].trim()
                const metric=st.title.split('·').slice(1).join('·').trim()
                const timeRange=`${dur(parseDur(st.duration)*0.92)}–${dur(parseDur(st.duration)*1.08)}`
                return <div key={i} style={{padding:'7px 0',borderBottom:i<s.steps.length-1?'1px solid var(--line)':'none'}}>
                  <div className="small" style={{fontWeight:600}}>
                    {baseTitle} · <b>{isTempo?metric:st.duration}</b>
                  </div>
                  <div className="small muted">
                    {isTempo
                      ? <>⏱ {timeRange} • ⚡️ {st.pace} • ❤️ {st.hr}</>
                      : <>⚡️ {st.pace} • ❤️ {st.hr}</>}
                  </div>
                </div>
              })}
            </div>}
          </>}
          {!run&&<div className="actions" style={{marginTop:12,alignItems:'center',justifyContent:'space-between'}}>
            <label className="row" style={{gap:8,cursor:'pointer'}}>
              <input type="checkbox" checked={false} onChange={()=>onLog(s.id)}/>
              <span className="small">✅ Faite</span>
            </label>
          </div>}
          {run&&<div className="actions" style={{marginTop:12,justifyContent:'flex-end'}}>
            <button className="btn ghost" onClick={()=>onEdit(run)}>✏️ Modifier</button>
            <button className="btn ghost" onClick={()=>{if(confirm('Annuler cette séance réalisée ? Elle repassera « à venir » dans le programme.'))onCancel(run.id)}}>↩️ Annuler</button>
          </div>}
        </div>
      })}
    </div>
  </>
}

function scrollToRun(id:string){
  const el=document.getElementById(`run-${id}`)
  if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1100)}
}

function trendInsights(runs:Run[]){
  const sorted=[...runs].filter(r=>r.distance>=2 && r.date>=PROGRAM_START).sort((a,b)=>a.date.localeCompare(b.date))
  if(!sorted.length)return null
  const best=[...sorted].sort((a,b)=>(a.durationSec/a.distance)-(b.durationSec/b.distance))[0]
  const longest=[...sorted].sort((a,b)=>b.distance-a.distance)[0]
  const firstDate=new Date(sorted[0].date)
  const lastDate=new Date(sorted[sorted.length-1].date)
  const spanWeeks=Math.max(1,Math.ceil((lastDate.getTime()-firstDate.getTime())/864e5/7))
  const avgRunsPerWeek=sorted.length/spanWeeks
  const last30=sorted.filter(r=>(Date.now()-new Date(r.date).getTime())/864e5<=30)
  return{best,longest,last30Count:last30.length,avgRunsPerWeek:Math.round(avgRunsPerWeek*10)/10}
}

function Analysis({runs,sessions,verdictOf,onDelete,onEdit}:any){
  const sessionById=(id?:string|null)=>sessions.find((s:any)=>s.id===id)
  const sorted=[...runs].filter((r:Run)=>r.date>=PROGRAM_START && !!sessionById(r.sessionId)).sort((a:Run,b:Run)=>a.date.localeCompare(b.date))
  // 📈 3 courbes d’allure moyenne : Facile / Sortie longue / Tempo — une valeur par séance enregistrée, alimentées au fil de tes saisies
  const paceKey=(r:Run):'facile'|'longue'|'tempo'|null=>{
    const k=sessionById(r.sessionId)?.kind
    return k==='Facile'?'facile':k==='Sortie longue'?'longue':k==='Tempo'?'tempo':null
  }
  const paceMap:Record<string,any>={}
  sorted.forEach((r:Run)=>{
    const key=paceKey(r)
    if(!key)return
    if(!paceMap[r.date])paceMap[r.date]={date:r.date}
    paceMap[r.date][key]=r.durationSec/(r.distance||1)
  })
  const paceData=Object.values(paceMap).sort((a:any,b:any)=>a.date.localeCompare(b.date))
  const fmtDay=(iso:string)=>`${iso.slice(8,10)}/${iso.slice(5,7)}`
  const byWeek:Record<string,{km:number;firstId:string}>={}
  sorted.forEach((r:Run)=>{const d=new Date(r.date);const y=d.getFullYear();const onejan=new Date(y,0,1);const wk=Math.ceil((((d.getTime()-onejan.getTime())/86400000)+onejan.getDay()+1)/7);const key=`S${wk}`;if(!byWeek[key])byWeek[key]={km:0,firstId:r.id};byWeek[key].km+=r.distance})
  const weekData=Object.entries(byWeek).map(([k,v])=>({week:k,km:round1(v.km),id:v.firstId}))
  const trend=trendInsights(runs)

  if(!sorted.length)return <><div className="title">📈 Analyse</div><div className="empty">Aucune course enregistrée pour l’instant.<br/>Appuie sur le bouton + pour ajouter ta première sortie.</div></>

  return <>
    <div className="title">📈 Analyse</div>
    {trend&&<section className="card tint-lavender">
      <div className="h2">🔎 Tendances</div>
      <div className="kv"><span>🏆 Meilleure allure</span><b>{pace2(trend.best.durationSec/trend.best.distance)}/km ({new Date(trend.best.date).toLocaleDateString('fr-FR')})</b></div>
      <div className="kv"><span>📏 Plus longue sortie</span><b>{roundHalfUp(trend.longest.distance)} km ({new Date(trend.longest.date).toLocaleDateString('fr-FR')})</b></div>
      <div className="kv"><span>📅 Régularité</span><b>{`${trend.avgRunsPerWeek} course${trend.avgRunsPerWeek>1?'s':''} / semaine`}</b></div>
      <div className="kv"><span>🗓️ Courses sur 30 jours</span><b>{trend.last30Count}</b></div>
    </section>}
    <section className="card"><div className="h2">🚀 Évolution de l’allure moyenne</div>
      <p className="small muted" style={{marginTop:-4,marginBottom:8}}>Une courbe par type de séance (Facile, Sortie longue, Tempo) · elle se complète à chaque séance enregistrée. Plus c’est haut, plus c’est rapide.</p>
      {paceData.length>0?<div className="chart-wrap"><ResponsiveContainer width="100%" height={220}>
        <LineChart data={paceData} margin={{top:6,right:10,left:0,bottom:0}}>
          <CartesianGrid stroke="#F1E3E6"/>
          <XAxis dataKey="date" fontSize={11} stroke="#8A7480" tickFormatter={fmtDay} minTickGap={18}/>
          <YAxis fontSize={11} stroke="#8A7480" width={42} reversed tickFormatter={(v:any)=>pace2(Number(v))} domain={[(min:number)=>Math.floor((min-15)/15)*15,(max:number)=>Math.ceil((max+15)/15)*15] as any}/>
          <Tooltip formatter={(v:any)=>`${pace2(Number(v))}/km`} labelFormatter={(l:any)=>new Date(l).toLocaleDateString('fr-FR')}/>
          <Legend formatter={(v:string)=>v==='facile'?'Facile':v==='longue'?'Sortie longue':'Tempo'}/>
          <Line type="monotone" dataKey="facile" stroke="#C1748D" strokeWidth={2.5} dot={{r:3.5}} activeDot={{r:5}} connectNulls/>
          <Line type="monotone" dataKey="longue" stroke="#9B84BF" strokeWidth={2.5} dot={{r:3.5}} activeDot={{r:5}} connectNulls/>
          <Line type="monotone" dataKey="tempo" stroke="#E2967B" strokeWidth={2.5} dot={{r:3.5}} activeDot={{r:5}} connectNulls/>
        </LineChart>
      </ResponsiveContainer></div>:<div className="empty" style={{padding:14}}>Enregistre une séance du programme pour voir apparaître les courbes.</div>}
    </section>
    {weekData.length>1&&<section className="card"><div className="h2">📏 Distance par semaine</div>
      <p className="small muted" style={{marginTop:-4,marginBottom:8}}>Touche une barre pour voir une course de cette semaine ⬇️</p>
      <div className="chart-wrap"><ResponsiveContainer width="100%" height={160}>
        <BarChart data={weekData} onClick={(e:any)=>{const p=e?.activePayload?.[0]?.payload;if(p)scrollToRun(p.id)}}><CartesianGrid stroke="#F1E3E6"/><XAxis dataKey="week" fontSize={11} stroke="#8A7480"/><YAxis fontSize={11} stroke="#8A7480" width={30}/><Tooltip formatter={(v:any)=>v+' km'}/><Bar dataKey="km" fill="#9B84BF" radius={[6,6,0,0]} cursor="pointer"/></BarChart>
      </ResponsiveContainer></div>
    </section>}
    <div className="section">🗂️ Historique</div>
    <div className="list">{[...runs].sort((a:Run,b:Run)=>b.date.localeCompare(a.date)).map((r:Run)=>{
      const s=sessionById(r.sessionId);const v=s?verdictOf(s):null
      const free=!v?freeAssessment(r,runs):null
      return <div className="card" id={`run-${r.id}`} key={r.id}>
        <div className="row"><div><div className="h2">🏃 {s?s.kind:(r.label||'Sortie libre')}</div><div className="small muted">{new Date(r.date).toLocaleDateString('fr-FR')}</div></div>
          {v?<StatusBadge v={v}/>:<Stars value={free!.stars}/>}
        </div>
        <div className="grid2" style={{marginTop:12}}>
          <div className="metric"><span>Distance</span><b>{roundHalfUp(r.distance)} km</b></div>
          <div className="metric"><span>Durée</span><b>{dur(r.durationSec)}</b></div>
          <div className="metric"><span>Allure</span><b>{pace2(r.durationSec/r.distance)}/km</b></div>
          <div className="metric"><span>FC moy.</span><b>{r.avgHR||'—'}</b></div>
        </div>
        {v?<><div className="section" style={{margin:'14px 0 6px'}}>Facteurs</div>{v.factors.map((f:string)=><div className="small" key={f} style={{padding:'3px 0'}}>{f}</div>)}</>
          :<div className="notice" style={{marginTop:12}}>{free!.phrase}</div>}
        <div className="row" style={{marginTop:12,gap:8}}>
          <button className="btn ghost" style={{flex:1}} onClick={()=>onEdit(r)}>✏️ Modifier</button>
          <button className="btn ghost" style={{flex:1}} onClick={()=>onDelete(r.id)}>🗑 Supprimer</button>
        </div>
      </div>
    })}</div>
  </>
}

function ProfileTab({profile,setProfile,strava,runsCount,onReset}:any){
  const[timeStr,setTimeStr]=useState(dur(profile.goalTimeSec))
  return <>
    <div className="title">🙂 Profil</div>
    <div className="card">
      <div className="h2">🎯 Objectif</div>
      <div className="formrow"><label>Distance</label><select value={profile.goalKm} onChange={e=>setProfile({...profile,goalKm:Number(e.target.value)})}>
        <option value={5}>5 km</option><option value={10}>10 km</option><option value={21.1}>Semi (21,1 km)</option>
      </select></div>
      <div className="formrow"><label>Temps visé</label><input value={timeStr} onChange={e=>setTimeStr(e.target.value)} onBlur={()=>setProfile({...profile,goalTimeSec:parseDur(timeStr)||profile.goalTimeSec})} placeholder="1:00:00"/></div>
      <div className="formrow"><label>Courses / semaine</label><select value={profile.runsPerWeek} onChange={e=>setProfile({...profile,runsPerWeek:Number(e.target.value)})}>
        <option value={3}>3</option><option value={4}>4</option><option value={5}>5</option>
      </select></div>
      <div className="small muted">Le plan se régénère automatiquement selon ces réglages.</div>
    </div>
    <div className="card">
      <div className="h2">🔗 Strava</div>
      <p className="small muted">Optionnel : connecte Strava pour importer tes courses automatiquement. Tu peux continuer sans, en saisie manuelle.</p>
      {strava?<span className="pill sage">🟢 Connectée</span>:<button className="btn secondary" onClick={()=>window.location.href='/api/strava/start'}>Connecter Strava</button>}
    </div>
    <div className="card">
      <div className="h2">🔔 Notifications</div>
      <label className="row" style={{marginTop:8}}><span>Rappels de séance</span><input type="checkbox" checked={profile.notify} onChange={e=>setProfile({...profile,notify:e.target.checked})}/></label>
    </div>
    <div className="card">
      <div className="h2">🗂️ Données</div>
      <div className="kv"><span>Courses enregistrées</span><b>{runsCount}</b></div>
      <button className="btn danger" style={{marginTop:10}} onClick={onReset}>Réinitialiser mes données</button>
    </div>
    <div className="notice">💗 Installable sur iPhone depuis Safari : Partager → Sur l’écran d’accueil.</div>
  </>
}

function AddRunSheet({sessions,initialSessionId,editRun,onClose,onSave,onUpdate}:any){
  const[date,setDate]=useState(editRun?editRun.date:new Date().toISOString().slice(0,10))
  const sessionId=initialSessionId||'free'
  const initialSession=sessions.find((s:any)=>s.id===(initialSessionId||''))
  const[distance,setDistance]=useState(editRun?String(editRun.distance).replace('.',','):(initialSession?String(roundHalfUp(initialSession.distance)).replace('.',','):'5'))
  const[time,setTime]=useState(editRun?dur(editRun.durationSec):'0:00:00')
  const[hr,setHr]=useState(editRun?String(editRun.avgHR||''):'')
  const[elev,setElev]=useState(editRun?(editRun.elevation!=null?String(editRun.elevation):''):'')
  const[temp,setTemp]=useState(editRun?(editRun.temperature||''):'')
  function submit(){
    const dist=Number(distance.replace(',','.'))||0
    const durationSec=parseDur(time)
    if(dist<=0||durationSec<=0)return alert('Renseigne au moins une distance et une durée valides.')
    if(!hr||Number(hr)<=0)return alert('Renseigne ta FC moyenne.')
    const payload={date,distance:dist,durationSec,avgHR:Number(hr),elevation:elev?Number(elev):undefined,temperature:temp||undefined,sessionId:sessionId==='free'?null:sessionId}
    if(editRun)onUpdate(editRun.id,payload)
    else onSave(payload)
  }
  return <div className="sheet-backdrop" onClick={onClose}>
    <div className="sheet" onClick={e=>e.stopPropagation()}>
      <div className="sheet-handle"/>
      <div className="h2" style={{marginBottom:14}}>{editRun?'✏️ Modifier la course':'🏃‍♀️ Ajouter une course'}</div>
      <div className="field" style={{marginBottom:12}}><label>📅 Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
      <div className="formgrid">
        <div className="field"><label>📏 Distance (km)</label><input inputMode="decimal" value={distance} onChange={e=>setDistance(e.target.value)}/></div>
        <div className="field"><label>⏱ Durée (mm:ss ou h:mm:ss)</label><input value={time} onChange={e=>setTime(e.target.value)}/></div>
        <div className="field"><label>❤️ FC moyenne *</label><input inputMode="numeric" required value={hr} onChange={e=>setHr(e.target.value)}/></div>
        <div className="field"><label>⛰ Dénivelé m (optionnel)</label><input inputMode="numeric" value={elev} onChange={e=>setElev(e.target.value)}/></div>
        <div className="field"><label>🌡 Température (optionnel)</label><input value={temp} onChange={e=>setTemp(e.target.value)} placeholder="18°"/></div>
      </div>
      <button className="btn block" onClick={submit}>{editRun?'✅ Enregistrer les modifications':'✅ Enregistrer la course'}</button>
    </div>
  </div>
}

export default App
