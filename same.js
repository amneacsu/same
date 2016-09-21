const canvas = document.getElementById('same');
const context = canvas.getContext('2d');
context.font = '24px sans-serif';

const fillColors = ['#DDD', '#8C3', '#FD0', '#F0E', '#4AF', '#F04'];
const grid = [];
const width = 11, height = 12, cellSize = 48, twoPI = 2 * Math.PI;
let score = 0, bonus = 0;

const erase = () => context.clearRect(0, 0, canvas.width, canvas.height);

const makeSprite = color => {
  circle(24, 24, 20, color);
  const sprite = context.getImageData(0, 0, cellSize, cellSize);
  erase();
  return sprite;
};

const circle = (x, y, radius, color) => {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, twoPI, false);
  context.closePath();
  context.fill();
};

const sprites = fillColors.map(makeSprite);

const drawScore = text => {
  context.fillStyle = '#432';
  context.fillText(text, 5, 610);
};

const drawCell = cell => {
  context.putImageData(sprites[cell.m ? 0 : cell.c], cell.x * cellSize, cell.y * cellSize);
};

const cellOffset = e => {
  return {
    x: ~~(e.offsetX / cellSize),
    y: ~~(e.offsetY / cellSize)
  };
};

const points = matched => matched.length * (matched.length - 1);
const rand = b => ~~(Math.random() * b);
const self = item => item;

const hasProps = props => cell => Object.keys(props).every(prop => cell[prop] === props[prop]);
const find = (list, props) => list.find(hasProps(props));
const filter = props => grid.filter(hasProps(props));
const compact = list => list.filter(self);

const moveRight = cell => cell.x += 1;
const moveDown = cell => cell.y += 1;
const spaceBelow = cell => !find(grid, { x: cell.x, y: cell.y + 1 });
const match = cell => cell.m = true;
const unmatch = cell => cell.m = false;
const remove = cell => grid.splice(grid.indexOf(cell), 1);

const column = x => filter({ x });
const row = y => filter({ y });

const randomCell = (x, y) => {
  let c = rand(5) + 1, matched = false;
  return { x, y, c, matched };
};

const fall = cell => {
  while (cell.y < height - 1 && spaceBelow(cell)) moveDown(cell);
};

const collapseColumns = () => {
  for (let x = width - 1; x >= 1; x--) {
    if (column(x).length) continue;

    for (let x2 = x - 1; x2 >= 0; x2--) {
      column(x2).forEach(moveRight);
    }
  }
};

const applyGravity = () => {
  for (let y = height - 1; y >= 0; y--) {
    row(y).forEach(fall);
  }
};

const click = cell => {
  let matched = matchCells(cell);

  if (matched.length >= 2) {
    score += points(matched);
    matched.forEach(remove);
    applyGravity();
    collapseColumns();
  }
};

const move = cell => {
  grid.forEach(unmatch);
  let matched = matchCells(cell);

  if (matched.length >= 2) {
    matched.forEach(match);
  }

  bonus = points(matched);
};

const handle = (coords, action) => {
  const cell = find(grid, coords);
  cell && action(cell);
};

const neighbours = cell => {
  let cells = filter({ c: cell.c });

  let n = [
    find(cells, { x: cell.x, y: cell.y + 1 }),
    find(cells, { x: cell.x, y: cell.y - 1 }),
    find(cells, { x: cell.x + 1, y: cell.y }),
    find(cells, { x: cell.x - 1, y: cell.y })
  ];

  return compact(n);
};

const matchCells = (cell, list = []) => {
  list.push(cell);
  neighbours(cell).filter(c => list.indexOf(c) === -1).forEach(c => matchCells(c, list));
  return list;
};

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    grid.push(randomCell(x, y));
  }
}

const tick = () => {
  erase();
  grid.forEach(drawCell);
  drawScore(`Score: ${score}` + (bonus ? ` + ${bonus}` : ''));
  window.requestAnimationFrame(tick);
};

const mouse = action => e => handle(cellOffset(e), action);

canvas.addEventListener('click', mouse(click));
canvas.addEventListener('click', mouse(move));
canvas.addEventListener('mousemove', mouse(move));
window.addEventListener('load', tick);
