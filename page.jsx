"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const RANK_VALUES = {A:1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,J:11,Q:12,K:13};
const RED_SUITS = ["♥","♦"];
const BANK_INIT = 100000;
const DEFAULT_NAMES = ["Alex","Blake","Casey","Dana","Eli","Faye"];

function buildDeck() {
  const d=[];
  for(const s of SUITS) for(const r of RANKS) d.push({suit:s,rank:r,value:RANK_VALUES[r]});
  return shuffle(d);
}
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

// ── Playing Card ──────────────────────────────────────────────────────────────
function PlayingCard({card,faceDown=false,flipping=false,size="md",glow=false}){
const [showFace,setShowFace]=useState(!faceDown);
const [rotated,setRotated]=useState(false);

// ✅ Set correct initial side when card changes
useEffect(()=>{
  if(faceDown){
    setRotated(false);
    setShowFace(false);
  }else{
    setRotated(true);
    setShowFace(true);
  }
},[card, faceDown]);

// ✅ Flip only for 3rd card
useEffect(()=>{
  if(flipping){
    setRotated(false);
    setShowFace(false);

    setTimeout(()=>setRotated(true),50);
    setTimeout(()=>setShowFace(true),350);
  }
},[flipping]);
  const sz={sm:{w:54,h:80,f:12,sf:20},md:{w:74,h:106,f:14,sf:28},lg:{w:96,h:136,f:17,sf:38}}[size];
  const isRed=card&&RED_SUITS.includes(card.suit);
  const face=card&&{J:"🤴",Q:"👸",K:"👑",A:"✦"}[card.rank];
  return(
    <div style={{width:sz.w,height:sz.h,perspective:700,flexShrink:0,
      filter:glow?"drop-shadow(0 0 14px #f5c518) drop-shadow(0 0 28px rgba(245,197,24,0.4))":"drop-shadow(0 3px 10px rgba(0,0,0,0.65))",
      transition:"filter 0.3s"}}>
      <div style={{width:"100%",height:"100%",position:"relative",transformStyle:"preserve-3d",
        transform:rotated?"rotateY(180deg)":"rotateY(0deg)",
        transition:"transform 0.6s cubic-bezier(0.4,0,0.2,1)"}}>
        {/* Back */}
        <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",borderRadius:9,
          background:"linear-gradient(145deg,#1b3f7a,#0c1f3f)",border:"2.5px solid #c9a84c",
          boxSizing:"border-box",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:"82%",height:"82%",border:"1.5px solid rgba(201,168,76,0.4)",borderRadius:5,
            background:"repeating-linear-gradient(45deg,#1b3f7a,#1b3f7a 5px,#0c1f3f 5px,#0c1f3f 10px)",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:sz.f*1.4,color:"rgba(201,168,76,0.4)"}}>♦</span>
          </div>
        </div>
        {/* Front */}
        <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",transform:"rotateY(180deg)",
          borderRadius:9,background:"linear-gradient(160deg,#fffff8,#f5f0e8)",
          border:"2px solid #ccc",boxSizing:"border-box",
          display:"flex",flexDirection:"column",padding:"4px 6px",overflow:"hidden"}}>
          {showFace&&card&&(<>
            <div style={{fontSize:sz.f,fontWeight:900,color:isRed?"#c0392b":"#111",lineHeight:1.15,fontFamily:"Georgia,serif"}}>
              {card.rank}<br/><span style={{fontSize:sz.f-2}}>{card.suit}</span>
            </div>
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:sz.sf,color:isRed?"#c0392b":"#111"}}>{face||card.suit}</div>
            <div style={{fontSize:sz.f,fontWeight:900,color:isRed?"#c0392b":"#111",
              lineHeight:1.15,transform:"rotate(180deg)",fontFamily:"Georgia,serif"}}>
              {card.rank}<br/><span style={{fontSize:sz.f-2}}>{card.suit}</span>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toasts({list}){
  const clr={win:"linear-gradient(135deg,#145214,#1d7a1d)",
    lose:"linear-gradient(135deg,#6b1010,#a01818)",
    info:"linear-gradient(135deg,#1a2e60,#2748a0)",
    warn:"linear-gradient(135deg,#5c3a00,#9a6200)"};
  return(
    <div style={{position:"fixed",top:18,right:18,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
      {list.map(t=>(
        <div key={t.id} style={{padding:"11px 18px",borderRadius:10,fontWeight:700,fontSize:14,
          background:clr[t.type]||clr.info,color:"#fff",
          boxShadow:"0 4px 24px rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.12)",
          fontFamily:"Georgia,serif",animation:"toastIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275)"}}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SETUP SCREEN  (3-step wizard)
// ════════════════════════════════════════════════════════════════════
function SetupScreen({onStart}){
  const [step,setStep]=useState(0);
  const [numPlayers,setNumPlayers]=useState(3);
  const [names,setNames]=useState(DEFAULT_NAMES.slice(0,3));
  const [initCoins,setInitCoins]=useState(1000);
  const [minBet,setMinBet]=useState(50);

  const updateName=(i,v)=>{const n=[...names];n[i]=v;setNames(n);};
  const setNum=(n)=>{setNumPlayers(n);setNames(DEFAULT_NAMES.slice(0,n));};
  const bankAfter=BANK_INIT-numPlayers*initCoins;
  const canFinish=bankAfter>=0&&minBet>=10;

  return(
    <div style={{minHeight:"100vh",fontFamily:"Georgia,serif",overflow:"hidden",position:"relative",
      background:"radial-gradient(ellipse at 50% 40%, #0b2e0b 0%, #040f04 55%, #000 100%)"}}>
      <style>{`
        @keyframes toastIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadeUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes float{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}50%{transform:translateY(-14px) rotate(var(--r,0deg))}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes glow{0%,100%{box-shadow:0 0 12px rgba(201,168,76,0.2)}50%{box-shadow:0 0 32px rgba(201,168,76,0.6)}}
        @keyframes stepIn{from{transform:translateX(30px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes resultPop{from{transform:scale(0.75);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes dealIn{from{transform:translateY(-30px) scale(0.85);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .gbtn{background:linear-gradient(135deg,#c9a84c,#8a6010);color:#1a0900;border:none;border-radius:10px;
          padding:14px 32px;font-size:15px;font-weight:900;cursor:pointer;letter-spacing:2px;
          text-transform:uppercase;font-family:Georgia,serif;
          box-shadow:0 4px 20px rgba(201,168,76,0.35),inset 0 1px 0 rgba(255,255,255,0.3);
          transition:transform 0.12s,box-shadow 0.12s;}
        .gbtn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(201,168,76,0.52),inset 0 1px 0 rgba(255,255,255,0.3);}
        .gbtn:active{transform:translateY(0);}
        .gbtn:disabled{opacity:0.38;cursor:not-allowed;transform:none;}
        .sbtn{background:rgba(255,255,255,0.05);color:#c9a84c;border:1px solid rgba(201,168,76,0.3);
          border-radius:10px;padding:13px 26px;font-size:14px;font-weight:700;cursor:pointer;
          letter-spacing:1px;font-family:Georgia,serif;transition:background 0.2s;}
        .sbtn:hover{background:rgba(201,168,76,0.12);}
        .rbtn{background:linear-gradient(135deg,#8B1a1a,#600f0f);color:#f0e6c8;
          border:1px solid rgba(201,168,76,0.18);border-radius:8px;padding:11px 20px;
          font-size:13px;font-weight:700;cursor:pointer;letter-spacing:1px;font-family:Georgia,serif;transition:opacity 0.2s;}
        .rbtn:hover{opacity:0.85;}
        input[type=range]{accent-color:#c9a84c;width:100%;cursor:pointer;}
        input[type=text]{background:rgba(255,255,255,0.07);border:1.5px solid rgba(201,168,76,0.28);
          color:#f0e6c8;padding:10px 14px;border-radius:8px;font-family:Georgia,serif;font-size:14px;
          outline:none;transition:border 0.2s;box-sizing:border-box;width:100%;}
        input[type=text]:focus{border-color:#c9a84c;}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#c9a84c33;border-radius:3px}
      `}</style>

      {/* Floating suit decorations */}
      {[{s:"♠",top:"7%",left:"4%",r:"-14deg",delay:0},{s:"♥",top:"12%",right:"5%",r:"11deg",delay:.6},
        {s:"♦",bottom:"10%",left:"6%",r:"9deg",delay:1.1},{s:"♣",bottom:"15%",right:"4%",r:"-8deg",delay:1.7}
      ].map((c,i)=>(
        <div key={i} style={{position:"absolute",...(c.left?{left:c.left}:{}),
          ...(c.right?{right:c.right}:{}),
          ...(c.top?{top:c.top}:{}),
          ...(c.bottom?{bottom:c.bottom}:{}),
          fontSize:64,color:RED_SUITS.includes(c.s)?"rgba(192,57,43,0.1)":"rgba(201,168,76,0.08)",
          "--r":c.r,animationDelay:`${c.delay}s`,
          animation:`float 4.5s ease-in-out ${c.delay}s infinite`,
          pointerEvents:"none",userSelect:"none",fontFamily:"Georgia,serif"}}>
          {c.s}
        </div>
      ))}

      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
        justifyContent:"center",padding:"24px 16px"}}>

        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:54,marginBottom:8,filter:"drop-shadow(0 0 24px rgba(201,168,76,0.4))"}}>🃏</div>
          <h1 style={{margin:0,fontSize:40,letterSpacing:8,
            background:"linear-gradient(135deg,#f5e18a,#c9a84c,#8a6010)",backgroundClip:"text",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            backgroundSize:"200%",animation:"shimmer 3s linear infinite",textTransform:"uppercase"}}>
            Between
          </h1>
          <p style={{margin:"5px 0 0",color:"#2a5a2a",fontSize:11,letterSpacing:5}}>THE CARD GAME</p>
        </div>

        {/* Wizard card */}
        <div style={{width:"100%",maxWidth:460,
          background:"rgba(4,16,4,0.88)",backdropFilter:"blur(12px)",
          border:"1.5px solid rgba(201,168,76,0.22)",borderRadius:20,
          boxShadow:"0 0 60px rgba(201,168,76,0.07),0 30px 80px rgba(0,0,0,0.75)",
          overflow:"hidden",animation:"fadeUp 0.5s ease"}}>

          {/* Progress */}
          <div style={{height:3,background:"rgba(255,255,255,0.05)"}}>
            <div style={{height:"100%",width:`${((step+1)/3)*100}%`,
              background:"linear-gradient(90deg,#c9a84c,#f5e18a)",transition:"width 0.45s ease"}}/>
          </div>

          <div style={{padding:"34px 38px"}}>

            {/* ── STEP 0: Number of Players ── */}
            {step===0&&(
              <div style={{animation:"stepIn 0.4s ease"}}>
                <div style={{color:"#3a6a3a",fontSize:10,letterSpacing:3,marginBottom:5}}>STEP 1 OF 3</div>
                <h2 style={{color:"#c9a84c",fontSize:22,margin:"0 0 8px",letterSpacing:1}}>
                  How many players?
                </h2>
                <p style={{color:"#2a4a2a",fontSize:12,margin:"0 0 24px",lineHeight:1.6}}>
                  Hot-seat mode — players pass the device on each turn.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:28}}>
                  {[2,3,4,5,6].map(n=>(
                    <button key={n} onClick={()=>setNum(n)} style={{
                      padding:"18px 0",fontSize:24,fontWeight:900,fontFamily:"Georgia,serif",
                      borderRadius:11,cursor:"pointer",border:"2.5px solid",transition:"all 0.18s",
                      background:numPlayers===n?"linear-gradient(135deg,#c9a84c,#8a6010)":"rgba(255,255,255,0.05)",
                      color:numPlayers===n?"#1a0900":"#c9a84c",
                      borderColor:numPlayers===n?"#c9a84c":"rgba(201,168,76,0.18)",
                      boxShadow:numPlayers===n?"0 4px 18px rgba(201,168,76,0.42)":"none",
                      transform:numPlayers===n?"scale(1.06)":"scale(1)"}}>
                      {n}
                    </button>
                  ))}
                </div>
                <button className="gbtn" style={{width:"100%"}} onClick={()=>setStep(1)}>
                  Continue →
                </button>
              </div>
            )}

            {/* ── STEP 1: Names ── */}
            {step===1&&(
              <div style={{animation:"stepIn 0.4s ease"}}>
                <div style={{color:"#3a6a3a",fontSize:10,letterSpacing:3,marginBottom:5}}>STEP 2 OF 3</div>
                <h2 style={{color:"#c9a84c",fontSize:22,margin:"0 0 6px",letterSpacing:1}}>
                  Enter player names
                </h2>
                <p style={{color:"#2a4a2a",fontSize:12,margin:"0 0 20px"}}>
                  Or keep the defaults and jump right in.
                </p>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:26}}>
                  {Array.from({length:numPlayers},(_,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:30,height:30,background:"rgba(201,168,76,0.12)",borderRadius:"50%",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:"#c9a84c",fontSize:12,fontWeight:900,flexShrink:0,
                        border:"1px solid rgba(201,168,76,0.25)"}}>
                        {i+1}
                      </div>
                      <input type="text" value={names[i]||""} maxLength={16}
                        onChange={e=>updateName(i,e.target.value)}
                        placeholder={`Player ${i+1}`}/>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button className="sbtn" onClick={()=>setStep(0)}>← Back</button>
                  <button className="gbtn" style={{flex:1}} onClick={()=>setStep(2)}>Continue →</button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Stakes ── */}
            {step===2&&(
              <div style={{animation:"stepIn 0.4s ease"}}>
                <div style={{color:"#3a6a3a",fontSize:10,letterSpacing:3,marginBottom:5}}>STEP 3 OF 3</div>
                <h2 style={{color:"#c9a84c",fontSize:22,margin:"0 0 22px",letterSpacing:1}}>Set the stakes</h2>

                {/* Starting coins */}
                <div style={{marginBottom:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                    <span style={{color:"#c9a84c",fontSize:11,letterSpacing:2}}>COINS PER PLAYER</span>
                    <span style={{color:"#f0e6c8",fontWeight:900,fontSize:18}}>{initCoins.toLocaleString()}</span>
                  </div>
                  <input type="range" min={100} max={10000} step={100} value={initCoins}
                    onChange={e=>{const v=+e.target.value;setInitCoins(v);if(minBet>v/4)setMinBet(Math.max(10,Math.floor(v/4)));}}/>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                    <span style={{fontSize:10,color:"#2a4a2a"}}>100</span>
                    <span style={{fontSize:10,color:"#2a4a2a"}}>10,000</span>
                  </div>
                </div>

                {/* Min bet */}
                <div style={{marginBottom:22}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                    <span style={{color:"#c9a84c",fontSize:11,letterSpacing:2}}>MINIMUM BET (R)</span>
                    <span style={{color:"#f0e6c8",fontWeight:900,fontSize:18}}>{minBet.toLocaleString()}</span>
                  </div>
                  <input type="range" min={10} max={Math.max(10,Math.floor(initCoins/4))} step={10}
                    value={minBet} onChange={e=>setMinBet(+e.target.value)}/>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                    <span style={{fontSize:10,color:"#2a4a2a"}}>10</span>
                    <span style={{fontSize:10,color:"#2a4a2a"}}>{Math.floor(initCoins/4)}</span>
                  </div>
                </div>

                {/* Summary */}
                <div style={{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.18)",
                  borderRadius:10,padding:"14px 16px",marginBottom:20}}>
                  <div style={{fontSize:10,color:"#3a6a3a",letterSpacing:2,marginBottom:10}}>GAME SUMMARY</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {[
                      ["Players",numPlayers],
                      ["Each gets",initCoins.toLocaleString()+"  🪙"],
                      ["Min bet",minBet.toLocaleString()+"  🎲"],
                      ["Bank starts",bankAfter>=0?bankAfter.toLocaleString()+"  🏦":"⚠ Reduce coins"],
                    ].map(([k,v])=>(
                      <div key={k}>
                        <div style={{fontSize:9,color:"#2a5a2a",letterSpacing:1,marginBottom:2}}>{k.toUpperCase()}</div>
                        <div style={{fontSize:14,fontWeight:700,
                          color:k==="Bank starts"&&bankAfter<0?"#e05555":"#c9a84c"}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {bankAfter<0&&(
                    <div style={{marginTop:10,color:"#e05555",fontSize:11,
                      padding:"6px 10px",background:"rgba(224,85,85,0.1)",borderRadius:6}}>
                      ⚠ Bank would start negative — reduce coins or player count.
                    </div>
                  )}
                </div>

                <div style={{display:"flex",gap:10}}>
                  <button className="sbtn" onClick={()=>setStep(1)}>← Back</button>
                  <button className="gbtn" style={{flex:1}} disabled={!canFinish}
                    onClick={()=>onStart({numPlayers,names:names.slice(0,numPlayers),initCoins,minBet})}>
                    🃏 Start Game!
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How to play */}
        <div style={{maxWidth:460,width:"100%",marginTop:18,padding:"13px 18px",
          background:"rgba(0,0,0,0.4)",borderRadius:12,border:"1px solid rgba(201,168,76,0.1)"}}>
          <p style={{color:"#1e3e1e",fontSize:11,margin:0,lineHeight:1.9,letterSpacing:0.3}}>
            <span style={{color:"#c9a84c",fontWeight:700}}>HOW TO PLAY</span>
            {" "}· You receive 2 open cards. Bet if the 3rd card falls <em>between</em> them.
            Win → earn your bet from the bank. Lose → bank takes your bet.
            {" "}<span style={{color:"#e05555",fontWeight:700}}>Equal card → lose 2× your bet!</span>
            {" "}Running low on coins? Borrow from the bank.
          </p>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN GAME
// ════════════════════════════════════════════════════════════════════
export default function App(){
  const [screen,setScreen]=useState("setup");
  const [config,setConfig]=useState(null);
  const [deck,setDeck]=useState([]);
  const [deckPos,setDeckPos]=useState(0);
  const [bank,setBank]=useState(BANK_INIT);
  const [players,setPlayers]=useState([]);
  const [turnIdx,setTurnIdx]=useState(0);
  const [roundStart,setRoundStart]=useState(0);
  const [roundNum,setRoundNum]=useState(1);
  const [acted,setActed]=useState([]);
  const [phase,setPhase]=useState("decision");
  const [cards,setCards]=useState({c1:null,c2:null,c3:null});
  const [bet,setBet]=useState(0);
  const [flipC3,setFlipC3]=useState(false);
  const [result,setResult]=useState(null);
  const [toasts,setToasts]=useState([]);
  const [showBoard,setShowBoard]=useState(false);
  const tid=useRef(0);

  const toast=useCallback((msg,type="info")=>{
    const id=tid.current++;
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  },[]);

  const drawCard=(d,p)=>{
    let dd=d,pp=p;
    if(pp>=dd.length){dd=buildDeck();pp=0;}
    return{card:dd[pp],deck:dd,pos:pp+1};
  };

  const startGame=(cfg)=>{
    const d=buildDeck();
    const ps=cfg.names.map((name,i)=>({id:i,name,coins:cfg.initCoins,debt:0,wins:0,losses:0}));
    setConfig(cfg);setDeck(d);setDeckPos(0);
    setBank(BANK_INIT-cfg.numPlayers*cfg.initCoins);
    setPlayers(ps);setTurnIdx(0);setRoundStart(0);setRoundNum(1);
    setActed(new Array(cfg.numPlayers).fill(false));
    setCards({c1:null,c2:null,c3:null});
    setPhase("decision");setResult(null);setFlipC3(false);
    setScreen("game");
  };

  const dealCards=()=>{
    let d=deck,p=deckPos;
    const r1=drawCard(d,p);d=r1.deck;p=r1.pos;
    const r2=drawCard(d,p);d=r2.deck;p=r2.pos;
    setDeck(d);setDeckPos(p);
    setCards({c1:r1.card,c2:r2.card,c3:null});
    setBet(config.minBet);
    setFlipC3(false);setResult(null);
    setPhase("betting");
  };

  const doSkip=()=>{
    toast(`${players[turnIdx].name} skipped this round.`,"info");
    advance(false);
  };

  const placeBet=()=>{
    if(bet<config.minBet){toast(`Min bet is ${config.minBet}`,"warn");return;}
    let ps=[...players],bk=bank;
    const cur=ps[turnIdx];
    const actualBet=bet;
    if(cur.coins<actualBet){
      const need=actualBet-cur.coins;
      ps[turnIdx]={...cur,coins:cur.coins+need,debt:cur.debt+need};
      bk-=need;
      toast(`${cur.name} borrowed ${need.toLocaleString()} 💸`,"warn");
    }
    setPlayers(ps);setBank(bk);
    setPhase("revealing");
    const r3=drawCard(deck,deckPos);
    setDeck(r3.deck);setDeckPos(r3.pos);
    const c3=r3.card;
    setCards(prev=>({...prev,c3}));
    setTimeout(()=>setFlipC3(true),100);
    setTimeout(()=>{
      const c1=cards.c1,c2=cards.c2;
      const lo=Math.min(c1.value,c2.value),hi=Math.max(c1.value,c2.value);
      let type,delta;
      if(c3.value===lo||c3.value===hi){type="equal";delta=-(actualBet*2);}
      else if(c3.value>lo&&c3.value<hi){type="win";delta=actualBet;}
      else{type="lose";delta=-actualBet;}
      let psCopy=[...ps],bkCopy=bk;
      const p2=psCopy[turnIdx];
      if(type==="win"){
        psCopy[turnIdx]={...p2,coins:p2.coins+delta,wins:p2.wins+1};
        bkCopy-=delta;
        toast(`🎉 ${p2.name} wins ${delta.toLocaleString()}!`,"win");
      }else{
        const loss=Math.abs(delta);
        psCopy[turnIdx]={...p2,coins:p2.coins+delta,losses:p2.losses+1};
        bkCopy+=loss;
        toast(type==="equal"?`⚠ Equal! ${p2.name} loses ${loss.toLocaleString()} (2×)!`:
          `💸 ${p2.name} loses ${loss.toLocaleString()}!`,type==="equal"?"warn":"lose");
      }
      setPlayers(psCopy);setBank(bkCopy);
      const msg=type==="win"?`🎉 WIN!  +${delta.toLocaleString()} coins`:
        type==="equal"?`⚠️ EQUAL — lose ${Math.abs(delta).toLocaleString()} coins (2×)`:
        `💸 LOSE — −${Math.abs(delta).toLocaleString()} coins`;
      setResult({type,msg});
      setPhase("result");
      setTimeout(()=>advance(type==="win"),2400);
    },1900);
  };

  const advance=(wasWin)=>{
    setActed(prev=>{
      const next=[...prev];next[turnIdx]=true;
      const allDone=next.every(Boolean);
      if(allDone){
        const ns=wasWin?(turnIdx+1)%config.numPlayers:(roundStart+1)%config.numPlayers;
        setRoundStart(ns);setTurnIdx(ns);
        setActed(new Array(config.numPlayers).fill(false));
        setRoundNum(r=>r+1);
      }else{
        let nxt=(turnIdx+1)%config.numPlayers;
        while(next[nxt])nxt=(nxt+1)%config.numPlayers;
        setTurnIdx(nxt);
      }
      setPhase("decision");setCards({c1:null,c2:null,c3:null});
      setResult(null);setFlipC3(false);
      return allDone?new Array(config.numPlayers).fill(false):next;
    });
  };

  if(screen==="setup") return <SetupScreen onStart={startGame}/>;

  const cur=players[turnIdx];
const sorted = [...players].sort((a, b) => {
  const netA = a.coins - a.debt;
  const netB = b.coins - b.debt;
  return netB - netA;
});
  const lo=cards.c1&&cards.c2?Math.min(cards.c1.value,cards.c2.value):null;
  const hi=cards.c1&&cards.c2?Math.max(cards.c1.value,cards.c2.value):null;
  const spread=hi!==null?hi-lo:0;

  return(
    <div style={{minHeight:"100vh",fontFamily:"Georgia,serif",color:"#f0e6c8",
      background:"radial-gradient(ellipse at 50% 30%, #0a2e0a 0%, #040f04 55%, #000 100%)"}}>
      <style>{`
        @keyframes toastIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadeUp{from{transform:translateY(28px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes glow{0%,100%{box-shadow:0 0 10px rgba(201,168,76,0.18)}50%{box-shadow:0 0 30px rgba(201,168,76,0.58)}}
        @keyframes resultPop{from{transform:scale(0.75);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes dealIn{from{transform:translateY(-28px) scale(0.88);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .gbtn{background:linear-gradient(135deg,#c9a84c,#8a6010);color:#1a0900;border:none;border-radius:10px;
          padding:13px 28px;font-size:14px;font-weight:900;cursor:pointer;letter-spacing:2px;
          text-transform:uppercase;font-family:Georgia,serif;
          box-shadow:0 4px 18px rgba(201,168,76,0.35),inset 0 1px 0 rgba(255,255,255,0.3);
          transition:transform 0.12s,box-shadow 0.12s;}
        .gbtn:hover{transform:translateY(-2px);box-shadow:0 8px 26px rgba(201,168,76,0.5),inset 0 1px 0 rgba(255,255,255,0.3);}
        .gbtn:disabled{opacity:0.38;cursor:not-allowed;transform:none;}
        .sbtn{background:rgba(255,255,255,0.05);color:#c9a84c;border:1px solid rgba(201,168,76,0.28);
          border-radius:8px;padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;
          letter-spacing:1px;font-family:Georgia,serif;transition:background 0.2s;}
        .sbtn:hover{background:rgba(201,168,76,0.12);}
        .rbtn{background:linear-gradient(135deg,#8B1a1a,#600f0f);color:#f0e6c8;
          border:1px solid rgba(201,168,76,0.18);border-radius:8px;padding:10px 18px;
          font-size:13px;font-weight:700;cursor:pointer;letter-spacing:1px;font-family:Georgia,serif;transition:opacity 0.2s;}
        .rbtn:hover{opacity:0.85;}
        input[type=range]{accent-color:#c9a84c;width:100%;cursor:pointer;}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#c9a84c33;border-radius:3px}
      `}</style>

      <Toasts list={toasts}/>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"11px 20px",borderBottom:"1px solid rgba(201,168,76,0.13)",
        background:"rgba(0,0,0,0.52)",backdropFilter:"blur(8px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:19,color:"#c9a84c",letterSpacing:4,fontWeight:900}}>BETWEEN</span>
          <span style={{background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.22)",
            borderRadius:20,padding:"3px 11px",fontSize:10,color:"#c9a84c",letterSpacing:2}}>
            ROUND {roundNum}
          </span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{padding:"5px 13px",background:"rgba(201,168,76,0.07)",
            border:"1px solid rgba(201,168,76,0.22)",borderRadius:20,fontSize:13}}>
            🏦 <span style={{color:"#c9a84c",fontWeight:700}}>{bank.toLocaleString()}</span>
          </div>
          <button className="sbtn" onClick={()=>setShowBoard(b=>!b)} style={{fontSize:11,padding:"6px 13px"}}>
            {showBoard?"◀ Table":"🏆 Board"}
          </button>
          <button className="sbtn" onClick={()=>setScreen("setup")} style={{fontSize:11,padding:"6px 11px"}}>⚙ New</button>
        </div>
      </div>

      <div style={{display:"flex",height:"calc(100vh - 55px)"}}>

        {/* Leaderboard */}
        {showBoard&&(
          <div style={{width:248,background:"rgba(0,0,0,0.55)",borderRight:"1px solid rgba(201,168,76,0.13)",
            padding:16,overflowY:"auto",flexShrink:0,animation:"fadeUp 0.3s ease"}}>
            <div style={{fontSize:10,color:"#3a6a3a",letterSpacing:3,marginBottom:13}}>🏆 STANDINGS</div>
            {sorted.map((p,rank)=>{
              const medal=["🥇","🥈","🥉"][rank]||`#${rank+1}`;
              const isCur=p.id===turnIdx;
              return(
                <div key={p.id} style={{marginBottom:8,padding:"10px 12px",borderRadius:9,
                  background:isCur?"rgba(201,168,76,0.09)":"rgba(255,255,255,0.03)",
                  border:isCur?"1px solid rgba(201,168,76,0.42)":"1px solid rgba(255,255,255,0.05)",
                  animation:isCur?"glow 2.5s ease-in-out infinite":"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                    <span style={{fontSize:14}}>{medal}</span>
                    <span style={{fontSize:13,fontWeight:700,color:isCur?"#c9a84c":"#f0e6c8",flex:1,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:16,fontWeight:900,color:p.coins<0?"#e05555":"#5cb85c"}}>
                      {p.coins.toLocaleString()}
                    </span>
                    <span style={{fontSize:10,color:"#2a4a2a"}}>W{p.wins}/L{p.losses}</span>
                  </div>
                  {p.debt>0&&<div style={{fontSize:10,color:"rgba(224,85,85,0.7)",marginTop:2}}>
                    ⚠ Debt: {p.debt.toLocaleString()}
                  </div>}
                </div>
              );
            })}
            <div style={{marginTop:14,padding:"10px 12px",background:"rgba(201,168,76,0.05)",
              borderRadius:8,fontSize:11,color:"#2a4a2a",lineHeight:1.9}}>
              <div>Deck: <strong style={{color:"#c9a84c"}}>{52-(deckPos%52)||52}</strong> remaining</div>
              <div>Min bet: <strong style={{color:"#c9a84c"}}>{config.minBet}</strong></div>
            </div>
          </div>
        )}

        {/* Main area */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Players strip */}
          <div style={{display:"flex",gap:10,padding:"11px 15px",overflowX:"auto",flexShrink:0,
            borderBottom:"1px solid rgba(201,168,76,0.08)",background:"rgba(0,0,0,0.32)"}}>
            {players.map((p,i)=>{
              const isCur=i===turnIdx;
              const done=acted[i];
              return(
                <div key={p.id} style={{minWidth:124,padding:"9px 12px",borderRadius:10,textAlign:"center",
                  flexShrink:0,transition:"all 0.3s",
                  background:isCur?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.035)",
                  border:isCur?"2px solid #c9a84c":"2px solid rgba(255,255,255,0.06)",
                  animation:isCur?"glow 2.5s ease-in-out infinite":"none",
                  opacity:done&&!isCur?0.5:1}}>
                  <div style={{fontSize:9,color:isCur?"#c9a84c":done?"#2a5a2a":"#2a4a2a",letterSpacing:1,marginBottom:2}}>
                    {isCur?"▶ PLAYING":done?"✓ DONE":"WAITING"}
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:isCur?"#c9a84c":"#f0e6c8",marginBottom:3,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:16,fontWeight:900,color:p.coins<0?"#e05555":"#5cb85c"}}>
                    {p.coins.toLocaleString()}
                  </div>
                  {p.debt>0&&<div style={{fontSize:9,color:"rgba(224,85,85,0.8)",marginTop:1}}>
                    Debt {p.debt.toLocaleString()}
                  </div>}
                </div>
              );
            })}
          </div>

          {/* Casino table */}
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
            overflow:"auto",padding:"20px 16px",position:"relative",
            background:"radial-gradient(ellipse at 50% 45%, #0d3a0d 0%, #071507 65%, transparent 100%)"}}>

            {/* Felt texture */}
            <div style={{position:"absolute",inset:0,opacity:0.25,
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='3' height='3'%3E%3Ccircle cx='1' cy='1' r='0.55' fill='rgba(0,70,0,0.5)'/%3E%3C/svg%3E")`}}/>

            <div style={{position:"relative",width:"100%",maxWidth:570}}>

              {/* Current player */}
              <div style={{textAlign:"center",marginBottom:18}}>
                <div style={{fontSize:10,color:"#2a5a2a",letterSpacing:3,marginBottom:3}}>NOW PLAYING</div>
                <div style={{fontSize:28,fontWeight:900,
                  background:"linear-gradient(135deg,#f5e18a,#c9a84c,#8a6010)",backgroundClip:"text",
                  WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundSize:"200%",
                  animation:"shimmer 3s linear infinite",letterSpacing:2}}>
                  {cur?.name}
                </div>
                <div style={{fontSize:12,color:"#2a6a2a",marginTop:2}}>
                  💰 {cur?.coins.toLocaleString()} coins
                  {cur?.debt>0&&<span style={{color:"#e05555",marginLeft:8}}>· Debt: {cur.debt.toLocaleString()}</span>}
                </div>
              </div>

              {/* Card surface */}
              <div style={{background:"rgba(0,0,0,0.32)",borderRadius:18,
                border:"1px solid rgba(201,168,76,0.1)",padding:"26px 18px",
                marginBottom:18,minHeight:175,
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>

                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,flexWrap:"wrap"}}>
                  {cards.c1?(<>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                      <div style={{fontSize:9,color:"#2a5a2a",letterSpacing:2}}>CARD 1</div>
                      <div style={{animation:"dealIn 0.4s ease"}}><PlayingCard 
  key={cards.c1?.rank + cards.c1?.suit}
  card={cards.c1} 
  size="lg"
/></div>
                    </div>

                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                      {lo!==null&&(
                        <div style={{textAlign:"center",padding:"5px 13px",borderRadius:20,
                          background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.18)",
                          fontSize:10,color:spread<=1?"#e05555":spread>=5?"#5cb85c":"#c9a84c"}}>
                          {spread<=1?"⚠ HIGH RISK":spread>=5?"✓ GOOD ODDS":""}&nbsp;
                          {spread>1&&<span style={{color:"#3a6a3a"}}>WIN: {lo+1}–{hi-1}</span>}
                          {spread<=1&&<span style={{color:"#e05555"}}>&nbsp;WIN: {lo+1}–{hi-1}</span>}
                        </div>
                      )}
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <div style={{fontSize:9,color:"#2a5a2a",letterSpacing:2}}>3RD CARD</div>
                        {cards.c3?(
                          <div style={{animation:"dealIn 0.3s ease"}}>
                            <PlayingCard card={cards.c3} faceDown={!flipC3} flipping={flipC3} size="lg"
                              glow={result?.type==="win"}/>
                          </div>
                        ):(
                          <div style={{width:96,height:136,borderRadius:9,
                            border:"2px dashed rgba(201,168,76,0.22)",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            animation:phase==="revealing"?"pulse 0.7s ease infinite":"none"}}>
                            <span style={{color:"#1a3a1a",fontSize:26}}>{phase==="revealing"?"⟳":"?"}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                      <div style={{fontSize:9,color:"#2a5a2a",letterSpacing:2}}>CARD 2</div>
                      <div style={{animation:"dealIn 0.4s ease 0.1s both"}}><PlayingCard 
  key={cards.c2?.rank + cards.c2?.suit}
  card={cards.c2} 
  size="lg"
/></div>
                    </div>
                  </>):(
                    <div style={{color:"#1a3a1a",fontSize:13,letterSpacing:2,padding:"18px 0"}}>
                      AWAITING PLAYER ACTION…
                    </div>
                  )}
                </div>

                {/* Result */}
                {result&&(
                  <div style={{width:"100%",padding:"13px",borderRadius:12,textAlign:"center",
                    animation:"resultPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275)",
                    background:result.type==="win"?"rgba(25,110,25,0.22)":
                      result.type==="equal"?"rgba(150,90,0,0.22)":"rgba(130,20,20,0.22)",
                    border:`1px solid ${result.type==="win"?"rgba(40,180,40,0.38)":
                      result.type==="equal"?"rgba(190,140,0,0.38)":"rgba(190,40,40,0.38)"}`}}>
                    <div style={{fontSize:20,fontWeight:900,
                      color:result.type==="win"?"#5cb85c":result.type==="equal"?"#f0a500":"#e05555"}}>
                      {result.msg}
                    </div>
                    {result.type==="equal"&&(
                      <div style={{fontSize:10,color:"rgba(240,165,0,0.7)",marginTop:3,letterSpacing:1}}>
                        EQUAL CARD = DOUBLE PENALTY ⚠
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              {phase==="decision"&&(
                <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                  <button className="gbtn" onClick={dealCards} style={{fontSize:16,padding:"16px 44px"}}>
                    🃏 Deal My Cards
                  </button>
                  <button className="rbtn" onClick={doSkip} style={{padding:"16px 22px"}}>
                    Skip Turn
                  </button>
                </div>
              )}

              {phase==="betting"&&cur&&(
                <div style={{background:"rgba(0,0,0,0.42)",borderRadius:14,padding:"18px 20px",
                  border:"1px solid rgba(201,168,76,0.15)"}}>
                  <div style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                      <span style={{color:"#c9a84c",fontSize:11,letterSpacing:2}}>YOUR BET</span>
                      <span style={{color:"#f0e6c8",fontWeight:900,fontSize:22}}>{bet.toLocaleString()}</span>
                    </div>
                    <input type="range" min={config.minBet}
                      max={Math.max(cur.coins*2,config.minBet*20)}
                      step={config.minBet} value={bet}
                      onChange={e=>setBet(+e.target.value)}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                      <span style={{fontSize:9,color:"#1a3a1a"}}>Min {config.minBet}</span>
                      <span style={{fontSize:9,color:"#1a3a1a"}}>Balance: {cur.coins.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:7,marginBottom:13,flexWrap:"wrap"}}>
                    {[1,2,5,10].map(m=>{
                      const v=config.minBet*m;
                      return(
                        <button key={m} className="sbtn" onClick={()=>setBet(v)}
                          style={{fontSize:11,padding:"6px 11px",
                            borderColor:bet===v?"#c9a84c":"rgba(201,168,76,0.22)",
                            color:bet===v?"#c9a84c":"#3a5a3a"}}>
                          {m}× ({v})
                        </button>
                      );
                    })}
                    <button className="sbtn" onClick={()=>setBet(Math.max(cur.coins,config.minBet))}
                      style={{fontSize:11,padding:"6px 11px",color:"#e05555",borderColor:"rgba(224,85,85,0.35)"}}>
                      ALL IN
                    </button>
                  </div>
                  {bet>cur.coins&&(
                    <div style={{marginBottom:11,padding:"7px 11px",background:"rgba(224,165,0,0.09)",
                      border:"1px solid rgba(224,165,0,0.28)",borderRadius:8,
                      color:"#f0a500",fontSize:11,textAlign:"center"}}>
                      ⚠ Will borrow <strong>{(bet-cur.coins).toLocaleString()}</strong> from bank
                    </div>
                  )}
                  <div style={{display:"flex",gap:10}}>
                    <button className="gbtn" style={{flex:1,fontSize:14,padding:"13px"}} onClick={placeBet}>
                      Place Bet &amp; Draw 🎲
                    </button>
                    <button className="rbtn" onClick={()=>{
                      setPhase("decision");setCards({c1:null,c2:null,c3:null});setResult(null);
                    }}>Cancel</button>
                  </div>
                </div>
              )}

              {phase==="revealing"&&(
                <div style={{textAlign:"center",color:"#1a4a1a",fontSize:12,letterSpacing:2,
                  animation:"pulse 0.8s ease infinite"}}>
                  DRAWING THIRD CARD…
                </div>
              )}

              {phase==="result"&&(
                <div style={{textAlign:"center",color:"#1a3a1a",fontSize:11,letterSpacing:2}}>
                  Next player up in a moment…
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
