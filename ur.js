// основне кільце гри:
// ролл дайсів => хід => зміна гравця за потреби
// game.roll() => game.move(cellId) => game.switchPlayers()
// game.roll() повертає результат і як конкретно випали кісточки, якщо випав 0 то одразу світчить гравця
// cellId це індекс поля з game.getBoard() фішки з котрого потрібно пересунути, має бути пустим якщо потрібна нова фішка
// відповідь буде в такому форматі
// {
//     result: boolean, - результат ходу
//     text: string, - опис результату
//     bonus: boolean - якщо тру, чергу наступному гравцю не передаємо
// }
// якщо потрібно перевірити валідність ходу до самого ходу, game.isValidMove()
// там відповідь буде в такому самому форматі але буде ще пол moveType і targetCell це потрібно для самого ігрового рушія

// з приводу рендеру є особливість, гра по логіці є не сіткою 3 на 8 з мертвими слотами зверху і знизу
//  а ряд клітин, на деяких гравці можуть стояти разом, а на деяких вони або зїдають один одного або просто не можуть бути разом
//  якщо клітина в game.board має mirror: true, значить там можуть бути 2 різних гравця
// якщо ні то там буде тільки один гравець
// приклад верстки і рендеру по ній буде в коді

const baseBoard = [
    { players: [], fight: false, mirror: true,  bonus: false },
    { players: [], fight: false, mirror: true,  bonus: false },
    { players: [], fight: false, mirror: true,  bonus: false },
    { players: [], fight: false, mirror: true,  bonus: true  },
    { players: [], fight: true,  mirror: false, bonus: false },
    { players: [], fight: true,  mirror: false, bonus: false },
    { players: [], fight: true,  mirror: false, bonus: false },
    { players: [], fight: false, mirror: false, bonus: true  },
    { players: [], fight: true,  mirror: false, bonus: false },
    { players: [], fight: true,  mirror: false, bonus: false },
    { players: [], fight: true,  mirror: false, bonus: false },
    { players: [], fight: true,  mirror: false, bonus: false },
    { players: [], fight: false, mirror: true,  bonus: false },
    { players: [], fight: false, mirror: true,  bonus: true  },
]

function getRandomNumber() {
    return Math.floor(Math.random() * 2);
}

class diceBox {
    constructor(dices) {
        this.dices = dices || 4
        this.prevRoll = []
        this.oldRoll = true
    }

    isOldRoll() {
        return this.oldRoll
    }

    roll() {
        this.prevRoll = []
        for (let i = 0; i < this.dices; i++) {
            this.prevRoll.push(getRandomNumber())
        }
        this.oldRoll = false
        return this.getPrevRollResult()
    }

    getPrevRollResult() {
        return {
            roll: this.prevRoll,
            result: this.prevRoll.reduce((acc, i) => {
                acc += i
                return acc
            }, 0)
        }
    }

    setOldRoll() {
        this.oldRoll = true
    }
}

class Game {
    constructor(board, players) {
        this.board = board || baseBoard
        this.currentPlayerIndex = getRandomNumber()
        this.diceBox = new diceBox()
        
        const defaultColors = ['white', 'orange']
        this.defaultPieceCount = 5
        this.players = players || [
            {
                color: defaultColors[0],
                pieces: this.defaultPieceCount,
            },
            {
                color: defaultColors[1],
                pieces: this.defaultPieceCount, 
            }
        ]
    }

