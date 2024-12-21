let sw = 20, //方块的宽
    sh = 20, //方块的高
    tr = 30, //行数
    td = 30; //列数

let snake = null; //蛇的实例
let food = null; //食物的实例
let game = null; //游戏实例
let speed = 200; //游戏速度
let count = 0; //判断是否修改游戏速度

//音效
let die = document.querySelector(".die");
let bj = document.querySelector(".bj");
let chi = document.querySelector(".chi");

//得分面板
let ong = document.querySelector(".ong");

//这个构造函数时用来创建组成蛇和食物的所有方块
function Square(x, y, classname) {
    this.x = x * sw;
    this.y = y * sh;
    this.class = classname; //传进来了一个类名
    this.viewContent = document.createElement("div"); //创建了一个div
    this.viewContent.className = this.class; //给创建的div赋值一个类名
    this.parent = document.querySelector("#snakeWrap"); //获取类名是snakeWrap的div他是父元素
}

//给方块的构造函数添加方法 定位坐标并把元素添加到页面里
Square.prototype.create = function () {
    this.viewContent.style.position = "absolute";
    this.viewContent.style.width = sw + "px";
    this.viewContent.style.height = sh + "px";
    this.viewContent.style.left = this.x + "px";
    this.viewContent.style.top = this.y + "px";
    this.parent.appendChild(this.viewContent);
};
Square.prototype.remove = function () {
    this.parent.removeChild(this.viewContent);
};

// 蛇的构造函数
function Snake() {
    this.head = null; // 蛇头
    this.tail = null; // 蛇尾

    // 蛇身体的所有关节位置
    this.pos = [];

    // 用对象控制蛇走的方向（对应键盘）
    this.directionNum = {
        left: {
            x: -1,
            y: 0,
            rotate: 180 //蛇头图片的方向
        },
        right: {
            x: 1,
            y: 0,
            rotate: 0
        },
        up: {
            x: 0,
            y: -1,
            rotate: -90
        },
        down: {
            x: 0,
            y: 1,
            rotate: 90
        }
    };
}

//给蛇的构造函数添加方法
Snake.prototype.init = function () {
    //创建蛇头
    let snakeHead = new Square(2, 0, "snakeHead");
    snakeHead.create();
    this.head = snakeHead; // 蛇头的信息  
    this.pos.push([2, 0]); // 把蛇头的坐标存起来

    //创建蛇身体的第一节
    let snakeBody1 = new Square(1, 0, "snakeBody");
    snakeBody1.create();
    this.pos.push([1, 0]); // 蛇身第一节的坐标存起来

    //创建蛇身体的第二节
    let snakeBody2 = new Square(0, 0, "snakeBody");
    snakeBody2.create();
    this.tail = snakeBody2;
    this.pos.push([0, 0]); // 蛇身第二节的坐标存起来

    //创建蛇关节直接的链表关系
    snakeHead.last = null;
    snakeHead.next = snakeBody1;

    snakeBody1.last = snakeHead;
    snakeBody1.next = snakeBody2;

    snakeBody2.last = snakeBody1;
    snakeBody2.next = null;

    //蛇走的方向
    this.direction = this.directionNum.right; // 默认让蛇向右走
};

