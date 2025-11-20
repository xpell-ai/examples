//main entry file


//import xpell engine
import {
    Xpell as _x,
    _xlog, //Xpell logger,
    XUI, //Xpell UI module,
    X3D, //Xpell 3D module,
    _xd, //XData - Xpell real-time data cache internal module
 }   from "xpell"



 import {DynaSphere} from "./dyna-sphere"

//import style sheet
import "../public/style.css"

 async function main() {
    _x.verbose = true // enable verbose mode (xlog)
    // _x.info() // show xpell engine info
    _x.start() // start xpell engine (frame loop)
    _x.loadModules(XUI,X3D) //load Xpell UI and 3D modules
    X3D.createPlayer("x3d-player","x3d-player") //create 3D player in layer 1
    XUI.createPlayer("xplayer","xplayer") //create UI player in layer 2
    X3D.loadDefaultApp(true,"transparent") //load default 3D app with transparent background and orbit controls
    X3D.importObject(DynaSphere.xtype,DynaSphere) //import DynaSphere object
    //create main view 
    XUI.add({
        _type:"view",
        _id:"main-view",
        class:"main-view",
        _children:[
            {
                _id:"main-label",
                _type:"label",
                _text:"Xpell 3D DynaSphere",
                class:"main-label"
            },
            {
                _type:"label",
                _id:"fps-label",
                _data_source:"fps",
                _on_data:'set-text-from-data pattern:"FPS: $data"',
                _text:"FPS: $data",
                class:"fps-label"
            },
            {
                _type:"button",
                _id:"record-button",
                _text:"Record",
                class:"record-button",
                _state:0,
                _on_click:async (xobj,evt)=>{
                    if(xobj._state === 0){
                        xobj._state = 1
                        xobj._text = "Recording..."
                        const ball = X3D._o["dyna-sphere"];
                        
                        // start the microphone recording and get the audio analyzer
                        const audioContext = new AudioContext();
                        const analyser = audioContext.createAnalyser();
                        analyser.fftSize = 256;
                        const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const source = audioContext.createMediaStreamSource(microphone);
                        source.connect(analyser);
                        ball._audio_analyzer = analyser;
                    }

                }
            }

        ]
    })


    const sphere = X3D.add({
        _type:"dyna-sphere",
        _id:"dyna-sphere",
        _radius:1,
        _points:5000,
        _on_frame:  "spin y:0.001",
    })
 }


main();