    getBoard() {
        return this.board
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex]
    }

    switchPlayers() {
        this.currentPlayerIndex = this.currentPlayerIndex === 1 ? 0 : 1
    }

    addPieceToPlayer(playerIndex) {
        if (this.players[playerIndex].pieces + 1 > this.defaultPieceCount) {
            return false
        }
        this.players[playerIndex].pieces += 1
        return true
    }

    removePieceToPlayer(playerIndex) {
        if (this.players[playerIndex].pieces - 1 < 0) {
            return false
        }
        this.players[playerIndex].pieces -= 1
        return true
    }

    roll() {
        return this.diceBox.roll()
    }

    isValidMove(cellId = -1) {
        const isNew = cellId === -1 ? true : false
        const steps = this.diceBox.getPrevRollResult().result
        const player = this.getCurrentPlayer()

        if (isNew && player.pieces === 0) {
            return {
                status: false,
                text: "Немає фішок в запасі"
            }
        }

        if (!isNew && !this.board[cellId].players.includes(player.color)) {
            return {
                status: false,
                text: "Обране поле не містить вашої фішки"
            }
        }

        const targetCell = cellId + steps;

        if (targetCell > this.board.length - 1) {
            return {
                status: true,
                text: "Вивід фішки з поля",
                moveType: 0,
                targetCell
            }
        }

        if (this.board[targetCell].players.includes(player.color)) {
            return {
                status: false,
                text: "Цільове поле зайнято вашою фішкою"
            }
        }

        if (
            this.board[targetCell].players.length > 0
            && !this.board[targetCell].mirror
            && !this.board[targetCell].fight
        ) {
            return {
                status: false,
                text: "Цільове поле зайнято та захищено"
            }
        }

        if (this.board[targetCell].players.length === 0 || this.board[targetCell].mirror) {
            return {
                status: true,
                text: "Зайняття поля",
                bonus: this.board[targetCell].bonus,
                moveType: 1,
                targetCell
            }
        } else {
            return {
                status: true,
                text: "Зайняття поля та побиття фішки супротивника",
                bonus: this.board[targetCell].bonus,
                moveType: 2,
                targetCell
            }
        }
    }

    move(cellId = -1) {
        const result = this.isValidMove(cellId)
        if (!result.status) {
            return result
        }
        const player = this.getCurrentPlayer()
        switch (result.moveType) {
            case 0:
                this.board[cellId].players = this.board[cellId].players.filter((i) => i !== player.color)
                const isAnyPiecesLeft = this.board.reduce((acc, i) => {
                    if (i.players.includes(player.color) || player.pieces !== 0) {
                        acc = true
                    }
                    return acc
                }, false)
                if (!isAnyPiecesLeft) {
                    return false
                }
                break;
            case 1:
                if (cellId === -1) {
                    if (!this.removePieceToPlayer(this.currentPlayerIndex)) {
                        return {
                            status: false,
                            text: "Помилка вводу нової фішки"
                        }
                    }
                } else {
                    this.board[cellId].players = this.board[cellId].players.filter(p => p !== player.color)
                }
                this.board[result.targetCell].players.push(player.color)
                break;
            case 2:
                const secondPlayerIndex = this.currentPlayerIndex === 1 ? 0 : 1
                if (!this.addPieceToPlayer(secondPlayerIndex)) {
                    return {
                        status: false,
                        text: "Помилка повернення фішки"
                    }
                }
                this.board[result.targetCell].players = [player.color]
                this.board[cellId].players = this.board[cellId].players.filter(p => p !== player.color)
                break;
        }
        this.diceBox.setOldRoll()
        delete result.moveType
        delete result.targetCell
        return result
    }
}

class GameInterface {
    constructor() {
        this.game = new Game()
        this.currentPlayerPlaceHolder = document.querySelectorAll('.currentPlayer')[0];
        this.rollDiceResultPlaceHolder = document.querySelectorAll('.diceResult')[0];
        this.gridItems = document.querySelectorAll('.grid-item');

        this.gridItems.forEach(item => {
            item.addEventListener('click', () => {
                const cellId = item.classList[1]
                let result
                if (this.game.diceBox.isOldRoll()) {
                    return alert("Киньте кістки")
                }
                if (!isNaN(cellId)) {
                    result = this.move(Number(cellId))
                } else {
                    result = this.move()
                }

                if (result && !result.status) {
                    alert(result.text)
                } else {
                    this.renderBoard()
                }
    
                if (!result) {
                    alert(`Переміг гравець ${this.currentPlayerPlaceHolder.innerHTML}`)
                    reload()
                }
            })
        });
        document.querySelectorAll('button')[0].addEventListener('click', () => { this.rollDice.call(this) });

        this.currentPlayerPlaceHolder.innerHTML = this.game.getCurrentPlayer().color
    }

    rollDice() {
        if (!this.game.diceBox.isOldRoll()) {
            return alert("Ви вже кидали кістки")
        }
        const rollResult = this.game.roll()
        this.rollDiceResultPlaceHolder.innerHTML = rollResult.result

        if (rollResult.result === 0) {
            alert("Випав 0 хід переходить наступному гравцю")
            this.game.switchPlayers()
            this.game.diceBox.setOldRoll()
            this.currentPlayerPlaceHolder.innerHTML = this.game.getCurrentPlayer().color
            this.renderBoard()
        }
    }

    move(cellId) {
        const result = this.game.move(cellId)
        if (result.status && !result.bonus) {
            this.game.switchPlayers()
        }
        this.currentPlayerPlaceHolder.innerHTML = this.game.getCurrentPlayer().color
        return result
    }

    renderBoard() {
        const board = this.game.getBoard()
        this.gridItems.forEach((item) => {
            let cellId = item.classList[1]
            let side = item.classList[2]
            if (!isNaN(cellId)) {
                item.classList.remove(this.game.players[0].color)
                item.classList.remove(this.game.players[1].color)
                cellId = Number(cellId)
                if (board[cellId].players.length > 0) {
                    if (side === "top") {
                        if (board[cellId].players.includes(this.game.players[0].color)) {
                            item.classList.add(this.game.players[0].color)
                        }
                    } else if (side === "bottom") {
                        if (board[cellId].players.includes(this.game.players[1].color)) {
                            item.classList.add(this.game.players[1].color)
                        }
                    } else {
                        item.classList.add(board[cellId].players[0])
                    }
                }
            }
        })
        this.rollDiceResultPlaceHolder.innerHTML = ""
    }
}

let gameInterface

document.addEventListener("DOMContentLoaded", function() {
    gameInterface = new GameInterface()
})
