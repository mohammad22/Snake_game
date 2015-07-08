
// global variables 

canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// half-height and half-width  of each cell of Snake
h = 6; 
w = 2 * h; 

// controls the speed of the game
stime = 300;

// Snake and Ball trace eraser 
backgroundcolor = "white"; 

// unicode of relevant keys color  
up_key = 38; 
down_key = 40;
right_key = 39;
left_key = 37;
enter_key = 13;
space_key = 32;

stop_game = false;
game_on = true;
Snakehandler = function(){}; // global varibale to handle Snake state and movement 

// Dynamic canvas adjustment 
canvas.width  = Math.floor(this.innerWidth / h) * (h - 1);
canvas.height = Math.floor(this.innerHeight / h) * (h - 1);

// Snake and Ball declaration
/* each cell is the collection  of its center o, and its direction u;
 * the width of rectangle is drawn in the direction u, the height h in
 * the direction of TT(u); 
 * d is the direction of Snake   */
var x = 2 * h;
var y = 2 * w;
Snake = {
    cells: [{o:mod_canvas([x, y]), u: [1, 0]}],
    d: [1, 0]      
};

Ball = {
    center: mod_canvas([40 * x, 10 * y]),
    radius: h,        
};

// Level and Wall declarations

Level = 1;
Wall = {
    cells: [{o: [0, 0], u:[1, 0]}], 
};

// Basic math functions//

//modular coordinate calculus: returns the coordinates of the point p
// modulus canvas
function mod_canvas(a){
    var x_mod = a[0] % canvas.width;
    var y_mod = a[1] % canvas.height;
    if (x_mod <= 0){x_mod = x_mod + canvas.width;}
    if (y_mod <= 0) {y_mod = y_mod + canvas.height; }
    return [x_mod, y_mod];
}
// counter-clock-wise prepedicular of 2-dim vector a 
function TT(a){ return [-a[1], a[0]]; }

// inner prodcut of vectors 
function dot(a, b){
    var i;
    var sum = 0; 
    for (i = 0; i < a.length; i ++){ sum = sum + (a[i] * b[i]);}
    return sum;
}

// scalar product of a number and vector  array 
function scalar(r, a){
    var i;
    var b = [];
    for (i = 0; i <a.length; i ++){ b[i] = r * a[i];}
    return b;
}

// vector summation 
function sum(a, b){
    var i;
    d = [];
    for (i = 0; i < a.length; i ++){ d[i] = a[i] + b[i]; }
    return d;
}  

// abstract of a vector 
function abs(a){
    var i;
    var d = [];
    for (i = 0; i < a.length; i ++){ d[i] = Math.abs(a[i]);}
    return d;    
}

// norm of a vector
function norm(a){return dot(a, a);}

// distance of two vectors as point coordinates 
function dist(a, b){return norm(sum(a, scalar(-1, b)));}

/* if A and B denote the vector coordinate of upper left, lower right vertices of the cell o, then we can see: 
*                    A = o - w * |u| - h * |TT(u)|, 
*                    B = o + w * |u| + h * |TT(u)|
*/ 
//Draws the cell with the given color, if color argument is not provided
//it draws our classic snake cell
function Draw_cell (cell, color = undefined){
    var o = cell.o;
    var u = cell.u;
    var Tu = TT(u);
    var x = sum(sum(o, scalar(-w , abs(u))), scalar(-h, abs(Tu)));
    var y = sum(sum(o, scalar(w , abs(u))), scalar(h, abs(Tu)));
    var ww = abs(sum(x, scalar(-1, y)));
    if (color === undefined) {
        var gradient = ctx.createLinearGradient(x[0], x[1], y[0], y[1]);
        gradient.addColorStop("0", "magenta");
        gradient.addColorStop("1", "blue");
        ctx.fillStyle = gradient; 
    }    
    else { ctx.fillStyle = color; }
    ctx.beginPath();
    ctx.fillRect(x[0], x[1], ww[0], ww[1]);
}

