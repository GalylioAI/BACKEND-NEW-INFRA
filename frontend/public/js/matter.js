function startSimulation() {

    var Engine = Matter.Engine,
        Render = Matter.Render,
        Events = Matter.Events,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Runner = Matter.Runner;

    var engine = null;
    var render = null;
    var runner = null;




    function updateSize() {

        var matterArea = document.getElementById("matter-box");
        if (!matterArea) {
            return;
        }
        var existingCanvas = matterArea.querySelector("canvas");
        if (!existingCanvas) {
            existingCanvas = document.createElement("canvas");
            matterArea.appendChild(existingCanvas);
        }

        if (engine) {
            Engine.clear(engine);
            Render.stop(render);
            Runner.stop(runner);
        }

        //width and height of the area
        let w = matterArea.offsetWidth;
        let h = matterArea.offsetHeight;

        // create an engine
        engine = Engine.create();
        var world = engine.world;

        // create a renderer
        render = Render.create({
            element: matterArea,
            canvas: existingCanvas,
            engine: engine,
            options: {
                width: w,
                height: h,
                pixelRatio: 2,
                background: 'transparent',
                wireframes: false,
            }
        });

        var radius = 25

        var ground = Bodies.rectangle((w / 2) + 160, h + 84, w + 320, 174, {
            render: {
                fillStyle: '#000'
            },
            isStatic: true
        });
        var wallLeft = Bodies.rectangle(-80, h / 2, 160, h, {
            isStatic: true
        });
        var wallRight = Bodies.rectangle(w + 80, h / 2, 160, h, {
            isStatic: true
        })
        var roof = Bodies.rectangle((w / 2) + 160, -80, w + 320, 160, {
            isStatic: true
        })

        World.add(world, [ground, wallLeft, wallRight, roof]);

        // use original template badge sprites for the same visual style
        var tagSprites = [
            { texture: "/images/get/1.png", width: 49 },
            { texture: "/images/get/2.png", width: 148 },
            { texture: "/images/get/3.png", width: 135 },
            { texture: "/images/get/4.png", width: 163 },
            { texture: "/images/get/5.png", width: 49 },
            { texture: "/images/get/6.png", width: 187 },
            { texture: "/images/get/7.png", width: 101 },
            { texture: "/images/get/8.png", width: 49 },
            { texture: "/images/get/9.png", width: 102 },
            { texture: "/images/get/10.png", width: 123 },
            { texture: "/images/get/11.png", width: 197 },
            { texture: "/images/get/12.png", width: 223 },
            { texture: "/images/get/13.png", width: 49 },
            { texture: "/images/get/14.png", width: 49 },
            { texture: "/images/get/15.png", width: 115 },
            { texture: "/images/get/16.png", width: 49 },
            { texture: "/images/get/17.png", width: 49 },
            { texture: "/images/get/18.png", width: 198 },
            { texture: "/images/get/19.png", width: 180 },
            { texture: "/images/get/20.png", width: 49 },
            { texture: "/images/get/21.png", width: 49 }
        ];

        var items = tagSprites.map(function(tag) {
            return Bodies.rectangle(Math.random() * (w - 100) + 50, 150, tag.width, 49, {
                chamfer: { radius: radius },
                render: {
                    sprite: {
                        texture: tag.texture,
                        xScale: 0.5,
                        yScale: 0.5
                    }
                }
            });
        });

        items.forEach((item, index) => {
            setTimeout(() => {
                World.add(world, item);
            }, index * 0);
        });

        // add mouse control
        var mouse = Mouse.create(render.canvas),
            mouseConstraint = MouseConstraint.create(engine, {
                mouse: mouse,
                constraint: {
                    stiffness: 0.2,
                    render: {
                        visible: false
                    }
                }
            });

        World.add(world, mouseConstraint);

        // keep the mouse in sync with rendering
        render.mouse = mouse;

        // Allow page scrolling in matter.js window
        mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
        mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);

        // Detect clicks vs. drags
        let click = false;

        document.addEventListener('mousedown', () => click = true);
        document.addEventListener('mousemove', () => click = false);
        // document.addEventListener('mouseup', () => console.log(click ? 'click' : 'drag'));

        // Create a On-Mouseup Event-Handler
        Events.on(mouseConstraint, 'mouseup', function(event) {
            var mouseConstraint = event.source;
            var bodies = engine.world.bodies;
            if (!mouseConstraint.bodyB) {
                for (i = 0; i < bodies.length; i++) {
                    var body = bodies[i];
                    // Check if clicked or dragged
                    if (click === true) {
                        if (Matter.Bounds.contains(body.bounds, mouseConstraint.mouse.position)) {
                            var bodyUrl = body.url;
                            // console.log("Body.Url >> " + bodyUrl);
                            // Hyperlinking feature
                            if (bodyUrl != undefined) {
                                //window.location.href = bodyUrl;
                                window.open(bodyUrl, '_blank');
                                // console.log("Hyperlink was opened");
                            }
                            break;
                        }
                    }
                }
            }
        });

        // run the engine
        runner = Runner.create();
        Runner.run(runner, engine);

        // run the renderer
        Render.run(render);

    }

    updateSize();

    window.addEventListener('resize', updateSize);

}

function initMatterSimulation() {
    if (window.__matterSimulationStarted) {
        return;
    }

    let canvasContainer = document.getElementById("matter-box");
    if (!canvasContainer) {
        return;
    }

    window.__matterSimulationStarted = true;
    startSimulation();
}

function waitForMatterAndInit() {
    if (typeof Matter !== "undefined") {
        initMatterSimulation();
    } else {
        setTimeout(waitForMatterAndInit, 50);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForMatterAndInit);
} else {
    waitForMatterAndInit();
}

// window.addEventListener("resize", function () {

//     let parent = document.getElementById("matter-box");
//     let secondLastChild = parent.lastElementChild?.previousElementSibling;
//     if (secondLastChild) {
//         secondLastChild.remove();
//     }
//     let lastChild = parent.lastElementChild; 
//     if (lastChild) {
//         lastChild.remove();
//     }

//     requestAnimationFrame(startSimulation);

// });