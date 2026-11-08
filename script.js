var canvas = document.getElementById("fret_canvas");
var ctx = canvas.getContext("2d");
  
string_spacing = 30;
string_width = 1
fret_count = 22;
finger_radius = 10;

width = canvas.width;
height = canvas.height;

ymarg = (height - (string_spacing * (6-1) + string_width * (6-1))) / 2
xmarg = 30;

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACC = { '#': 1, b: -1, '': 0 };
const MODES = {
  "LYDIAN": [0, 2, 4, 6, 7, 9, 11],
  "IONIAN": [0, 2, 4, 5, 7, 9, 11],
  "MIXOLYDIAN": [0, 2, 4, 5, 7, 9, 10],
  "DORIAN": [0, 2, 3, 5, 7, 9, 10],
  "AEOLIAN": [0, 2, 3, 5, 7, 8, 10],
  "PHRYGIAN": [0, 1, 3, 5, 7, 8, 10],
  "LOCRIAN": [0, 1, 3, 5, 6, 8, 10],
}
 
// 각 도수의 기본(장음계 기준) 반음 수. 9/11/13은 옥타브 위로 계산
const BASE = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 9: 14, 11: 17, 13: 21 };

const TUNING = { 1: "E", 2: "B", 3: "G", 4:"D", 5:"A", 6:"E" };

text_input = $("#chord_input");
range_min_text = $("#range_min_text");
range_max_text = $("#range_max_text");
range_min = $("#range_min");
range_max = $("#range_max");

function update_range_text()  {
  range_min_text.text(`${range_min.val()}프렛부터`);
  range_max_text.text(`${range_max.val()}프렛까지`);
}
  
window.onload = (event) => {
  $.each(MODES, function (i, item) {
    $("#scale_mode_select").append($('<option>', { 
        value: i,
        text : i 
    }));
});
  manage_hiding();
  onChange();
};


range_min.on("input", function() {
  onChange();
})

range_max.on("input", function() {
  onChange();
})

text_input.on("propertychange change paste input", function() { 
  onChange(true);

})

function onChange(resetRange=false) {
  // 갱신 행동 여기로 다 옮기기
  if (resetRange) {
    range_max.val(22);
    range_min.val(0);
  }

  update_range_text()
  
  if ($("#mode_select").val() == "scale-mode") {

    scaleMode($("#scale_root_input").val(), $("#scale_mode_select").val())

  } else if ($("#mode_select").val() == "chord-tone-mode") {

    chordToneMode($("#chord_input").val())

  } else if ($("#mode_select").val() == "chord-mode") {



  }

}

$("#scale_root_input").on("propertychange change paste input", function() { 
  onChange(true);
})

function manage_hiding() {
  if ($("#mode_select").val() == "scale-mode") {

      $("#chord_input").css("display", "none");
      $("#scale_mode_select").css("display", "initial");
      $("#scale_root_input").css("display", "initial");

  } else if ($("#mode_select").val() == "chord-tone-mode") {

      $("#chord_input").css("display", "initial");
      $("#scale_mode_select").css("display", "none");
      $("#scale_root_input").css("display", "none");

  } else if ($("#mode_select").val() == "chord-mode") {

      $("#chord_input").css("display", "initial");
      $("#scale_mode_select").css("display", "none");
      $("#scale_root_input").css("display", "none");

  }
}

function resetInputs() {
  $("#chord_input").val("");
  $("#scale_root_input").val("");
  $("#scale_mode_select").val("");
}

$("#mode_select").on("propertychange change paste input", function() {
  onChange(true);
  resetInputs();
  manage_hiding();
})

$("#scale_mode_select").on("propertychange change paste input", function() { 
  onChange(true);
})


$("#hide_notes").on("input", function() {
  onChange();
})

$("#display_roots").on("input", function() {
  onChange();
})

function scaleMode(root, modeName) {
  if (root.length<1) {
    draw_fretboard();
    return; 
  }

  notes = MODES[modeName]
  notes_name = notes.map(item => spell(root[0], noteToInt(root), notes.indexOf(item) + 1, item))

  result.innerText = `모드 이름: ${root + " " + modeName}\n
  루트: ${root}\n
  구성음: ${notes_name.join(" ")}
  `;

  mode_intervals = MODES[modeName];
  rootdegree = noteToInt(root);
  degrees = mode_intervals.map(item => (item + rootdegree) % 12);
  drawChord(degrees, mode_intervals);

}

function chordToneMode(chordName) {
  if (chordName.length < 1 ) { 
    draw_fretboard();
    return; 
  }
  text = chordName;

  chord = parseChord(text)
  result.innerText = `코드 이름: ${chord.symbol}\n
  루트: ${chord.root}\n
  베이스: ${chord.bass || chord.root}\n
  구성음: ${chord.notes.join(" ")}
  `;
  
  chord_degrees = []
  chord.notes.forEach(element => {
    chord_degrees.push(noteToInt(element))
  });

  drawChord(chord_degrees, chord.intervals)
}



