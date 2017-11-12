// Initialize Firebase
var config = {
    apiKey: "AIzaSyD14euIzuRa_G8GmM8z5cYIW3_YUX6aBVE",
    authDomain: "dokidoki-d7c09.firebaseapp.com",
    databaseURL: "https://dokidoki-d7c09.firebaseio.com",
    projectId: "dokidoki-d7c09",
    storageBucket: "",
    messagingSenderId: "1030559322077"
};
firebase.initializeApp(config);
var dokiDoki = firebase.database().ref('/User');
var currentIndex = 0;
var time = 0;
var diffBPMAverage=[];

// 標準偏差算出
function sd(BPMList) {
    // 平均値を求める
    var ave = getCurrentBPMAverage(BPMList);
    var varia = 0;
    for (i = 0; i < BPMList.length; i++) {
        varia = varia + Math.pow(BPMList[i] - ave, 2);
    }
    return Math.sqrt((varia / BPMList.length));
}

function sugestDokiDokiAction(){
    fetch("http://192.168.11.90:8080/DokiDokiAction.json")
    .then((res)=>res.json())
    .then((res)=>{
        console.log(res);
        document.getElementById('recommend').classList.toggle("show");
    });
}

function createBPMList(firebaseData){
    if(firebaseData.length === currentIndex) return null;
    let BPMList = [];
    for(let record in firebaseData){
        BPMList.push(firebaseData[record].BPM);
    }
    return BPMList;
}
function updateBPM(BPMList){
    if(!BPMList) return;
    if(currentIndex !== 0){
        avgBPM=getCurrentBPMAverage(BPMList);
        var stdv = sd(BPMList);
        console.log(stdv);
        time++;
        if(time%3===0) console.log("今"+ Math.round(time/3) +"分");
        if(stdv < 40 && time > 10){
            sugestDokiDokiAction();
            time = 0;
        }
        if(avgBPM===0) { avgBPM=1;alert("死亡した危険性があります")}
        CJS.Ticker.setFPS(avgBPM);
        if (document.getElementById("heart").style["animation-name"]==='anime1'){
            document.getElementById("heart").style["animation-name"] = "";
            document.getElementById("heart").style["animation-duration"] = 1.8 * 60 / getCurrentBPMAverage(BPMList) + "s";
            document.getElementById("heart").style["animation-name"] = "anime0";
        }else{
            document.getElementById("heart").style["animation-name"] = "";
            document.getElementById("heart").style["animation-duration"] = 1.8 * 60 / getCurrentBPMAverage(BPMList) + "s";
            document.getElementById("heart").style["animation-name"] = "anime1";
        }
        currentIndex++;
        return;
    }
    for(let BPM of BPMList){
        currentIndex++;
    }
    avgBPM = getBPMAverage(BPMList);
    CJS.Ticker.setFPS(avgBPM);
    document.getElementById("heart").style["animation-name"] = "";
    document.getElementById("heart").style["animation-duration"] = 1.8 * 60 /getCurrentBPMAverage(BPMList) + "s";
    document.getElementById("heart").style["animation-name"] = "anime1";
    console.log("AVG:" + avgBPM);
}
function getBPMAverage(BPMList){
    let sum = BPMList.reduce((prev,current)=>current+=prev);
    console.log(BPMList)
    return sum/BPMList.length;
}

function getCurrentBPMAverage(BPMList){
    if(BPMList.length<3) return avgBPM;
    return getBPMAverage([
        BPMList[BPMList.length - 3],
        BPMList[BPMList.length - 2],
        BPMList[BPMList.length-1]
    ]);
}

// create Listener 
dokiDoki.on('value', (snapshot) => {
    let BPMList = createBPMList(snapshot.val());
    BPMList.slice(-10);
    updateBPM(BPMList);
});






// forked from Fuzz_jpn's "CreateJSで心電図エフェクト" http://jsdo.it/Fuzz_jpn/1EAK
var CJS = createjs;
var canvas;
var stage;
var scene;

