//
// global variables 

canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// half-height and half-width  of each cell  (be it a Snake or a wall cell)
// probably this is bad design to hardcode this throughout the code
// may be later I should move them as cell properties
// but for now as far as I see all the cells will remain fixed size
// and this is  very convenient  
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
canvas.width  = Math.floor(this.innerWidth / (2 * w)) * (2 * w - 1);
canvas.height = Math.floor(this.innerHeight / (2 * w)) * (2 * w - 1);

/*
 * Each Cell is rectangle which is completely determined
 * by its center coordinate o and its direction u in the plane. 
 * The width of cell is drawn in the direction u, the height h in
 * the direction of TT(u) (the vector orthogonal to u such that 
 * {u, TT(u)} is a right-hand basis of the plane); 
 * Every Snake (Wall) is a collection of cells.
*/
Cell = function (x = 0, y = 0, u0 = 0, u1 = 1){
	
	
    this.o = [x, y];
    
    this.u = [u0, u1];
    
    /* if A and B denote the vector coordinate of upper left, lower right
    * vertices of the cell o, then we can see: 
    *                    A = o - w * |u| - h * |TT(u)|, 
    *                    B = o + w * |u| + h * |TT(u)|
    */ 
    //Draws the cell with the given color, if color argument is not
    //provided it draws our classic snake cell
    this.Draw = function (color = undefined){
        var o = this.o,
            u = this.u,
            Tu = TT(u),
            x = sum(sum(o, scalar(-w , abs(u))), scalar(-h, abs(Tu))),
            y = sum(sum(o, scalar(w , abs(u))), scalar(h, abs(Tu))),
            ww = abs(sum(x, scalar(-1, y)));
        if (color === undefined) {
            var gradient = ctx.createLinearGradient(x[0], x[1], y[0], y[1]);
            gradient.addColorStop("0", "magenta");
            gradient.addColorStop("1", "blue");
            ctx.fillStyle = gradient; 
        }    
        else { ctx.fillStyle = color; }
        ctx.beginPath();
        ctx.fillRect(x[0], x[1], ww[0], ww[1]);
    };
	
    // returns true if p is an interior point of the cell; 
    // otherwise returns false; ww: the width, hh: the height of cell
    
    this.is_in = function (p, ww = w, hh = h){
        var o = this.o,
            u = this.u,
            Tu = TT(u),
            p_o = sum(p, scalar(-1, o));
        if ((Math.abs(dot(u, p_o)) < ww) && (Math.abs(dot(Tu, p_o)) < hh))
            {return true;}
        else 
            {return false;}
    };
    
    //returns true if cell has an intersection with any of the cells 
    // of the wall; otheriwse returns false
    
    this.crash = function(wall){
        var o = this.o,
            u = this.u,
            Tu = TT(u),
            i, cel,
            len = wall.length;
        for (i = 0; i < len; i++){
            cel = wall[i];
            var o1 = sum(o, sum(scalar(w, u), scalar(h, Tu)));
            if (cel.is_in(o1)){return true;}  
            var o2 = sum(o, sum(scalar(w, u), scalar(-h, Tu)));
            if (cel.is_in(o2)){return true;}  
            var o3 = sum(o, sum(scalar(-w, u), scalar(-h, Tu)));
            if (cel.is_in(o3)){return true;}  
            var o4 = sum(o, sum(scalar(-w, u), scalar(h, Tu)));
            if (cel.is_in(o4)){return true;}  
            var o5 = sum(o, sum(scalar(w/2, u), scalar(h, Tu)));
            if (cel.is_in(o5)){return true;}  
            var o6 = sum(o, sum(scalar(w/2, u), scalar(-h, Tu)));
            if (cel.is_in(o6)){return true;}  
            var o7 = sum(o, sum(scalar(-w/2, u), scalar(h, Tu)));
            if (cel.is_in(o7)){return true;}  
            var o8 = sum(o, sum(scalar(-w/2, u), scalar(-h, Tu)));
            if (cel.is_in(o8)){return true;}  
        }   
        return false;
    };    

}


/* Snake is a collection of cells and direction d.
 * This d is a thing, separated from the direction of cells; it
 * determines the next direction of the Snake head in its next 
 * movement; it is the entry point of user command for the Snake movement.
*/
var Snake = function(){
    
    this.cells = [new Cell()]; 
    
    this.d = [1, 0];      
	
    /* 
    To locate the center of a shifted cell we need the coodinates of the
    * original cell (its center & direction) and the direction of shift m 
    * also we need ball object to decide the type of shift 
    * Shifi: returns the boolean value was_feed indicating if Snake hit 
    * the ball or not.*/
    
    this.Shift = function (ball, m = this.cells[0].u){
        var o2 = [0, 0],
            o = this.cells[0].o,
            u = this.cells[0].u;
        if (dot(u, m) === 0) { 
            o2 = mod_canvas(sum(o, scalar((w - h), sum(u, m))));
        } 
        else if (dot(u, m) === 1 || dot(u, m) === -1 ){ // it can not return on itself, instead continues in its head-direction 
            m = u;
            o2 = mod_canvas(sum(o, scalar(2 * w, m)));
        }
        var cel = new Cell(o2[0], o2[1], m[0], m[1]);
        this.cells.unshift(cel);
        var l = this.cells.length,
            was_feed = this.was_feed(ball);
        if (was_feed === false) {
            this.cells[l - 1].Draw(backgroundcolor);
            if (l >= 1 && 
            		dot(this.cells[l - 1].u, this.cells[l - 2].u) === 0) {
                this.cells[l - 2].Draw();
            }
            this.cells.pop(); 
        } 
        this.cells[0].Draw();
        return was_feed;
    };
    
    // returns true if snake hits the Ball; otheriwse returns false
    
    this.was_feed = function (ball){
        return ball.hit(this.cells[0]);
    };
    
    //returns true if the Snake has the wall, otherwise return false
    // the default argument returns true when snake crosses itself
    
    this.crash = function (wall = this.cells.slice(2)){
        return this.cells[0].crash(wall);     
    };

};

