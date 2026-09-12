import { SCENE, WATER, smooth } from "./scene-model.js?v=20260912-29";

import { drawWaterFieldFallback } from "./water-field-fallback.js?v=20260912-29";

export const WATER_REFLECTION = Object.freeze({
  left: SCENE.width * 0.36,
  right: SCENE.width * 0.72,
  top: SCENE.height * 0.925,
  bottom: SCENE.height * 0.995,
  blendStart: SCENE.height * 0.97,
  tailStart: SCENE.height * 0.985,
  bandHeight: SCENE.height * 0.12,
});

const mirror = (value) => 1 - Math.abs((((value % 2) + 2) % 2) - 1);

function reflectionPhases(x, y, time, motion) {
  const depth = (y - WATER_REFLECTION.blendStart) / SCENE.height;
  return {
    horizontal:
      (x - WATER_REFLECTION.left) /
        (WATER_REFLECTION.right - WATER_REFLECTION.left) +
      Math.sin(depth * 7.3) * 0.035 +
      Math.sin(depth * 17.1) * 0.015 +
      (Math.sin(time * 0.02) * 0.002 +
        Math.sin(y * 0.08 + time * 0.6) * 0.003) *
        motion,
    vertical:
      depth / 0.12 +
      (Math.sin((x / SCENE.width) * 9 + time * 0.3) * 0.025 +
        Math.sin(time * 0.01) * 0.015) *
        motion,
  };
}

export function waterReflectionPoint(x, y, time, reduced = false) {
  const phase = reflectionPhases(x, y, time, reduced ? 0.08 : 1);
  return {
    x:
      WATER_REFLECTION.left +
      mirror(phase.horizontal) *
        (WATER_REFLECTION.right - WATER_REFLECTION.left),
    y:
      WATER_REFLECTION.top +
      mirror(phase.vertical) * (WATER_REFLECTION.bottom - WATER_REFLECTION.top),
  };
}