function init() {
    canvas = $("#demo")[0];
    stage = new CJS.Stage(canvas);

    scene = new ElectrocardiogramScene;
    scene.init();
    stage.addChild(scene.container);

    CJS.Ticker.setFPS(60);
    CJS.Ticker.addEventListener("tick", tick);

}


function tick() {
    scene.update();
    stage.update();
}



/*
 * ElectrocardiogramScene -------------------------------------------
 */
var ElectrocardiogramScene = function () {
};
ElectrocardiogramScene.prototype.init = function () {
    this.container = new CJS.Container();
    this.container.opacity = 1;

    // ブレンドモード 加算
    stage.compositeOperation = "lighter";

    this.hue = 180;

    // hitTest vars
    this.WALL_T = 0;
    this.WALL_B = stage.canvas.height;
    this.WALL_L = 0;
    this.WALL_R = stage.canvas.width;

    // ElectrocardiogramPoints
    this.points = [
        { x: 0, y: 0 },
        { x: 15, y: -28 },
        { x: 35, y: 25 },
        { x: 54, y: -110 },
        { x: 70, y: 72 },
        { x: 76, y: 0 },
        { x: 90, y: -5 },
        { x: 100, y: -42 },
        { x: 121, y: 33 },
        { x: 142, y: 0 }
    ];
    var startPosX = 140;
    var startPosY = stage.canvas.height / 2;
    for (var i = 0, l = this.points.length; i < l; i++) {
        this.points[i].x += startPosX;
        this.points[i].y += startPosY;
    }
    this.nextPointNum = 0;
    this.nextPoint = this.points[this.nextPointNum];


    this.va = 0.05;

    this.head = {};

    this.head.x = 0;
    this.head.y = stage.canvas.height / 2;

    this.head.vx = 0.4;
    this.head.vy = 0;

    this.shapeArray = [];
};
ElectrocardiogramScene.prototype.update = function () {

    for (var i = 0; i < 14; i++) {

        if (i % 4 === 0) this.checkPoint(this.head);

        this.head.x += this.head.vx;
        this.head.y += this.head.vy;

        var shape = new CJS.Shape();
        var radius = 4;
        shape.graphics.beginFill("hsl(" + 350 + ", 60%, 50%)");
        shape.graphics.drawCircle(0, 0, radius / 2);
        shape.alpha = 1;
        shape.x = this.head.x;
        shape.y = this.head.y;

        this.shapeArray.push(shape);
        this.container.addChild(shape);
    }






    for (var i = 0, l = this.shapeArray.length; i < l; i++) {
        this.shapeArray[i].alpha -= this.va;

        if (this.shapeArray[i].alpha <= 0) {
            this.container.removeChild(this.shapeArray[i]);
            this.shapeArray.splice(i, 1);
            if (l - 1 != i) i--;
            l = this.shapeArray.length
        }
    }


    this.hitTestWall(this.head);
};
ElectrocardiogramScene.prototype.hitTestWall = function (head) {
    var POS_X = head.x;
    var POS_Y = head.y;


    // 左右
    if (POS_X < this.WALL_L) {
        head.x = this.WALL_R;
    } else if (POS_X > this.WALL_R) {
        head.x = this.WALL_L;
        this.nextPointNum = 0;
    }

    // 上下
    if (POS_Y < this.WALL_T) {
        head.y = this.WALL_B;
    } else if (POS_Y > this.WALL_B) {
        head.y = this.WALL_T;
    }

};
ElectrocardiogramScene.prototype.checkPoint = function (head) {
    var POS_X = head.x;
    var POS_Y = head.y;

    if (this.nextPointNum != -1 && POS_X >= this.nextPoint.x) {
        this.nextPointNum++;
        this.nextPoint = this.points[this.nextPointNum];

        if (this.nextPointNum === this.points.length) {
            this.nextPointNum = -1;
            this.nextPoint = this.points[0];
            head.vy = 0;
        } else {
            var diff_x = this.nextPoint.x - POS_X;
            var diff_y = this.nextPoint.y - POS_Y;
            var ratio = Math.floor(diff_y / diff_x * 100) / 100;
            head.vy = head.vx * ratio;
        }

    }
};



init();