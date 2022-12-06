const MAX = Infinity;
const MIN = -Infinity;
let cellWHconf = {3:["170px","170px"],4:["125px","125px"],5:["100px","100px"]}
let dix = {"three":3,"four":4,"five":5,3:"three",4:"four",5:"five"}

let player= "X";
let ai="O";

let dimension;
let N;
let maxMatch;

let expandedNodes;
let maxDepth;

let isAlphaBeta = false;
let isDepth = false;
let isEdit = false;
let isEditable = false;
let pointr = 'N';

let cellSwitch;
let srButton;

let utility = new Map([["D",0],["N",1]]);
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
document.getElementById('ab-switch').checked = false;
document.getElementById('ab-switch').addEventListener('click',(e)=>{
    isAlphaBeta = !isAlphaBeta;
},false)
document.getElementById('d-switch').checked = false;
document.getElementById('d-switch').addEventListener('click',(e)=>{
    isDepth = !isDepth;
},false)

document.getElementById('d-set').addEventListener('click',(e)=>{
    let n = Number(document.getElementById('d-val').value);
    if(n <1) n =1;
    else if(n>=10) n= 9;

    max_depth = n;
    document.getElementById('d-val').value = max_depth;
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

function setupBoard(d =3,matchM = 3){
    
    DOMboard.innerHTML = "";
    DOMboard.style.gridTemplateColumns = `repeat(${d}, auto)`
    dimension = d;
    N = dimension*dimension;
    
    if(matchM != maxMatch){
        if (matchM>dimension) {
            matchM = dimension;
        }
        maxMatch = matchM;
    }
    updateCellsIdx()
    document.getElementById('max-match').value = dix[maxMatch];
    if( dimension > 3){
        player = 'X';
        ai = 'O';
    }
    
    board = [];
    container = [];

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
    if (dimension == 3 || isDepth && isAlphaBeta) [player,ai] = [ai, player];

    DOMsrbtn.innerText = "New Match";
    srButton = true;
}
function startMatch(){
    utility.set(player,-1)
    utility.set(ai,2)
    
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
    let newMaxMatch = dix[document.getElementById('max-match').value];
    if (newDimension != dimension || newMaxMatch != maxMatch){
        setupBoard(newDimension,newMaxMatch);
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
function _diagonals(box){
    let l = []
    let r = []
    for(let i=0;i<maxMatch;i++){
        l.push(box[i][i]);
        r.push(box[maxMatch-i-1][i])
    }
    return [l,r];
}
function _rowCols(box){
    let r = [];
    let c = [];
    for (let i=0;i<maxMatch;i++){
        let a=[]
        let b=[]
        for(let j =0;j<maxMatch;j++){
            a.push(box[i][j]);
            b.push(box[j][i]);
        }
        r.push(a);
        c.push(b);
    }
    return [r,c];
}
function updateCellsIdx(){
    cellsIdx = [[],[],[]]
    let boarIdxs = [];
    for (let i=0;i<N;i++) boarIdxs.push(i);
    let p = 0;
    let c = [];
    
    for(let i=dimension;i<=N;){
        for(let n213=0;n213<maxMatch;n213++){
            c.push(boarIdxs.slice(p,i))
            p=i;
            i+=dimension;
        };

        let j = 0;
        let k = maxMatch;
        while (j<k && k<=dimension){
            let box  = []; 
            for (let rw of c){
                let cls = []
                for (let a=j;a<k;a++) cls.push(rw[a]); 
                box.push(cls)
            }
            j+=1
            k+=1
            let [row,column] = _rowCols(box);
            let diag = _diagonals(box);
            cellsIdx[0] = cellsIdx[0].concat(row)
            cellsIdx[1] = cellsIdx[1].concat(column)
            cellsIdx[2] = cellsIdx[2].concat(diag);
        }
        c = c.slice(1,maxMatch);
    }
}

function colorBoard(idx,color){
    for (let k of idx){
        container[k].style.background = color;
    }

}
// ==============================================================================================================
function search(){
    let value=MIN
    let move=null;
    let alpha = MIN;
    let beta=MAX;
    maxDepth = 0;
    expandedNodes=0;
    
    for(let k=0;k<N;k++){
        if (!_moveAI(k,ai)) continue;
        const [v,n101,n102] = minmax(false,1,MIN,MAX);
        _remove(k);
        if (v>value){
            value = v;
            move = k;
            alpha = n101;
            beta = n102;
        }
    }
    
    return [value,move,alpha,beta];
}

function isTerminal(){
    let x = checkWinner(false);
    if (x == "N") return [false, null];
    return [true, [utility.get(x),null,null]]
}

function minmax(ismax,d,a,b){
    
    // Depth Check
    expandedNodes+=1
    if (isDepth && d == max_depth){
        maxDepth = Math.max(maxDepth,d)
        return [utility.get(checkWinner(false)),null,null]
    }
    
    // Terminal Check 
    const [t, r] = isTerminal();
    if (t){
        maxDepth = Math.max(maxDepth,d)
        return r;
    }
    
    // Min-MAX
    let v;
    if (ismax){
        v = MIN
        for(let k=0;k<N;k++){
            if (!_moveAI(k,ai)) continue;
            
            const [v2,n101,n102] = minmax(false,d+1,a,b);
            _remove(k);

            v = Math.max(v,v2)
            if (isAlphaBeta) {
                a = Math.max(a,v);
                if (a>=b /**v>=b*/) break;
            }
        }
    } else {
        v = MAX
        for(let k=0;k<N;k++){
            if (!_moveAI(k,player)) continue;
            
            const [v2,n101,n102] = minmax(true,d+1,a,b);
            _remove(k);

            v = Math.min(v,v2)
            if (isAlphaBeta) {
                b = Math.min(b,v);
                if (a>=b/**v<=a*/) break;
            }
        }
    }
    return [v,a,b];

}

setupBoard()