/*
 * The ball is determined by its center coordinates and its radius.
*/
var Ball = function() {
    
    this.center = mod_canvas([40 * h, 10 * w]);
    
    this.radius = h;        
	
    // This function is based on the fact that: a circle has nonempty 
    // intersection  with a rectangle iff the center of circle is inside the
    // rectangle obtained by growing width and height of the original rectangle // according to circle-radius
    
    this.hit = function (cell, ww = w, hh = h){
        var R = this.radius;
        return cell.is_in(this.center, ww + R + 1/2, hh + R + 1/2); 
    };
    
    // Draws the ball object with the given color argument, otherwise it draws our classic default ball
    
    this.Draw = function (color = undefined){
        var R = this.radius,
            cc = this.center,
            A = cc[0] - R,
            B = cc[1] - R,
            C = cc[0] + R,
            D = cc[1] + R;
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
    };
    
    // returns a new ball object
    
    this.Reset = function(snake, wall){
        var cells = snake.cells.concat(wall.cells),
            ball = new Ball(),
            i, x, y,
            ball_ok = false, //state of the new random ball up to now
            R = ball.radius,
            cw = canvas.width,
            ch = canvas.height;
        while (ball_ok === false){
            x = Math.random() * cw;
            y = Math.random() * ch;    
            ball.center = mod_canvas([x, y]);
            if (ball.center[0] < R) {ball.center[0] += R;}
            if (ball.center[1] < R) {ball.center[1] += R;}
            if (ball.center[0] > cw - R) { ball.center[0] += R; }
            if (ball.center[1] > ch - R) { ball.center[0] += R; }
            for (i = 0; i < cells.length; i++){
                if (ball.hit(cells[i])) { 
                    ball_ok = false; 
                    break;
                }
                ball_ok = true;
            }
        }
        return ball;
    };

    this._new = function (snake, wall){
        this.Draw(backgroundcolor);
        var balll = this.Reset(snake, wall);
        balll.Draw();
        snake.cells[0].Draw();
        return balll;
    };

};

// Level and Wall declarations

Level = 1;
Wall = function(){
    this.level = Level;
    this.len = 10 * this.level;
    this.first_x = Math.floor(canvas.width / 2) - 2 * w * this.len;
    this.first_y = Math.floor(canvas.height / 2);
    this.cells = [];
    var i;
    for (i = 0; i < this.len; i ++){
        this.cells.push(new Cell(this.first_x + 2 * w * i,
        			this.first_y , 1, 0));
    }
    
    this.Draw = function(){
    	for (i = 0; i < this.len; i ++){ this.cells[i].Draw("blue"); } 
    };
    
    this.Clean = function(){
    	for (i = 0; i < this.len; i ++){
    	    this.cells[i].Draw(backgroundcolor);
    	} 
    };
};

// Basic math functions//

//modular coordinate calculus: returns the coordinates of the point p
// modulus canvas
function mod_canvas(a){
    var x_mod = a[0] % canvas.width,
        y_mod = a[1] % canvas.height;
    if (x_mod <= 0) {x_mod += canvas.width;}
    if (y_mod <= 0) {y_mod += canvas.height;}
    return [x_mod, y_mod];
}
// counter-clock-wise prepedicular of 2-dim vector a 
function TT(a){ return [-a[1], a[0]]; }

// inner prodcut of vectors 
function dot(a, b){
    var i, sum = 0; 
    for (i = 0; i < a.length; i ++){ sum += (a[i] * b[i]);}
    return sum;
}

// scalar product of a number and vector  array 
function scalar(r, a){
    var i, b = [];
    for (i = 0; i <a.length; i ++){ b[i] = r * a[i];}
    return b;
}

// vector summation 
function sum(a, b){
    var i, d = [];
    for (i = 0; i < a.length; i ++){ d[i] = a[i] + b[i]; }
    return d;
}  

// abstract of a vector 
function abs(a){
    var i, d = [];
    for (i = 0; i < a.length; i ++){ d[i] = Math.abs(a[i]);}
    return d;    
}

// norm of a vector
function norm(a){return dot(a, a);}

// distance of two vectors as point coordinates 
function dist(a, b){return norm(sum(a, scalar(-1, b)));}


// events 
function user_event_handler (event){
    var x = event.which || event.keycode;
    if (x === up_key) {snake.d = [0, -1];}
    else if (x === down_key) {snake.d = [0, 1];}
    else if (x === right_key) {snake.d = [1, 0];}
    else if (x === left_key) {snake.d = [-1, 0];}
    else if (x === space_key) {
        stop_game = true; // this is for debugg
        clearInterval(Snakehandler);
    }
}
window.addEventListener("keydown", user_event_handler);

// The main entrance function 
function gamehandler(){
    Snakehandler = window.setInterval(snake_handler, stime);
} 

function snake_handler(){
    var was_feed = snake.Shift(ball, snake.d);
    if (was_feed && game_on) {
        clearInterval(Snakehandler);
        ball = ball._new(snake, wall);
        stime = stime - 10;
        gamehandler();
    }
    if (snake.crash() || snake.crash(wall.cells)){ 
        alert("Congratulations! You scored: " + snake.cells.length);
        clearInterval(Snakehandler); 
    }
}

// start
var snake = new Snake();
var ball = new Ball();
var wall = new Wall();
ball.Draw();
wall.Draw();
gamehandler();
