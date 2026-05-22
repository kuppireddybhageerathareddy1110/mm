import { useEffect } from "react";
import { Shell } from "@/components/Shell";

export default function EmotionalPage() {
  useEffect(() => {
    // Load p5.js library
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js";
    script.onload = () => {
      // Once p5 is loaded, inject the sketch code
      const sketch = document.createElement("script");
      sketch.type = "text/javascript";
      sketch.text = `
        let params = {
          seed: 12345,
          particleCount: 3000,
          attractStrength: 0.04,
          turbulence: 0.007,
          decay: 0.025,
          spread: 0.28,
          repulsion: 35,
          wobble: 0.45
        };
        let defaultParams = {...params};
        let attractors = [];
        let particles = [];
        let frameCount = 0;
        let pg;
        new p5(function(p) {
          p.setup = function() {
            let sz = Math.min(window.innerWidth - 360, window.innerHeight - 40, 780);
            sz = Math.max(sz, 480);
            let canvas = p.createCanvas(sz, sz);
            canvas.parent('canvas-container');
            p.pixelDensity(1);
            pg = p.createGraphics(sz, sz);
            pg.pixelDensity(1);
            initializeSystem();
          };
          function initializeSystem() {
            p.randomSeed(params.seed);
            p.noiseSeed(params.seed);
            frameCount = 0;
            let W = p.width, H = p.height;
            let cx = W/2, cy = H/2;
            let spread = params.spread;
            attractors = [
              {x: cx + W*spread, y: cy - H*spread*0.6, r:255,g:184,b:0, label:'Positive', polarity:1.0},
              {x: cx - W*spread, y: cy - H*spread*0.6, r:255,g:60,b:100, label:'Negative', polarity:-1.0},
              {x: cx, y: cy + H*spread*0.8, r:0,g:210,b:255, label:'Neutral', polarity:0.0}
            ];
            pg.background(8,8,12);
            particles = [];
            for(let i=0;i<params.particleCount;i++){
              let px = p.random(W), py = p.random(H);
              let noiseVal = p.noise(px*0.003, py*0.003, params.seed*0.01);
              let polarity = (noiseVal-0.5)*2;
              particles.push({x:px,y:py,vx:(p.random()-0.5)*0.8,vy:(p.random()-0.5)*0.8,polarity,life:p.random(0.6,1.0),age:0,noiseOffset:p.random(1000)});
            }
          }
          window.initializeSystem = initializeSystem;
          p.draw = function(){
            p.image(pg,0,0);
            p.background(8,8,12,8);
            frameCount++;
            let W=p.width, H=p.height;
            let maxAge=280;
            for(let i=particles.length-1;i>=0;i--){
              let pt=particles[i];
              pt.age++;
              let noiseAngle = p.noise(pt.x*params.turbulence, pt.y*params.turbulence, pt.noiseOffset+frameCount*0.002)*p.TWO_PI*4;
              let turbX = Math.cos(noiseAngle)*params.wobble;
              let turbY = Math.sin(noiseAngle)*params.wobble;
              let totalFx=turbX, totalFy=turbY;
              let closestDist=Infinity;
              let closestAttractor=attractors[2];
              for(let att of attractors){
                let dx=att.x-pt.x, dy=att.y-pt.y;
                let dist=Math.sqrt(dx*dx+dy*dy);
                if(dist<closestDist){closestDist=dist;closestAttractor=att;}
                let affinity=1-Math.abs(pt.polarity-att.polarity)*0.6;
                affinity=Math.max(0.15,affinity);
                if(dist<params.repulsion){
                  let rep=(params.repulsion-dist)/params.repulsion;
                  totalFx-=(dx/dist)*rep*0.8;
                  totalFy-=(dy/dist)*rep*0.8;
                } else {
                  let strength=params.attractStrength*affinity/(dist*0.015+1);
                  totalFx+=(dx/dist)*strength;
                  totalFy+=(dy/dist)*strength;
                }
              }
              pt.vx=(pt.vx+totalFx)*(1-params.decay);
              pt.vy=(pt.vy+totalFy)*(1-params.decay);
              let speed=Math.sqrt(pt.vx*pt.vx+pt.vy*pt.vy);
              if(speed>3.5){pt.vx*=3.5/speed;pt.vy*=3.5/speed;}
              let prevX=pt.x, prevY=pt.y;
              pt.x+=pt.vx; pt.y+=pt.vy;
              let lifeFrac=1-pt.age/maxAge;
              let posR=closestAttractor.r, posG=closestAttractor.g, posB=closestAttractor.b;
              let blendT=Math.min(closestDist/(W*0.35),1);
              let polR,polG,polB;
              if(pt.polarity>0){
                polR=p.lerp(0,255,pt.polarity);
                polG=p.lerp(210,184,pt.polarity);
                polB=p.lerp(255,0,pt.polarity);
              } else {
                polR=p.lerp(0,255,-pt.polarity);
                polG=p.lerp(210,60,-pt.polarity);
                polB=p.lerp(255,100,-pt.polarity);
              }
              let r=p.lerp(posR,polR,blendT*0.5);
              let g=p.lerp(posG,polG,blendT*0.5);
              let b=p.lerp(posB,polB,blendT*0.5);
              let speedFactor=Math.min(speed/2.5,1);
              let alpha=lifeFrac*(0.35+speedFactor*0.65)*255;
              pg.stroke(r,g,b,alpha*0.6);
              pg.strokeWeight(speedFactor*1.5+0.4);
              pg.line(prevX,prevY,pt.x,pt.y);
              p.noStroke();
              p.fill(r,g,b,alpha*0.9);
              p.circle(pt.x,pt.y,speedFactor*2.5+0.6);
              if(pt.age>maxAge||pt.x<0||pt.x>W||pt.y<0||pt.y>H){
                let spx=p.random(W), spy=p.random(H);
                let noiseVal=p.noise(spx*0.003,spy*0.003,(frameCount+params.seed)*0.005);
                pt.x=spx; pt.y=spy;
                pt.vx=(p.random()-0.5)*0.8;
                pt.vy=(p.random()-0.5)*0.8;
                pt.polarity=(noiseVal-0.5)*2;
                pt.age=0;
                pt.noiseOffset=p.random(1000);
              }
            }
            p.noStroke();
            p.textFont('Outfit');
            for(let att of attractors){
              let glow=Math.abs(Math.sin(frameCount*0.025))*40+30;
              p.fill(att.r,att.g,att.b,glow);
              p.textSize(10);
              p.textAlign(p.CENTER);
              p.text(att.label.toUpperCase(), att.x, att.y-10);
              p.fill(att.r,att.g,att.b,80+glow*1.5);
              p.circle(att.x,att.y,8);
            }
            if(frameCount>900) p.noLoop();
          };
          p.mousePressed = function(){ if(p.frameCount>900) p.loop(); };
          window.downloadPNG = function(){ p.saveCanvas('emotional-crystallization-seed-'+params.seed,'png'); };
        });
        function updateParam(name,value){
          params[name]=value;
          document.getElementById(name+'-value').textContent=value;
          initializeSystem();
        }
        function updateSeedDisplay(){ document.getElementById('seed-input').value=params.seed; }
        function updateSeed(){ let v=parseInt(document.getElementById('seed-input').value); if(v>0){ params.seed=v; initializeSystem(); } }
        function previousSeed(){ params.seed=Math.max(1,params.seed-1); updateSeedDisplay(); initializeSystem(); }
        function nextSeed(){ params.seed++; updateSeedDisplay(); initializeSystem(); }
        function randomSeedAndUpdate(){ params.seed=Math.floor(Math.random()*999999)+1; updateSeedDisplay(); initializeSystem(); }
        function resetParameters(){
          params={...defaultParams};
          const ids=['particleCount','attractStrength','turbulence','decay','spread','repulsion','wobble'];
          for(let id of ids){
            const el=document.getElementById(id);
            if(el){ el.value=params[id]; document.getElementById(id+'-value').textContent=params[id]; }
          }
          updateSeedDisplay();
          initializeSystem();
        }
        window.addEventListener('load', updateSeedDisplay);
      `;
      document.body.appendChild(sketch);
    };
    document.body.appendChild(script);
    // Cleanup on unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <Shell>
      <div className="emotional-container">
        <div className="ambient-glow-1" />
        <div className="ambient-glow-2" />
        <aside className="emotional-sidebar">
          <a href="http://127.0.0.1:3001" className="back-link">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            Back to Sentiment Studio
          </a>
          <h1>Emotional Crystallization</h1>
          <p className="subtitle">Words as particles drifting toward sentiment attractors — a generative map of language's emotional charge.</p>
          <div className="badges">
            <span className="badge badge-pos">Positive</span>
            <span className="badge badge-neg">Negative</span>
            <span className="badge badge-neu">Neutral</span>
          </div>
          {/* Controls - simplified for brevity */}
          <div className="control-section">
            <h3>Seed</h3>
            <input type="number" className="seed-input" id="seed-input" defaultValue={12345} onChange={() => updateSeed()} />
            <div className="seed-controls">
              <button onClick={previousSeed}>← Prev</button>
              <button onClick={nextSeed}>Next →</button>
            </div>
            <button style={{width:'100%'}} onClick={randomSeedAndUpdate}>⚄ Random Seed</button>
          </div>
          {/* Additional control sections could be added here following the original HTML */}
        </aside>
        <div className="emotional-canvas-area">
          <div id="canvas-container" />
        </div>
      </div>
    </Shell>
  );
}