const vertex = `attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 uv;uniform sampler2D dayImage;uniform sampler2D nightImage;
uniform vec2 size;uniform vec3 layout;uniform float clock;uniform float night;uniform float motion;uniform float portrait;uniform vec2 lights;uniform sampler2D waterField;uniform vec4 waterDomain;
float box(vec2 p,vec4 r){return smoothstep(r.x-.005,r.x,p.x)*(1.-smoothstep(r.z,r.z+.005,p.x))*smoothstep(r.y-.005,r.y,p.y)*(1.-smoothstep(r.w,r.w+.005,p.y));}
float mirror(float value){return 1.-abs(mod(value,2.)-1.);}
vec2 reflectionPoint(vec2 p){
 float depth=p.y-${WATER_REFLECTION.blendStart / SCENE.height};
 float horizontal=(p.x-${WATER_REFLECTION.left / SCENE.width})/${(WATER_REFLECTION.right - WATER_REFLECTION.left) / SCENE.width}+sin(depth*7.3)*.035+sin(depth*17.1)*.015+(sin(clock*.02)*.002+sin(p.y*81.92+clock*.6)*.003)*motion;
 float vertical=depth/.12+(sin(p.x*9.+clock*.3)*.025+sin(clock*.01)*.015)*motion;
 return vec2(${WATER_REFLECTION.left / SCENE.width}+mirror(horizontal)*${(WATER_REFLECTION.right - WATER_REFLECTION.left) / SCENE.width},${WATER_REFLECTION.top / SCENE.height}+mirror(vertical)*${(WATER_REFLECTION.bottom - WATER_REFLECTION.top) / SCENE.height});
}
void main(){
 vec2 pixel=vec2(uv.x,1.-uv.y)*size;
 vec2 p=(pixel-layout.xy)/layout.z/vec2(1536.,1024.);
 float shore=${WATER.shoreY / SCENE.height}+p.x*${(WATER.shoreSlope * SCENE.width) / SCENE.height};
 float belowBanks=max(min(p.y,1.)-${WATER.bankStartY / SCENE.height},0.);
 float water=smoothstep(shore+${WATER.shoreFadeStart / SCENE.height},shore+${WATER.shoreFadeEnd / SCENE.height},p.y)*smoothstep(${WATER.leftOuter / SCENE.width}+belowBanks*${(WATER.leftSlope * SCENE.height) / SCENE.width},${WATER.leftInner / SCENE.width}+belowBanks*${(WATER.leftSlope * SCENE.height) / SCENE.width},p.x)*(1.-smoothstep(${WATER.rightInner / SCENE.width}-belowBanks*${(WATER.rightSlope * SCENE.height) / SCENE.width},${WATER.rightOuter / SCENE.width}-belowBanks*${(WATER.rightSlope * SCENE.height) / SCENE.width},p.x));
 if(p.x<0.||p.x>1.||p.y<0.){water=0.;}
 float extension=smoothstep(${WATER.surfaceFadeStart / SCENE.height},${WATER.surfaceFadeEnd / SCENE.height},p.y);
 float surface=mix(water,1.,extension);
 vec2 q=p;
 float wave=(sin(p.y*265.+clock*1.25+p.x*7.)+sin(p.y*149.-clock*.92+p.x*11.))*.0015*motion;
 q.x+=wave*water;q.y+=cos(p.x*48.+p.y*60.+clock*.8)*.0007*water*motion;
 vec2 fieldUV=(pixel-waterDomain.xy)/max(waterDomain.zw,vec2(1.));
 vec4 field=texture2D(waterField,clamp(fieldUV,0.,1.));
 float inField=step(0.,fieldUV.x)*step(fieldUV.x,1.)*step(0.,fieldUV.y)*step(fieldUV.y,1.)*field.a;
 vec3 waveSurface=(field.rgb*255.-128.)/127.*inField*mix(.25,1.,motion);
 // Surface normals refract the photograph; the banks and buildings stay still.
 vec2 rippleOffset=waveSurface.xy*vec2(24.,10.)/layout.z/vec2(1536.,1024.)*surface;
 q+=rippleOffset;
 vec3 day=texture2D(dayImage,clamp(q,0.,1.)).rgb;
 vec3 dark=texture2D(nightImage,clamp(q,0.,1.)).rgb;
 float cafe=box(p,vec4(.66,.535,.78,.78));float skyline=box(p,vec4(.09,.25,.264,.435));
 dark=mix(dark,day*vec3(.22,.29,.37),cafe*(1.-lights.x));dark=mix(dark,day*vec3(.18,.26,.38),skyline*(1.-lights.y));
 dark*=1.-water*(1.-lights.x)*box(p,vec4(.65,.82,.78,1.))*.22;
 vec3 color=mix(day,dark,night);
 // Portrait keeps the facade at its original aspect ratio, in a continuous sky/water surround.
 vec3 sky=mix(vec3(.31,.64,.83),vec3(.015,.09,.19),night);
 vec3 river=mix(vec3(.075,.34,.36),vec3(.015,.08,.11),night);
 if(portrait>.5){color=mix(sky,color,smoothstep(.0,.11,p.y));}
 else if(p.y<0.){color=sky;}else if(p.y>1.){color=river;}
 if(p.x<0.||p.x>1.){color=mix(sky,river,smoothstep(.65,1.,p.y));}
 if((size.y-layout.y)/layout.z>1024.&&p.y>${WATER_REFLECTION.blendStart / SCENE.height}){
  vec2 reflection=reflectionPoint(p+rippleOffset);
  vec3 reflectionColor=mix(texture2D(dayImage,reflection).rgb,texture2D(nightImage,reflection).rgb,night);
  float reflectionBlend=smoothstep(${WATER_REFLECTION.blendStart / SCENE.height},1.,p.y)*water;
  reflectionBlend=mix(reflectionBlend,1.,smoothstep(${WATER_REFLECTION.tailStart / SCENE.height},1.,p.y));
  color=mix(color,reflectionColor,reflectionBlend);
 }
 float glint=pow(max(0.,sin(p.y*275.+sin(p.x*18.+clock*.18)*1.4+clock*1.1)),14.);
 float shimmer=glint*(.4+.6*pow(.5+.5*sin(p.x*31.-clock*.7),2.))*motion;
 float swell=sin(p.y*91.+sin(p.x*9.)+clock*.65)*sin(p.x*17.-clock*.32);
 color+=vec3(.008,.018,.022)*swell*extension*motion;
 color+=mix(vec3(.04,.065,.06),vec3(.075,.1,.115),extension)*shimmer*surface;
 float slopeLight=dot(waveSurface.xy,vec2(-.65,-1.));
 float crest=pow(max(0.,slopeLight),.62)*smoothstep(.006,.025,abs(slopeLight));
 float trough=pow(max(0.,-slopeLight),.62)*smoothstep(.006,.025,abs(slopeLight));
 color*=1.-min(.2,trough*.85)*surface;
 color+=mix(vec3(.7,.79,.72),vec3(.65,.77,.82),night)*crest*.8*surface;
 gl_FragColor=vec4(color,1.);
}`;