// Draws the ball object with the given color argument, otherwise it draws our classic default ball
function Draw_Ball (color = undefined){
    var R = Ball.radius;
    var cc = Ball.center;
    var A = cc[0] - R;
    var B = cc[1] - R;
    var C = cc[0] + R;
    var D = cc[1] + R;
    if (color === undefined) { 
        var gradient = ctx.createLinearGradient(A, B, C, D);
        gradient.addColorStop("0", "green");
        gradient.addColorStop("0.5", "green");
        gradient.addColorStop("1.0", "yellow");
        ctx.fillStyle = gradient; 
    }
    else { ctx.fillStyle = color; }
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.arc(cc[0], cc[1], R, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
}

/* To locate the center of a shifted cell we need the coodinates of the
 * original cell (its center & direction) and the direction of shift m 
 * Shif_Snake: returns the boolean value was_feed indicating if Snake hit 
 * the ball or not. */
function Shift_Snake (Snake, m  = Snake.cells[0].u){
    var o2 = [NaN, NaN];
    var o = Snake.cells[0].o;
    var u = Snake.cells[0].u;
    if (dot(u, m) === 0) { o2 = sum(o, scalar((w - h), sum(u, m))); } 
    else if (dot(u, m) === 1 || dot(u, m) === -1 ){ // it can not return on itself, instead continues in its head-direction 
        m = u;
        o2 = sum(o, scalar(2 * w, m));
    }
    Snake.cells.unshift({o: mod_canvas(o2), u: m});
    var l = Snake.cells.length;
    var was_feed = Snake_was_feed();
    if (was_feed === false) {
        Draw_cell(Snake.cells[l - 1], backgroundcolor);
        Snake.cells.pop(); 
    } 
    Draw_cell(Snake.cells[0]);
    return was_feed;
}

// Resets randomly a new center for the ball
function Reset_Ball(){
    var cells = Snake.cells;
    var ball = {center:[0, 0], radius: h};
    var x, y;
    var ball_ok = false; //state of the new random ball up to now
    // concerning different levels later:
    // the cells variable can be initialized before the following code
    // to include both cells of the snake and walls for any levels
    while (ball_ok === false){
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;    
        ball.center = mod_canvas([x, y]);
        var R = ball.radius;
        var cw = canvas.width;
        var ch = canvas.height;
        if (ball.center[0] < R) {ball.center[0] += R;}
        if (ball.center[1] < R) {ball.center[1] += R;}
        if (ball.center[0] > cw - R) { ball.center[0] += R; }
        if (ball.center[1] > ch - R) { ball.center[0] += R; }
        var i;
        for (i = 0; i < cells.length; i++){
            if (ball_hit_cell(ball, cells[i])) { 
                ball_ok = false; 
                break;
            }
            ball_ok = true;
        }
    }
    Ball = ball;
}

//returns true if the Snake has crossed itself, otherwise return false
function Snake_crash(){
    return cell_wall_crash(Snake.cells[0], Snake.cells.slice(2))     
}

//returns true if cell has an intersection with any of the cells within
// the cells of the wall; otheriwse returns false
function cell_wall_crash(cell, wall){
    var o = cell.o;
    var u = cell.u;
    var oo1 = sum(o, scalar(w / 2, u));
    var oo2 = sum(o, scalar(-w / 2, u));
    var i, cel;
    var len = wall.length;
    for (i = 0; i < len; i++){
        cel = wall[i];
        if (is_in_cell(cel, oo1) || is_in_cell(cel, oo2)){ return true;}
    }   
    return false;
}    

// returns true if p is an interior point of the cell; otherwise returns 
// false; ww: the width, hh: the height of cell
function is_in_cell(cell, p, ww = w, hh = h){
    var o = cell.o;
    var u = cell.u;
    var Tu = TT(u);
    var p_o = sum(p, scalar(-1, o));
    if ((Math.abs(dot(u, p_o)) <= ww) && (Math.abs(dot(Tu, p_o)) <= hh))
        {return true;}
    else 
        {return false;}
}

// This function is based on the fact that: a circle has nonempty 
// intersection  with a rectangle iff the center of circle is inside the
// rectangle obtained by growing width and height of the original rectangle // according to circle-radius
function ball_hit_cell(ball, cell, ww = w, hh = h){
    var b = ball.center;
    var R = ball.radius;
    return is_in_cell(cell, b, w + R, h + R, ww, hh); 
}

// returns true if snake hits the Ball; otheriwse returns false
function Snake_was_feed(){
    return ball_hit_cell(Ball, Snake.cells[0]);
}

function Draw_new_Ball(){
    Draw_Ball(backgroundcolor);
    Reset_Ball();
    Draw_Ball();
    Draw_cell(Snake.cells[0]);
}

function snake_handler(){
    var was_feed = Shift_Snake(Snake, Snake.d);
    if (was_feed && game_on) {
        clearInterval(Snakehandler);
        Draw_new_Ball();
        stime = stime - 10;
        gamehandler();
    }
    if (Snake_crash()) { 
        alert("Congratulations! You scored: " + Snake.cells.length);
        clearInterval(Snakehandler); 
    }
}

// The main entrance function 
function gamehandler(){
    Snakehandler = window.setInterval(snake_handler, stime);
} 

function user_event_handler (event){
    var x = event.which || event.keycode;
    if (x === up_key) {Snake.d = [0, -1];}
    else if (x === down_key) {Snake.d = [0, 1];}
    else if (x === right_key) {Snake.d = [1, 0];}
    else if (x === left_key) {Snake.d = [-1, 0];}
    else if (x === space_key) {stop_game = true; // this is for debugg
                               clearInterval(Snakehandler);}
}
window.addEventListener("keydown", user_event_handler);

Draw_new_Ball();
gamehandler();
