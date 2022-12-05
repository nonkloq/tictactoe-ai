const MAX = Infinity;
const MIN = -Infinity;
let cellWHconf = {3:["170px","170px"],4:["125px","125px"],5:["100px","100px"]}

let player= "X";
let ai="O";

let dimension;
let N;

let expandedNodes;
let maxDepth;

let isAlphaBeta = false;
let isDepth = false;
let isEdit = false;
let isEditable = false;
let pointr = 'N';

let cellSwitch;
let srButton;

let utility = new Map([["D",0],["N",0]]);
let max_depth = 3;

let board;
let container;
let cellsIdx;
 
const key_k = (i,j) => {return i*dimension+j}
const key_ij = (k) => {return [Math.floor(k/dimension), k%dimension]}
const sleep = (ms) =>{ return new Promise(resolve => setTimeout(resolve, ms));}
sleep(1000)
// Dom elements
const DOMdim = document.getElementById('dimension-setter');
const DOMboard = document.getElementById("container");
const DOMhead = document.getElementById("head");
const DOMsrbtn = document.getElementById("sr");
const DOMedit = document.getElementById("edit");

function createCell(i,w,h){
    let d = document.createElement("div");
    d.id = `${i}`;
    d.className = 'board-cell';
    d.style.width = w;
    d.style.height = h;
    
    cellSwitch = false;
    d.addEventListener("click",(e) => {
        if(cellSwitch) move(i,false);
    },false)
    
    DOMboard.appendChild(d);
    
    return d;
}

function setHeading(msg){
    DOMhead.innerText = msg;
}


function updateNS(val,move,a,b){
    document.getElementById('nerd-stats').innerHTML = `
    <p>
    Search Stats:<br> 
    ->{value: ${val}, move: cell[${move}]} <br>
    ->Expanded Nodes: ${expandedNodes}<br>
    ->Depth Reached: ${maxDepth}<br>
    <br><br>

    AB Prunning: ${isAlphaBeta}<br>
    ->Alpha: ${a}<br>
    ->Beta: ${b}<br>
    
    <br><br>
    Depth Restriction: ${isDepth}<br>
    ->Max Depth: ${max_depth}<br>
    </p>
    `
}

document.getElementById('ab-switch').addEventListener('click',(e)=>{
    isAlphaBeta = !isAlphaBeta;
},false)

document.getElementById('d-switch').addEventListener('click',(e)=>{
    isDepth = !isDepth;
},false)

document.getElementById('d-set').addEventListener('click',(e)=>{
    let n = Number(document.getElementById('d-val').value);
    if (dimension==5 && n>5) n=4;
    else if(dimension==7 && n>3) n=3;
    max_depth = n;
    
})
DOMedit.addEventListener("click",(e)=>{
    if (isEditable) EditMode();
})

DOMsrbtn.addEventListener("click",(e)=>{
    if (srButton) startMatch();
    else resetMatch();
},false)
DOMdim.value =3;

// ------------------------------------------------------------------------------------------------------------------

function setupBoard(d =3){
        
    DOMboard.innerHTML = "";
    DOMboard.style.gridTemplateColumns = `repeat(${d}, auto)`
    
    dimension = d;
    if( dimension > 3){
        player = 'X';
        ai = 'O';
    }
    N = dimension*dimension;
    
    board = [];
    container = [];

    updateCellsIdx()
    let [w,h] = cellWHconf[dimension];
    for(let i =0;i<N;i++) {
        board.push(" ")
        container.push(createCell(i,w,h));
    }
    
    
    
    setHeading("Click Start Match To Play")
    DOMsrbtn.innerText = "Start Match"
    srButton = true;
}