// 获取蛇头下一个位置对应的元素，从而判断是撞墙、撞自己、还是吃食物
Snake.prototype.getNextPos = function () {
    let nextPos = [ //蛇头要走的下一个坐标
        this.head.x / sw + this.direction.x,
        this.head.y / sw + this.direction.y
    ]

    //撞自己死
    let selfCollide = false; // 判断是否撞自己
    this.pos.forEach(function (value) {
        if (value[0] == nextPos[0] && value[1] == nextPos[1]) {
            //如果蛇头和身体（数组）坐标重合代表撞到了自己
            selfCollide = true;
        }
    })
    if (selfCollide) {
        console.log("你无情的吃掉了自己！");
        this.strategies.die.call(this);

        return;
    }
    //撞墙死
    if (nextPos[0] < 0 || nextPos[1] < 0 || nextPos[0] > td - 1 || nextPos[1] > tr - 1) {
        console.log("你因撞墙导致脑浆崩裂，死的非常凄惨！");
        this.strategies.die.call(this);

        return;
    }

    //撞食物吃
    if (food && food.pos[0] == nextPos[0] && food.pos[1] == nextPos[1]) {
        // 判断是true说明蛇头下个坐标就是食物
        console.log("吃掉它吧！");
        this.strategies.eat.call(this); //吃掉食物
       
        return;
    }

    //如果前面不是墙、自己、食物，就往前走
    this.strategies.move.call(this);
};

//处理碰撞后的事
Snake.prototype.strategies = {
    move: function (formate) { // formate参数用来决定要不要删除最后一个方块（就是蛇尾）
        //创建一节新身体(放在旧蛇头的位置)
        let newBody = new Square(this.head.x / sw, this.head.y / sh, "snakeBody");
        //更新链表关系
        newBody.next = this.head.next;
        newBody.next.last = newBody;
        newBody.last = null;

        this.head.remove(); //把旧蛇头从原来的位置删除
        newBody.create(); // 把创建的这一节新身体添加到旧蛇头的位置

        //创建一个新蛇头，就是蛇头下一个要去的位置
        let newHead = new Square(this.head.x / sw + this.direction.x, this.head.y / sw + this.direction.y, "snakeHead")
        //更新链表关系
        newHead.next = newBody;
        newHead.last = null;
        newBody.last = newHead;
        newHead.viewContent.style.transform = "rotate(" + this.direction.rotate + "deg)";
        newHead.create();

        //更新蛇的每一节的坐标
        this.pos.splice(0, 0, [this.head.x / sw + this.direction.x, this.head.y / sw + this.direction.y])
        this.head = newHead; //更新以下蛇头的信息

        if (!formate) { //如何formate为false,表示需要删除蛇尾(蛇除了吃食物之外的候删除)
            this.tail.remove();
            this.tail = this.tail.last;

            this.pos.pop(); // 删掉数组中的蛇尾
        }
    },
    eat: function () {
        this.strategies.move.call(this, true);
        createFood();
        ong.innerHTML = ++game.score; 
        chi.play();

         // count++;
        // console.log(this.timer);
        // this.timer = setInterval(function () {
        //     snake.getNextPos();
        // }, speed)
        console.log(game.timer);

        if (game.score == 5) {
            clearInterval(game.timer);
            game.timer = setInterval(function(){
                snake.getNextPos();
            }, 190);
        }
        if (game.score == 10) {
            clearInterval(game.timer);
            game.timer = setInterval(function(){
                snake.getNextPos();
            }, 180);
        }

        if (game.score == 15) {
            clearInterval(game.timer);
            game.timer = setInterval(function(){
                snake.getNextPos();
            }, 170);
        }
        if (game.score == 20) {
            clearInterval(game.timer);
            game.timer = setInterval(function(){
                snake.getNextPos();
            }, 150);
        }
        
        if (game.score == 25) {
            clearInterval(game.timer);
            game.timer = setInterval(function(){
                snake.getNextPos();
            }, 130);
        }
        if (game.score == 40) {
            clearInterval(game.timer);
            game.timer = setInterval(function(){
                snake.getNextPos();
            }, 100);
        }
        if (game.score == 50) {
            clearInterval(game.timer);
            game.timer = setInterval(function(){
                snake.getNextPos();
            }, 80);
        }
        if (game.score == 60) {
            clearInterval(game.timer);
            game.timer = setInterval(function(){
                snake.getNextPos();
            }, 70);
        }
        if (game.score == 70) {
            clearInterval(game.timer);
            game.timer = setInterval(function(){
                snake.getNextPos();
            }, 60);
        }
        if (game.score == 80) {
            clearInterval(game.timer);
            game.timer = setInterval(function(){
                snake.getNextPos();
            }, 50);
        }
    },
    die: function () {
        game.over();
    }
}
snake = new Snake();

