let capture, tracker, positions;
let anillos = [];
let centroObjetivo;
let tiempoInicio;
let estado = "jugando"; 
let tiempoVerificando = 0;
let mensajes = ["Cool!", "Genial!", "¡Bien hecho!", "Nice!", "Excelente!"];
let mensajeActual = "";
let tiempoFinalizacion = 0; 

// sonidos
let sonidoBeep, sonidoError, sonidoWin;

function preload() {
  sonidoBeep = loadSound("assets/beep.mp3");   // beep 
  sonidoError = loadSound("assets/error.mp3"); // error 
  sonidoWin = loadSound("assets/win.mp3");     // win 
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.size(width, height);
  capture.hide();

  tracker = new clm.tracker();
  tracker.init();
  tracker.start(capture.elt);

  textFont("Arial"); 
  textAlign(CENTER, CENTER);

  // volúmen
  sonidoBeep.setVolume(0.8);   // beep más suave
  sonidoError.setVolume(0.8);  // error fuerte
  sonidoWin.setVolume(0.8);    // victoria al máximo

  sonidoBeep.setLoop(true); 
  sonidoBeep.play(); // loop de beep
  iniciarJuego();
}

function draw() {
  background(0);

  // video
  push();
  translate(width, 0);
  scale(-1, 1);
  image(capture, 0, 0, width, height);
  pop();

  let tiempoRestante = 7 - int((millis() - tiempoInicio) / 1000);
  dibujarTablaTiempo(tiempoRestante);

  positions = tracker.getCurrentPosition();

  // victoria o derrota
  if (tiempoRestante <= 0 && estado !== "error" && estado !== "exito") {
    if (positions && positions.length > 0) {
      let ojoIzq = getEyeCenter([23,24,25,26,27,63,64,65,66]);
      let radioMinimo = anillos[0][0].r;

      if (dist(ojoIzq.x, ojoIzq.y, centroObjetivo.x, centroObjetivo.y) <= radioMinimo) {
        estado = "exito";
        explosion();
        mensajeActual = random(mensajes);
        tiempoFinalizacion = millis();
        if (sonidoBeep.isPlaying()) sonidoBeep.stop(); 
        sonidoWin.play(); // win
      } else {
        estado = "error";
        tiempoFinalizacion = millis();
        if (sonidoBeep.isPlaying()) sonidoBeep.stop(); 
        sonidoError.play(); // error
      }
    } else {
      estado = "error";
      tiempoFinalizacion = millis();
      if (sonidoBeep.isPlaying()) sonidoBeep.stop();
      sonidoError.play();
    }
  }

  if (estado === "jugando") {
    dibujarAnillos();

    if (positions && positions.length > 0) {
      let ojoIzq = getEyeCenter([23,24,25,26,27,63,64,65,66]);

      fill(255, 249, 235);
      ellipse(ojoIzq.x, ojoIzq.y, 20, 20);

      let radioMinimo = anillos[0][0].r;

      if (dist(ojoIzq.x, ojoIzq.y, centroObjetivo.x, centroObjetivo.y) <= radioMinimo) {
        estado = "verificando";
        tiempoVerificando = millis();
      }
    }
  }

  else if (estado === "verificando") {
    dibujarAnillos();
    dibujarAdvertencia(); 

    let ojoIzq = getEyeCenter([23,24,25,26,27,63,64,65,66]);

    fill(255, 249, 235);
    ellipse(ojoIzq.x, ojoIzq.y, 10, 10);

    let radioMinimo = anillos[0][0].r;

    if (dist(ojoIzq.x, ojoIzq.y, centroObjetivo.x, centroObjetivo.y) > radioMinimo) {
      estado = "jugando"; 
    }
  }

  else if (estado === "exito") {
    dibujarAnillos();
    mostrarMensaje(); 

    if (millis() - tiempoFinalizacion > 3000) {
      sonidoBeep.play(); // reiniciar beep
      iniciarJuego();
    }
  }

  else if (estado === "error") {
    mostrarError();

    if (millis() - tiempoFinalizacion > 3000) {
      sonidoBeep.play(); // reiniciar beep
      iniciarJuego();
    }
  }
}

/* INICIO */
function iniciarJuego() {
  estado = "jugando";
  tiempoInicio = millis();
  centroObjetivo = createVector(random(200, width-200), random(200, height-200));
  initAnillos();
}

/* ANILLOS */
function initAnillos() {
  anillos = [];
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const niveles = 3;

  for (let i = 0; i < niveles; i++) {
    let ring = [];
    let radio = 60 + i * 40;
    let size = 18 + i * 4;
    let cantidad = 24;

    for (let j = 0; j < cantidad; j++) {
      ring.push({
        char: chars[j % chars.length],
        ang: map(j, 0, cantidad, 0, TWO_PI),
        speed: 0.01 + i * 0.005,
        r: radio,
        size: size,
        explota: false
      });
    }
    anillos.push(ring);
  }
}

function dibujarAnillos() {
  anillos.forEach(ring => {
    ring.forEach(l => {
      if (!l.explota) {
        l.ang += l.speed;
      } else {
        l.r += random(-10, 10);
        l.ang += random(-0.3, 0.3);
      }

      let x = centroObjetivo.x + cos(l.ang) * l.r;
      let y = centroObjetivo.y + sin(l.ang) * l.r;

      push();
      translate(x, y);
      rotate(l.ang + HALF_PI);
      fill(255,249.235);
      textSize(l.size);
      text(l.char, 0, 0);
      pop();
    });
  });
}

function explosion() {
  anillos.flat().forEach(l => l.explota = true);
}


function mostrarMensaje() {
  fill(120,200,119);
  textSize(50);
  text(mensajeActual, width/2, height/2);
}

function mostrarError() {
  fill(93,13,24);
  textSize(50);
  text("✖ ERROR", width/2, height/2);
}
function dibujarTablaTiempo(t) {
  fill(255,249,235);
  rect(20, 20, 200, 200, 40);

  fill(93, 13, 24);
  textAlign(CENTER, CENTER);

  textSize(82);
  text(t, 120, 100);

  textSize(30);
  text("Tiempo", 120, 160);
}


function dibujarAdvertencia() {
  let offsetX = 200;
  let offsetY = 100;

  fill(93, 13, 24);
  rect(
    centroObjetivo.x + offsetX, 
    centroObjetivo.y + offsetY - 40, 
    160, 70, 
    20
  );

  fill(255,249,235);
  textSize(28);
  textAlign(CENTER, CENTER);

  text(
    "Mantente", 
    centroObjetivo.x + offsetX + 80, 
    centroObjetivo.y + offsetY - 5
  );
}

function getPoint(index) {
  return createVector(positions[index][0], positions[index][1]);
}

function getEyeCenter(indices) {
  let sumX = 0, sumY = 0;
  indices.forEach(i => {
    sumX += positions[i][0];
    sumY += positions[i][1];
  });
  return createVector(sumX / indices.length, sumY / indices.length);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}