export function createRenderer(canvas, day, night) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const vs = shader(gl.VERTEX_SHADER, vertex),
    fs = shader(gl.FRAGMENT_SHADER, fragment),
    program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const pos = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  [day, night].forEach((img, i) => {
    gl.activeTexture(gl.TEXTURE0 + i);
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.uniform1i(
      gl.getUniformLocation(program, i ? "nightImage" : "dayImage"),
      i,
    );
  });
  gl.activeTexture(gl.TEXTURE2);
  const fieldTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, "waterField"), 2);
  let fieldWidth = 0,
    fieldHeight = 0,
    fieldRevision = -1;
  const locations = Object.fromEntries(
    [
      "size",
      "layout",
      "clock",
      "night",
      "motion",
      "portrait",
      "lights",
      "waterDomain",
    ].map((k) => [k, gl.getUniformLocation(program, k)]),
  );
  return {
    render({
      width,
      height,
      layout,
      time,
      night,
      reduced,
      lights,
      waterField,
    }) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(locations.size, width, height);
      gl.uniform3f(locations.layout, layout.x, layout.y, layout.scale);
      gl.uniform1f(locations.clock, time % (Math.PI * 200));
      gl.uniform1f(locations.night, night);
      gl.uniform1f(locations.motion, reduced ? 0.08 : 1);
      gl.uniform1f(locations.portrait, layout.portrait ? 1 : 0);
      gl.uniform2f(locations.lights, ...lights);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      if (
        waterField.width !== fieldWidth ||
        waterField.height !== fieldHeight
      ) {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          waterField.width,
          waterField.height,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          waterField.data,
        );
        fieldWidth = waterField.width;
        fieldHeight = waterField.height;
        fieldRevision = waterField.revision;
      } else if (waterField.revision !== fieldRevision) {
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          0,
          0,
          fieldWidth,
          fieldHeight,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          waterField.data,
        );
        fieldRevision = waterField.revision;
      }
      gl.uniform4f(
        locations.waterDomain,
        waterField.left,
        waterField.top,
        waterField.spanWidth,
        waterField.spanHeight,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
  };
}