function drawChord(degrees, intervals=null) { // 절대반음 리스트와 대응하는 도수 리스트를 입력으로 받음
  
  draw_fretboard(canvas, ctx);
  
  
  
  for (string=0; string<6; string++) {
    for (fret=0; fret<fret_count; fret++) {
      
      if (fret<range_min.val() || fret>range_max.val()) {
        if ($("#hide_notes").is(":checked")) continue
        else {
          ctx.globalAlpha = 0.2;
        }
      }; // 프렛 범위 아닌 프렛은 제거

      current_degree = (noteToInt(TUNING[string+1]) + fret) % 12; // 지판 위치를 절대적 반음 숫자로
      if (degrees.includes(current_degree)) { // 현재 위치의 음이 구성음 중에 있으면     
        if ($("#display_roots").is(":checked") && intervals) {
          current_interval = intervals[degrees.indexOf(current_degree)] // 현재 위치의 도수 구하기
          if (current_interval == 0) { // 근음이면 빨간색으로 칠하기
            draw_finger(canvas, ctx, string+1, fret, color="#880000", label="R");
          } else {
            draw_finger(canvas, ctx, string+1, fret, color="#0f0f0f");
          }
        } else {
          draw_finger(canvas, ctx, string+1, fret, color="#0f0f0f");
        }
        
      }
      ctx.globalAlpha = 1;
    }
  }
}

function draw_fretboard() {
  
  width = canvas.width
  height = canvas.height
  
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fafafa";
  ctx.rect(0, 0, width, height);
  ctx.fill();
  ctx.fillStyle = "#0f0f0f"

  ctx.strokeStyle = "rgb(0, 0, 0)";
  ctx.lineWidth = string_width;
  
  // 가로선(줄)
  for(let i = 0; i < 6; i++) {
    y = ymarg + i*(string_spacing+string_width) // 굵기 1일때 0.5 더해야 선명해짐
    draw_line(ctx, xmarg, y, width-xmarg, y);
  }

  ctx.lineWidth = string_width + 2;
  // 세로선(프렛)
  
  for(let i = 0; i<fret_count; i++) {
    if (i>0) ctx.lineWidth = string_width + 1;
    x = xmarg + i * (width - 2*xmarg)/(fret_count-1)
    draw_line(ctx, x, ymarg, x, height-ymarg);
    ctx.font = "12px Arial"
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(i, x , height-ymarg+15);
  }
  

}

function draw_finger(canvas, ctx, stringnum, fret, color="#0f0f0f", label=null) {
  x = fret ==0 ? xmarg : xmarg + (fret-0.5) * (width - 2*xmarg)/(fret_count-1);
  y = ymarg + (stringnum-1) *(string_spacing+string_width);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, finger_radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
  if (label) {
    ctx.fillStyle = "#f0f0f0";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = "15px Arial"
    ctx.fillText(label, x, y);
  }
  
}

function draw_line(ctx, x1, y1, x2, y2, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.stroke();

}


 
function baseOf(d) {
  if (!(d in BASE)) throw new Error(`지원하지 않는 도수: ${d}`);
  return BASE[d];
}

function noteToInt(noteName) { // 음이름을 반음간격으로 변환
  if (!(noteName[0] in NATURAL)) throw new Error(`잘못된 이름: ${noteName}`);
  noteNum = NATURAL[noteName[0]];
  if (noteName.length > 1) {
    noteNum += ACC[noteName[1]]
  }
  noteNum %= 12;
  return noteNum
}
 
// 도수에 맞는 알파벳 + 필요한 임시표로 음 이름 만들기
function spell(rootLetter, rootPc, degree, semis) {
  const letter = LETTERS[(LETTERS.indexOf(rootLetter) + degree - 1) % 7];
  let diff = (((rootPc + semis - NATURAL[letter]) % 12) + 12) % 12;
  if (diff > 6) diff -= 12;
  return letter + (diff > 0 ? '#'.repeat(diff) : 'b'.repeat(-diff));
}
 
const pcOf = (n) => (((NATURAL[n[0]] + ACC[n.slice(1)]) % 12) + 12) % 12;
 