function aiTurn(){
    setHeading(`AI's Turn -> ${ai}`);
    if (isEdit) return;
    cellSwitch = false;
    isEditable = false;
    (async () => {
        await sleep(1000);
        let p =  new Promise((resolve) => {
            resolve(search());
        });
        let [value, m,a,b] = await p;
        move(m,true);
        cellSwitch = true
        isEditable = true;    
        updateNS(value,m,a,b);
    })();

}
function playerTurn(){
    setHeading(`Player's Turn -> ${player}`)
}
function endMatch(winner){
    isEditable = false;
    cellSwitch = false;
    let msg; 
    if (winner == "D") msg = "Draw Match XO!";
    else if (winner ==player) msg = `Player WON -> ${winner}`; 
    else msg = `AI WON -> ${winner}`
    
    setHeading(msg);

    // Swap Players
    if (dimension == 3) [player,ai] = [ai, player];

    DOMsrbtn.innerText = "New Match";
    srButton = true;
}
function startMatch(){
    utility.set(player,-1)
    utility.set(ai,1)
    
    cellSwitch = true;
    
    DOMsrbtn.innerText = "Reset Match";
    srButton = false;
    
    resetMatch();
}
function resetMatch(){
    isEditable = true;
    isEdit = false;
    DOMedit.innerText = "Edit State";
    let newDimension = Number(DOMdim.value);
    if (newDimension != dimension){
        setupBoard(newDimension);
        return;
    }
    
    for (let k =0;k<N;k++){
        container[k].style.background = "#DADBDC";
        board[k] = " ";
        container[k].innerText = "";
    }

    if(player == 'X') playerTurn();
    else aiTurn();
}

// ---------------------------------------------------------------------------------
function move(k,isAI){
    if (board[k] != " ")return;
    let m;

    if (isEdit){
        m = pointr;
        if (pointr == player) pointr = ai;
        else pointr = player;
    }
    else if (isAI) m = ai;
    else m = player;
    

    board[k] = m;
    container[k].innerText = m;
    let winner = checkWinner();
    
    if (winner != "N" ) {
        endMatch(winner);
        return;
    }
    
    if(isAI || isEdit && m==ai) playerTurn();
    else aiTurn();
}
function _moveAI(k,m){
    if (board[k] != " ") return false;
    board[k] = m;
    return true;
}
function _remove(k){
    board[k] = " ";
}
function EditMode(){
    if (isEdit){
        DOMedit.innerText = "Edit State";
        isEdit = false;
        if (pointr == player) playerTurn()
        else aiTurn()
    }else{
        DOMedit.innerText = "Set State";
        isEdit =true;
        pointr = player;
    }

}
// -----------------------------------------------------------------------------------
function checkWinner(game=true){
    for(let checkers of cellsIdx){
        for(let idxs of checkers){
            let winner = isSame(idxs);
            if (winner != " ") {
                if (game){
                    if (winner == player) colorBoard(idxs,"green");
                    else colorBoard(idxs,"red");
                } 
                return winner;
            } 
        }
    }
    
    if (isNoSpace()){
        if(game){
            for(let i=0;i<N;i++){
            container[i].style.background = "yellow";
        }
        }
        return "D";
    }
    return "N";
}
function isNoSpace(){
    let i = 0
    for(;i<N;i++){
        if (board[i] == " ") break;
    }
    return i == N;
}
function isSame(idxs){
    let head = board[idxs[0]];
    for (let k of idxs){
        if (board[k] != head) return " ";
    }
    return head;
}
function updateCellsIdx(){
    cellsIdx = [null,null,null]

    if (dimension == 3){
        cellsIdx[0] = [[0,1,2],[3,4,5],[6,7,8]];
        cellsIdx[1] = [[0,3,6],[1,4,7],[2,5,8]];
        cellsIdx[2] = [[0,4,8],[2,4,6]];
    }else if(dimension == 4){
        cellsIdx[0] = [[0, 1, 2], [4, 5, 6], [8, 9, 10], [1, 2, 3], [5, 6, 7], [9, 10, 11], [4, 5, 6], [8, 9, 10], [12, 13, 14], [5, 6, 7], [9, 10, 11], [13, 14, 15]]
        cellsIdx[1] = [[0, 4, 8], [1, 5, 9], [2, 6, 10], [1, 5, 9], [2, 6, 10], [3, 7, 11], [4, 8, 12], [5, 9, 13], [6, 10, 14], [5, 9, 13], [6, 10, 14], [7, 11, 15]]
        cellsIdx[2] = [[0, 5, 10], [2, 5, 8], [1, 6, 11], [3, 6, 9], [4, 9, 14], [6, 9, 12], [5, 10, 15], [7, 10, 13]]
    } 
    else if(dimension == 5){
        cellsIdx[0] = [[0, 1, 2], [5, 6, 7], [10, 11, 12], [1, 2, 3], [6, 7, 8], [11, 12, 13], [2, 3, 4], [7, 8, 9], [12, 13, 14], [5, 6, 7], [10, 11, 12], [15, 16, 17], [6, 7, 8], [11, 12, 13], [16, 17, 18], [7, 8, 9], [12, 13, 14], [17, 18, 19], [10, 11,12], [15, 16, 17], [20, 21, 22], [11, 12, 13], [16, 17, 18], [21, 22, 23], [12, 13, 14], [17, 18, 19], [22, 23, 24]] 
        cellsIdx[1] = [[0, 5, 10], [1, 6, 11], [2, 7, 12], [1, 6, 11], [2, 7, 12], [3, 8, 13], [2, 7, 12], [3, 8, 13], [4, 9, 14], [5, 10, 15], [6, 11, 16], [7, 12, 17], [6, 11, 16], [7, 12, 17], [8, 13, 18], [7, 12, 17], [8, 13, 18], [9, 14, 19], [10, 15, 20], [11, 16, 21], [12, 17, 22], [11, 16, 21], [12, 17, 22], [13, 18, 23], [12, 17, 22], [13, 18, 23], [14, 19, 24]] 
        cellsIdx[2] = [[0, 6, 12], [2, 6, 10], [1, 7, 13], [3, 7, 11], [2, 8, 14], [4, 8, 12], [5, 11, 17], [7, 11, 15], [6, 12, 18], [8, 12, 16], [7, 13, 19], [9, 13, 17], [10, 16, 22], [12, 16, 20], [11, 17, 23], [13, 17, 21], [12, 18, 24], [14, 18, 22]]

    }

}