// Call after applying the scene transform and before drawing flowers or windows.
export function drawWaterFallback(
  ctx,
  { day, nightImage, layout, width, height, time, night, reduced, waterField },
) {
  const top = WATER.shoreY + WATER.shoreFadeEnd;
  const leftY =
    (top +
      WATER.shoreSlope *
        (WATER.leftInner - WATER.leftSlope * WATER.bankStartY)) /
    (1 - WATER.shoreSlope * WATER.leftSlope);
  const rightY =
    (top +
      WATER.shoreSlope *
        (WATER.rightInner + WATER.rightSlope * WATER.bankStartY)) /
    (1 + WATER.shoreSlope * WATER.rightSlope);
  const bottomDepth = SCENE.height - WATER.bankStartY;
  const motion = reduced ? 0.08 : 1;
  const left = -layout.x / layout.scale;
  const right = (width - layout.x) / layout.scale;
  const bottom = Math.max(SCENE.height, (height - layout.y) / layout.scale);
  function clipWater() {
    ctx.beginPath();
    ctx.moveTo(
      WATER.leftInner + (leftY - WATER.bankStartY) * WATER.leftSlope,
      leftY,
    );
    ctx.lineTo(
      WATER.rightInner - (rightY - WATER.bankStartY) * WATER.rightSlope,
      rightY,
    );
    ctx.lineTo(WATER.rightInner - bottomDepth * WATER.rightSlope, SCENE.height);
    ctx.lineTo(right, SCENE.height);
    ctx.lineTo(right, bottom);
    ctx.lineTo(left, bottom);
    ctx.lineTo(left, SCENE.height);
    ctx.lineTo(WATER.leftInner + bottomDepth * WATER.leftSlope, SCENE.height);
    ctx.closePath();
    ctx.clip();
  }
  ctx.save();
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
  ctx.save();
  clipWater();
  // Refract only water strips; the architecture remains in the static images.
  for (let y = top; y < SCENE.height; y += 3) {
    const strip = Math.min(3, SCENE.height - y);
    const offset =
      (Math.sin((y / SCENE.height) * 265 + time * 1.25) +
        Math.sin((y / SCENE.height) * 149 - time * 0.92)) *
      2.3 *
      motion;
    for (let pass = 0; pass < 2; pass++) {
      const source = pass ? nightImage : day;
      const alpha = pass ? night : 1;
      if (!source || alpha === 0) continue;
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        source,
        0,
        (y / SCENE.height) * source.height,
        source.width,
        (strip / SCENE.height) * source.height,
        offset,
        y,
        SCENE.width,
        strip,
      );
    }
  }
  function drawReflection(start, end, fadeStart) {
    const patchWidth = WATER_REFLECTION.right - WATER_REFLECTION.left;
    const patchHeight = WATER_REFLECTION.bottom - WATER_REFLECTION.top;
    for (let y = start; y < end; ) {
      const strip = Math.min(y < SCENE.height ? 2 : 8, end - y);
      const middleY = y + strip / 2;
      const blend = smooth(fadeStart, SCENE.height, middleY);
      const nightAlpha = blend * night;
      const dayAlpha =
        nightAlpha === 1 ? 0 : (blend * (1 - night)) / (1 - nightAlpha);
      const sourceHeight = (strip * patchHeight) / WATER_REFLECTION.bandHeight;
      const phase = reflectionPhases(left, middleY, time, motion).horizontal;
      const first = Math.floor(phase);
      const firstX = left - (phase - first) * patchWidth;
      for (let x = firstX, index = first; x < right; x += patchWidth, index++) {
        const vertical = reflectionPhases(
          x + patchWidth / 2,
          middleY,
          time,
          motion,
        ).vertical;
        const sample = waterReflectionPoint(
          x + patchWidth / 2,
          middleY,
          time,
          reduced,
        );
        const sourceY = Math.max(
          WATER_REFLECTION.top,
          Math.min(
            WATER_REFLECTION.bottom - sourceHeight,
            sample.y - sourceHeight / 2,
          ),
        );
        const flipX = ((index % 2) + 2) % 2 === 1;
        const flipY = ((Math.floor(vertical) % 2) + 2) % 2 === 1;
        ctx.save();
        ctx.translate(x + (flipX ? patchWidth : 0), y + (flipY ? strip : 0));
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        for (let pass = 0; pass < 2; pass++) {
          const source = pass ? nightImage : day;
          const alpha = pass ? nightAlpha : dayAlpha;
          if (!source || alpha === 0) continue;
          ctx.globalAlpha = alpha;
          ctx.drawImage(
            source,
            (WATER_REFLECTION.left / SCENE.width) * source.width,
            (sourceY / SCENE.height) * source.height,
            (patchWidth / SCENE.width) * source.width,
            (sourceHeight / SCENE.height) * source.height,
            0,
            0,
            patchWidth,
            strip,
          );
        }
        ctx.restore();
      }
      y += strip;
    }
  }
  if (bottom > SCENE.height) {
    drawReflection(
      WATER_REFLECTION.blendStart,
      bottom,
      WATER_REFLECTION.blendStart,
    );
  }
  ctx.restore();
  if (bottom > SCENE.height) {
    // Only the last 1.5% of the photo fades across the full width.
    drawReflection(
      WATER_REFLECTION.tailStart,
      SCENE.height,
      WATER_REFLECTION.tailStart,
    );
  }
  ctx.save();
  clipWater();
  ctx.lineCap = "round";
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = "#e8f3da";
  for (let y = WATER.bankStartY; y < bottom; y += 19) {
    for (let x = left; x < right; x += 110) {
      const phase = x * 0.011 + y * 0.018 + time * 0.9;
      const start =
        x + Math.sin(x * 0.79 + y * 0.37) * 45 + Math.sin(phase) * 17 * motion;
      const level =
        y + Math.sin(x * 0.16 + y) * 7 + Math.sin(phase + 1) * 1.5 * motion;
      const length = 24 + (1 + Math.sin(x + y)) * 15;
      ctx.globalAlpha =
        (0.035 + night * 0.018 + (1 + Math.sin(phase)) * 0.032) * motion;
      ctx.beginPath();
      ctx.moveTo(start, level);
      ctx.quadraticCurveTo(
        start + length / 2,
        level + 1.4,
        start + length,
        level,
      );
      ctx.stroke();
    }
  }
  drawWaterFieldFallback(ctx, waterField, layout, night, reduced ? 0.3 : 1);
  ctx.restore();
  ctx.restore();
}