//创建食物
function createFood() {
    //x和y是食物的坐标
    let x = null;
    let y = null;

    let include = true; //true表示食物坐标在蛇身上继续循环，false没有在蛇身上终止循环
    while (include) {
        x = Math.round(Math.random() * (td - 1));
        y = Math.round(Math.random() * (tr - 1));

        snake.pos.forEach(function (value) {
            if (x != value[0] && y != value[1]) {
                //条件成立表示食物没有随机到蛇的蛇身，循环结束
                include = false;
            }
        })
    }

    //生成食物
    food = new Square(x, y, "food")
    food.pos = [x, y]; //存储食物坐标，将来要判断蛇头是否和食物相撞

    let foodDom = document.querySelector(".food");
    if (foodDom) {
        foodDom.style.left = x * sw + "px";
        foodDom.style.top = y * sh + "px";
    } else {
        food.create();
    }
}

//创建游戏逻辑
function Game() {
    this.timer = null;
    this.score = 0;
}

Game.prototype.init = function () {
    snake.init();
    createFood();

    document.addEventListener("keydown", function (ev) {
        // ArrowUp
        let flag = 0;
        if ("ArrowUp" == ev.code || "KeyW" == ev.code) {
            flag = 38;
        }
        if ("ArrowDown" == ev.code || "KeyS" == ev.code) {
            flag = 40;
        }
        if ("ArrowLeft" == ev.code || "KeyA" == ev.code) {
            flag = 37;
        }
        if ("ArrowRight" == ev.code || "KeyD" == ev.code) {
            flag = 39;
        }
        if (flag == 37 && snake.direction != snake.directionNum.right) { //snake.direction != this.directionNum.right他表示蛇在向左走的时候不能按右走键
            snake.direction = snake.directionNum.left;
        } else if (flag == 38 && snake.direction != snake.directionNum.down) {
            snake.direction = snake.directionNum.up;
        } else if (flag == 39 && snake.direction != snake.directionNum.left) {
            snake.direction = snake.directionNum.right;
        } else if (flag == 40 && snake.direction != snake.directionNum.up) {
            snake.direction = snake.directionNum.down;
        }
    })

    this.start();
}
Game.prototype.start = function () { //开始游戏
    this.timer = setInterval(function () {
        snake.getNextPos();
    }, speed)
    console.log(this.timer);
}

Game.prototype.pause = function() {
    clearInterval(this.timer);
}

Game.prototype.over = function(){
    clearInterval(this.timer);
    bj.pause();
    die.play();
    alert("你死了！");
    bj.play();
    //游戏回到最初是的状态
    let snakeWrap = document.querySelector("#snakeWrap");
    snakeWrap.innerHTML = "";

    snake = new Snake();
    game = new Game(); 

    let startBtnWrap = document.querySelector(".startBtn")
    startBtnWrap.style.display = "block";
    this.score = 0;
    ong.innerHTML = "0";
}

//开启游戏
alert("提示：这个游戏只能在电脑上玩！\nW,A,S,D和上下左右箭头都可以控制\n尽量不要两键一起按不然会死...")
game = new Game();
let startBtn = document.querySelector(".startBtn button");
startBtn.addEventListener("click", function () {
    bj.play();
    startBtn.parentNode.style.display = "none";
    game.init();
})

//暂停
let snakeWrap = document.querySelector("#snakeWrap");
let pauseBtn = document.querySelector(".pauseBtn button");
snakeWrap.addEventListener("click", function(){
    game.pause();
    pauseBtn.parentNode.style.display = "block";
})

pauseBtn.addEventListener("click", function(){
    game.start();
    pauseBtn.parentNode.style.display = "none";
})


