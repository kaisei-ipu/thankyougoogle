// テトリスゲームクラス
class Tetris {
    constructor() {
        this.canvas = document.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.gameStarted = false;
        
        this.currentPiece = null;
        this.nextPiece = null;
        
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        this.pieces = [
            // I
            [[1, 1, 1, 1]],
            // O
            [[1, 1], [1, 1]],
            // T
            [[0, 1, 0], [1, 1, 1]],
            // S
            [[0, 1, 1], [1, 1, 0]],
            // Z
            [[1, 1, 0], [0, 1, 1]],
            // J
            [[1, 0, 0], [1, 1, 1]],
            // L
            [[0, 0, 1], [1, 1, 1]]
        ];
        
        this.colors = [
            '#00f5ff', // I - シアン
            '#ffff00', // O - イエロー
            '#a000f0', // T - マゼンタ
            '#00f000', // S - グリーン
            '#f00000', // Z - レッド
            '#0000f0', // J - ブルー
            '#ffa500'  // L - オレンジ
        ];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.generateNextPiece();
        this.updateDisplay();
        this.drawBoard();
    }
    
    createBoard() {
        const board = [];
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            board[y] = [];
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                board[y][x] = 0;
            }
        }
        return board;
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
    }
    
    // 矢印キーでのスクロールを無効化
    disableScroll() {
        document.addEventListener('keydown', this.preventScroll, true);
    }
    
    // 矢印キーでのスクロールを有効化
    enableScroll() {
        document.removeEventListener('keydown', this.preventScroll, true);
    }
    
    // スクロール防止関数
    preventScroll(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    }
    
    handleKeyPress(e) {
        if (!this.gameStarted || this.gameOver) return;
        
        if (this.paused && e.key !== 'p' && e.key !== 'P') return;
        
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }
    
    startGame() {
        if (this.gameStarted && !this.gameOver) return;
        
        this.gameStarted = true;
        this.gameOver = false;
        this.paused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.board = this.createBoard();
        this.dropInterval = 1000;
        
        // ゲーム開始時にスクロールを無効化
        this.disableScroll();
        
        this.generateNewPiece();
        this.updateDisplay();
        this.updateButtons();
        
        this.gameLoop();
    }
    
    togglePause() {
        if (!this.gameStarted || this.gameOver) return;
        
        this.paused = !this.paused;
        this.updateButtons();
        
        if (!this.paused) {
            this.gameLoop();
        }
    }
    
    resetGame() {
        this.gameStarted = false;
        this.gameOver = false;
        this.paused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.board = this.createBoard();
        this.currentPiece = null;
        
        // ゲームリセット時にスクロールを有効化
        this.enableScroll();
        
        this.generateNextPiece();
        this.updateDisplay();
        this.updateButtons();
        this.drawBoard();
    }
    
    updateButtons() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        
        if (this.gameStarted && !this.gameOver) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            pauseBtn.textContent = this.paused ? 'RESUME' : 'PAUSE';
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            pauseBtn.textContent = 'PAUSE';
        }
        
        resetBtn.disabled = false;
    }
    
    generateNewPiece() {
        this.currentPiece = this.nextPiece;
        this.generateNextPiece();
        
        if (this.isCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.gameOver = true;
            // ゲームオーバー時にスクロールを有効化
            this.enableScroll();
            this.updateButtons();
        }
    }
    
    generateNextPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        this.nextPiece = {
            shape: this.pieces[pieceIndex],
            color: this.colors[pieceIndex],
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.pieces[pieceIndex][0].length / 2),
            y: 0
        };
        this.drawNextPiece();
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (!this.isCollision(newX, newY, this.currentPiece.shape)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            this.drawBoard();
            return true;
        }
        
        if (dy > 0) {
            this.placePiece();
            this.clearLines();
            this.generateNewPiece();
        }
        
        return false;
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        if (!this.isCollision(this.currentPiece.x, this.currentPiece.y, rotated)) {
            this.currentPiece.shape = rotated;
            this.drawBoard();
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];
        
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }
        
        return rotated;
    }
    
    hardDrop() {
        while (this.movePiece(0, 1)) {
            this.score += 2;
        }
        this.updateDisplay();
    }
    
    isCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT ||
                        (newY >= 0 && this.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const x = this.currentPiece.x + col;
                    const y = this.currentPiece.y + row;
                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(new Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateDisplay();
        }
    }
    
    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // ボードの描画
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        // 現在のピースの描画
        if (this.currentPiece) {
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        const x = this.currentPiece.x + col;
                        const y = this.currentPiece.y + row;
                        if (y >= 0) {
                            this.drawBlock(x, y, this.currentPiece.color);
                        }
                    }
                }
            }
        }
    }
    
    drawBlock(x, y, color) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // ハイライト効果
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(pixelX + 2, pixelY + 2, this.BLOCK_SIZE - 4, 4);
        this.ctx.fillRect(pixelX + 2, pixelY + 2, 4, this.BLOCK_SIZE - 4);
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const blockSize = 20;
        const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
        
        for (let row = 0; row < this.nextPiece.shape.length; row++) {
            for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                if (this.nextPiece.shape[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;
                    
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(x, y, blockSize, blockSize);
                    
                    this.nextCtx.strokeStyle = '#333';
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(x, y, blockSize, blockSize);
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    gameLoop() {
        if (this.gameOver || this.paused) return;
        
        const now = Date.now();
        if (now - this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = now;
        }
        
        this.drawBoard();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new Tetris();
});