function colorBoard(idx,color){
    for (let k of idx){
        container[k].style.background = color;
    }

}
// ==============================================================================================================
function search(){
    maxDepth = 0;
    expandedNodes=0;
    let v,m;
    return minmax(true,0,MIN,MAX);
}

function isTerminal(){
    let x = checkWinner(false);
    if (x == "N") return [false, null];
    return [true, [utility.get(x),null,null,null]]
}

function minmax(ismax,d,a,b){
    if (isDepth && d == max_depth){
        maxDepth = Math.max(maxDepth,d)
        return [utility.get(checkWinner(false)), null,null,null]
    }
    expandedNodes+=1
    
    // Terminal Check 
    const [t, r] = isTerminal();
    if (t){
        maxDepth = Math.max(maxDepth,d)
        return r;
    }
    
    // Min-MAX
    let move = null;
    let v;
    if (ismax){
        v = MIN
        for(let k=0;k<N;k++){
            if (!_moveAI(k,ai)) continue;
            
            const [v2, m2,n101,n102] = minmax(false,d+1,a,b);
            _remove(k);

            if (v2 > v){
                v = v2;
                move = k;
                if (isAlphaBeta) a = Math.max(a,v);
            }
            if (isAlphaBeta && a>=b /**v>=b*/) break;
        }
    } else {
        v = MAX
        for(let k=0;k<N;k++){
            if (!_moveAI(k,player)) continue;
            
            const [v2, m2,n101,n102] = minmax(true,d+1,a,b);
            _remove(k);

            if (v2 < v){
                v = v2;
                move = k;
                if (isAlphaBeta) b = Math.min(b,v);
            }
            if (isAlphaBeta && a>=b/**v<=a*/) break;
        }
        
    }
    return [v,move,a,b];

}

setupBoard()