function parseChord(input) {
  // 1) 전처리: 유니코드 기호 통일, 6/9는 슬래시 베이스와 헷갈리지 않게 치환
  let s = input.trim().replace(/♯/g, '#').replace(/♭/g, 'b').replace('6/9', '6add9');
 
  // 2) 슬래시 베이스 분리 (C/E, Am7/G)
  let bassStr = null;
  const slash = s.lastIndexOf('/');
  if (slash >= 0) {
    bassStr = s.slice(slash + 1);
    s = s.slice(0, slash);
  }
 
  // 3) 루트
  const rm = s.match(/^([A-G])([#b]?)/);
  if (!rm) throw new Error(`루트를 읽을 수 없음: ${input}`);
  const [, rootLetter, rootAcc] = rm;
  const rootPc = NATURAL[rootLetter] + ACC[rootAcc];
  let rest = s.slice(rm[0].length);
 
  // 4) 삼화음 성질 (m, dim, aug ...). 'maj'의 m과 구분하려고 m(?!aj)
  const t = { 1: 0, 3: 4, 5: 7 };
  let q = '';
  const qm = rest.match(/^(min|m(?!aj)|-|dim|°|aug|\+|ø)/);
  if (qm) {
    q = qm[1];
    rest = rest.slice(q.length);
  }
  if (q === 'min' || q === 'm' || q === '-') t[3] = 3;
  else if (q === 'dim' || q === '°' || q === 'ø') { t[3] = 3; t[5] = 6; }
  else if (q === 'aug' || q === '+') t[5] = 8;
 
  // 5) 확장음: maj/M/Δ 표시 + 숫자 (5, 6, 7, 9, 11, 13)
  const em = rest.match(/^(maj|Maj|M|Δ)?(\d+)?/);
  const major7 = !!em[1];
  const n = em[2] ? Number(em[2]) : (q === 'ø' || em[1] === 'Δ' ? 7 : 0);
  rest = rest.slice(em[0].length);
 
  const seventh = major7 ? 11 : (q === 'dim' || q === '°') ? 9 : 10;
  if (n === 5) delete t[3]; // 파워코드
  else if (n === 6) t[6] = 9;
  else if ([7, 9, 11, 13].includes(n)) {
    t[7] = seventh;
    if (n >= 9) t[9] = 14;
    if (n >= 11) t[11] = 17;
    if (n === 13) { t[13] = 21; delete t[11]; } // 13코드는 관례상 11음 생략
  } else if (n !== 0) {
    throw new Error(`지원하지 않는 확장음: ${n}`);
  }
 
  // 6) 나머지 수식어를 앞에서부터 하나씩 소비: sus, add, no, b5/#9 ...
  while (rest) {
    let m;
    if ((m = rest.match(/^[(),\s]/))) {
      // 구분 문자는 무시
    } else if ((m = rest.match(/^sus([24])?/))) {
      const d = m[1] === '2' ? 2 : 4;
      delete t[3];
      t[d] = baseOf(d);
    } else if ((m = rest.match(/^add([#b]?)(\d+)/))) {
      const d = Number(m[2]);
      t[d] = baseOf(d) + ACC[m[1]];
    } else if ((m = rest.match(/^(?:no|omit)(\d+)/))) {
      delete t[Number(m[1])];
    } else if ((m = rest.match(/^([#b])(\d+)/))) {
      const d = Number(m[2]);
      t[d] = (t[d] ?? baseOf(d)) + ACC[m[1]];
    } else {
      throw new Error(`해석할 수 없는 부분: "${rest}" (입력: ${input})`);
    }
    rest = rest.slice(m[0].length);
  }
 
  // 7) 도수 순서대로 음 이름 생성
  const degrees = Object.keys(t).map(Number).sort((a, b) => a - b);
  let notes = degrees.map((d) => spell(rootLetter, rootPc, d, t[d]));
  const intervals = degrees.map((d) => t[d]);
 
  // 8) 슬래시 베이스: 베이스를 맨 앞으로
  let bass = null;
  if (bassStr) {
    const bm = bassStr.match(/^[A-G][#b]?$/);
    if (!bm) throw new Error(`베이스를 읽을 수 없음: ${bassStr}`);
    bass = bassStr;
    notes = [bass, ...notes.filter((x) => pcOf(x) !== pcOf(bass))];
  }
 
  return { symbol: input, root: rootLetter + rootAcc, bass, notes, intervals };
}













/* const container = document.getElementById("panelContainer");

// 샘플 데이터
const panels = [
  { title: "패널 1", content: "첫 번째 패널입니다." },
  { title: "패널 2", content: "두 번째 패널입니다." },
  { title: "패널 3", content: "세 번째 패널입니다." },
  { title: "패널 4", content: "네 번째 패널입니다." }
];

// 패널 생성 함수
function createPanel(data) {
  const panel = document.createElement("div");
  panel.className = "panel";

  const title = document.createElement("div");
  title.className = "panel-title";
  title.textContent = data.title;

  const content = document.createElement("div");
  content.className = "panel-content";
  content.textContent = data.content;

  panel.appendChild(title);
  panel.appendChild(content);

  return panel;
}

// 화면에 추가
panels.forEach(item => {
  const panelElement = createPanel(item);
  container.appendChild(panelElement);
});*/