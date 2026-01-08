let capture, tracker, positions;
let w, h;
let tiempoVerificacion = 0;
let verificado = false;

// Sonidos
let beep, errorSound;

// Estados para controlar cuándo sonar
let estado = 'idle';      // 'idle' | 'procesando' | 'verificado' | 'error'
let estadoPrev = 'idle';

const UMBRAL_APERTURA = 12;

function preload() {
  // Carga los sonidos desde la carpeta assets
  beep = loadSound('assets/beep.mp3');       
  errorSound = loadSound('assets/error.mp3');
}

function setup() {
  w = windowWidth;
  h = windowHeight;
  const cnv = createCanvas(w, h);

  // Desbloquear audio por gesto del usuario (clic/toque)
  cnv.mousePressed(userStartAudio);
  cnv.touchStarted(userStartAudio);

  capture = createCapture(VIDEO);
  capture.size(w, h);
  capture.hide();

  colorMode(HSB);
  background(0);

  tracker = new clm.tracker();
  tracker.init();
  tracker.start(capture.elt);
}

function draw() {
  translate(w, 0);
  scale(-1.0, 1.0);

  image(capture, 0, 0, w, h);

  positions = tracker.getCurrentPosition();

  let ojoAbierto = false;

  if (positions && positions.length > 0) {
    const eyeRight = {
      top: getPoint(29),
      bottom: getPoint(31),
      center: getPoint(32)
    };

    const apertura = eyeRight.bottom.y - eyeRight.top.y;
    ojoAbierto = apertura > UMBRAL_APERTURA;

    if (ojoAbierto) {
      if (tiempoVerificacion === 0) tiempoVerificacion = millis();

      dibujarRetina(eyeRight.center);
      dibujarPanelDatos();

      if (millis() - tiempoVerificacion > 5000) {
        verificado = true;
        estado = 'verificado';

        // detener beep al verificar
        if (beep && beep.isPlaying()) {
          beep.stop();
        }
      } else {
        verificado = false;
        estado = 'procesando';

        // beep activo mientras se procesan las formas del ojo
        if (beep && !beep.isPlaying()) {
          beep.loop();
        }
      }
    } else {
      tiempoVerificacion = 0;
      verificado = false;
      estado = 'error';

      // detener beep al error
      if (beep && beep.isPlaying()) {
        beep.stop();
      }
    }
  } else {
    tiempoVerificacion = 0;
    verificado = false;
    estado = 'error';

    if (beep && beep.isPlaying()) {
      beep.stop();
    }
  }

  resetMatrix();
  if (estado === 'error') {
    mostrarError();
    mostrarInstruccion('Coloca tu rostro frente a la cámara y mantén una posición estable.');
  } else if (estado === 'verificado') {
    mostrarVerificacion();
  }
  // En 'procesando' se muestran retina y panel, pero no verificación ni error.

  // Disparar sonidos solo al cambiar de estado
  if (estado !== estadoPrev) {
    if (estado === 'error' && errorSound && !errorSound.isPlaying()) {
      errorSound.play();
    }
    estadoPrev = estado;
  }
}

function getPoint(index) {
  return createVector(positions[index][0], positions[index][1]);
}

function dibujarRetina(center) {
  noFill();
  for (let i = 0; i < 6; i++) { 
    const r = 40 + i * 20 + sin(frameCount * 0.06 + i) * 6; 
    stroke(200 + i * 10, 180, 255, 0.6);
    ellipse(center.x, center.y, r, r);
  }

  stroke(190, 255, 255, 0.5);
  const rayCount = 16; 
  const baseR = 30; 
  for (let k = 0; k < rayCount; k++) {
    const ang = (TWO_PI / rayCount) * k + frameCount * 0.01;
    const x1 = center.x + cos(ang) * baseR;
    const y1 = center.y + sin(ang) * baseR;
    const x2 = center.x + cos(ang) * (baseR + 50 + 15 * sin(frameCount * 0.05 + k));
    const y2 = center.y + sin(ang) * (baseR + 50 + 15 * sin(frameCount * 0.05 + k));
    line(x1, y1, x2, y2);
  }

  stroke(140, 255, 255, 0.5);
  const pulse = 24 + 6 * sin(frameCount * 0.15);
  ellipse(center.x, center.y, pulse, pulse);
}

function dibujarPanelDatos() {
  push();
  resetMatrix();
  noStroke();

  const labels = ['Pulse: 72 bpm', 'BP: 120/80', 'Hydro: 58%', 'Geo: Cuenca', 'Temp: 36°C'];
  for (let i = 0; i < 5; i++) {
    const phase = frameCount * 0.05 + i * 0.8;
    const barW = 40 + 100 * sin(phase); 
    fill(180 + i * 10, 255, 255, 0.6);
    rect(40, 90 + i * 32, barW, 20); 

    fill(255, 255, 255);
    textFont('monospace');
    textSize(19);
    text(labels[i],
      170 + sin(frameCount * 0.05 + i) * 10, 
      105 + i * 32);
  }
  pop();
}

function mostrarVerificacion() {
  textAlign(CENTER, CENTER);
  textFont('monospace');
  textSize(47);
  fill(120, 255, 255);
  text('✔ Verificación aceptada', windowWidth / 2, windowHeight / 2);
}

function mostrarError() {
  textAlign(CENTER, CENTER);
  textFont('monospace');
  textSize(47); 
  fill(0, 255, 255);
  text('✖ Error', windowWidth / 2, windowHeight / 2);
}

function mostrarInstruccion(msg) {
  textAlign(CENTER, CENTER); 
  textFont('monospace');
  textSize(23); 
  fill(0, 255, 255, 0.7 * 255);
  text(msg, windowWidth / 2, windowHeight - 40); 
}

function windowResized() {
  w = windowWidth;
  h = windowHeight;
  resizeCanvas(w, h);
}