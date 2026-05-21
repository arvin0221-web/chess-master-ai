const game = new Chess();

const board = Chessboard('board', {
    draggable: true,
    position: 'start',
    onDrop: onDrop,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
});

const stockfish = STOCKFISH();

const movesList = document.getElementById('movesList');

const arrowColors = [
    'gold',
    'purple',
    'blue',
    'green',
    'white',
    'red'
];

function removeHighlights() {

    const squares = document.querySelectorAll('.square-55d63');

    squares.forEach(square => {

        square.classList.remove(
            'highlight-gold',
            'highlight-purple',
            'highlight-blue',
            'highlight-green',
            'highlight-white',
            'highlight-red'
        );

    });
}

function highlightMove(move, color) {

    const fromSquare = document.querySelector(`.square-${move.slice(0,2)}`);
    const toSquare = document.querySelector(`.square-${move.slice(2,4)}`);

    if (fromSquare) {
        fromSquare.classList.add(`highlight-${color}`);
    }

    if (toSquare) {
        toSquare.classList.add(`highlight-${color}`);
    }
}

function analyzePosition() {

    removeHighlights();

    movesList.innerHTML = '分析中...';

    stockfish.postMessage('uci');

    stockfish.postMessage('setoption name MultiPV value 6');

    stockfish.postMessage(`position fen ${game.fen()}`);

    stockfish.postMessage('go depth 18');

    let lines = [];

    stockfish.onmessage = function(event) {

        const text = typeof event === 'string' ? event : event.data;

        if (text.includes('multipv')) {

            const match = text.match(/multipv (\d+).* pv ([a-h][1-8][a-h][1-8][qrbn]?)/);

            if (match) {

                const pvNumber = parseInt(match[1]);
                const move = match[2];

                lines[pvNumber - 1] = move;

            }

        }

        if (text.includes('bestmove')) {

            displayTopMoves(lines);

        }

    };
}

function displayTopMoves(lines) {

    movesList.innerHTML = '';

    removeHighlights();

    for (let i = 0; i < lines.length; i++) {

        const move = lines[i];

        if (!move) continue;

        const div = document.createElement('div');

        div.className = `moveItem ${arrowColors[i]}`;

        div.innerText = `${i + 1}. ${move}`;

        movesList.appendChild(div);

        highlightMove(move, arrowColors[i]);

    }
}

function onDrop(source, target) {

    const move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) {
        return 'snapback';
    }

    setTimeout(() => {
        analyzePosition();
    }, 200);
}

function resetGame() {

    game.reset();

    board.position(game.fen());

    removeHighlights();

    movesList.innerHTML = '';

    analyzePosition();
}

function flipBoard() {
    board.flip();
}

board.position('start');

analyzePosition();


document.getElementById('resetBtn').addEventListener('click', resetGame);

document.getElementById('flipBtn').addEventListener('click', flipBoard);
