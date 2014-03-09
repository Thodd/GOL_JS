var thodd = {};
thodd.GOL = function (spec) {
    //Context variables and constants
    var FPS = spec.FPS || 20,
        canvasJQ = $(spec.canvasSelector || "#gamescreen"),
        canvasHTML = canvasJQ[0], //the HTML Canvas Element, not the jquery one
        startButton = spec.startButton,
        speedInputField = spec.speedInputField,
        ctx,
        simulationThread,
        scale = spec.scale || 4,
        screenWidth = (spec.width * scale) || 400,
        screenHeight = (spec.height * scale) || 400;

    //Biosphere stuff
    var bioWidth = 100,
        bioHeight = 100,
        biosphere,
        nextGenBiosphere, //a deep copy of the biosphere
        genCount = 0;


    /*
     *	"Painting" cells with the mouse
     */
    //flag to check if the mouse button was clicked
    var clicked = false;

    function paintWithMouse(event) {
        var x = 0;
        var y = 0;
        //var canvas = $("#gamescreen")[0];

        if (event.x && event.y) {
            x = event.x;
            y = event.y;
        } else // Firefox method to get the position
        {
            x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        x -= canvasHTML.offsetLeft;
        y -= canvasHTML.offsetTop;

        x = Math.floor((x / scale));
        y = Math.floor((y / scale))

        //drawing = cell is born
        biosphere[x][y] = 1;
        //drawing the cursor
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(x * scale, y * scale, scale, scale);
    }

    /*
     *	Initializing the biosphere, canvas and starting the simulation etc.
     */
    this.start = function () {
        //Getting the 2d Context
        ctx = canvasHTML.getContext("2d");
        canvasJQ.attr("width", screenWidth);
        canvasJQ.attr("height", screenHeight);

        //init biosphereS
        biosphere = new Array(bioWidth);
        for (var i = 0; i < biosphere.length; i++) {
            biosphere[i] = new Array(bioHeight);
        }
        randomize(biosphere, 0.5);

        //cloning the array as a backbuffer for the next generation
        nextGenBiosphere = $.extend(true, [], biosphere);
        randomize(nextGenBiosphere, 0);

        //Mouse Painting handlers
        canvasJQ.mousedown(function (event) {
            clicked = true;
            return false;
        });
        canvasJQ.mouseup(function (event) {
            clicked = false;
        });
        canvasJQ.mousemove(function (event) {
            if (clicked) {
                paintWithMouse(event);
            }
        });

        //GoButton
        startButton.toggle(
            function () {
                //start simulation
                $(this).attr("value", "stop");
                speed = speedInputField.val();
                FPS = $.isNumeric(speed) ? speed : FPS;
                simulationThread = setInterval(draw, 1000 / FPS);
            },
            function () {
                //stop simulation
                $(this).attr("value", "start");
                clearInterval(simulationThread);
            }
        );


        //drawing the first gen
        draw();
    }

    /*
     *	Randomizing an array with 1s and 0s
     *	p: the percentage for 1s
     */
    function randomize(arr, p) {
        for (var x = 0; x < arr.length; x++) {
            for (var y = 0; y < arr[0].length; y++) {
                if (Math.random() > p) {
                    arr[x][y] = 1
                } else {
                    arr[x][y] = 0
                }
            }
        }
    }

    /*
     *	Calculating the next generation
     */
    function nextGen() {
        for (var x = 0; x < bioWidth; x++) {
            for (var y = 0; y < bioHeight; y++) {
                var neighbourSum = calculateNeighbourSum(biosphere, x - 1, y - 1); //top-left
                neighbourSum += calculateNeighbourSum(biosphere, x, y - 1); //top
                neighbourSum += calculateNeighbourSum(biosphere, x + 1, y - 1); //top-right
                neighbourSum += calculateNeighbourSum(biosphere, x - 1, y); //left
                neighbourSum += calculateNeighbourSum(biosphere, x + 1, y); //right
                neighbourSum += calculateNeighbourSum(biosphere, x - 1, y + 1); //bottom-left
                neighbourSum += calculateNeighbourSum(biosphere, x, y + 1); //bottom
                neighbourSum += calculateNeighbourSum(biosphere, x + 1, y + 1); //bottom-right


                //living cells are reborn
                if (biosphere[x][y] == 1) {
                    if (neighbourSum == 2 || neighbourSum == 3) {
                        nextGenBiosphere[x][y] = 1;
                    } else {
                        nextGenBiosphere[x][y] = 0;
                    }
                } else if (biosphere[x][y] == 0) {
                    //dead cell is born
                    if (neighbourSum == 3) {
                        nextGenBiosphere[x][y] = 1;
                    } else {
                        nextGenBiosphere[x][y] = 0;
                    }
                }
            }
        }

        swap();

        genCount++;
    }

    /*
     *	Calculating the Von-Neumann-Neighbourhood for a given Position (x,y) in arr
     *	The biosphere is treated like a torus
     */
    function calculateNeighbourSum(arr, x, y) {
        var newX = x;
        var newY = y;
        if (x < 0) {
            newX = bioWidth - 1;
        } else if (x > arr.length - 1) {
            newX = 0;
        }
        if (y < 0) {
            newY = bioHeight - 1;
        } else if (y > arr.length - 1) {
            newY = 0;
        }

        try {
            return (arr[newX][newY]);
        } catch (err) {
            console.log("error: (" + x + ", " + y + ") --> (" + newX + ", " + newY + ")");
            return 0;
        }
    }

    /*
     *	Swapping between the next and the current generation
     */
    function swap() {
        var tmp = biosphere;
        biosphere = nextGenBiosphere;
        nextGenBiosphere = tmp;
    }

    /*
     *	drawing the biosphere
     */
    function clear() {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, screenWidth, screenHeight);
    }

    function draw() {
        nextGen();
        clear();
        for (var x = 0; x < biosphere.length; x++) {
            for (var y = 0; y < biosphere[0].length; y++) {

                //drawing only the living cells
                if (biosphere[x][y] == 1) {
                    ctx.fillStyle = "#4E3EAE";
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }

            }
        }
        ctx.fillStyle = "#ff0000";
        ctx.fillText("# " + genCount, 3, 10);
    }

};