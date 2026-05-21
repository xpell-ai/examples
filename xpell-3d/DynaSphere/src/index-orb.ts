//main entry file

//import xpell engine
import {
    Xpell as _x,
    _xlog, //Xpell logger,
    XUI, //Xpell UI module,
    _xd, //XData - Xpell real-time data cache internal module
}   from "@xpell/ui"
import { X3D } from "@xpell/3d" //Xpell 3D module,

import { GodSphere } from "./GodSphere.js"
import { SceneStars } from "./SceneStars.js"

//import style sheet
import "../public/style.css"

type LightPreset = "siri" | "studio" | "dark"
type ParticleStyle = "ring" | "dust" | "streak" | "sand" | "full-moon" | "atom" | "nop"

const _audio_state = {
    analyser: null as AnalyserNode | null,
    bins: null as Uint8Array | null,
}

let _orb: any = null
let _particle_style_label: any = null
let _particle_style_select: any = null
let _particle_style: ParticleStyle = "dust"

const _god_sphere_defaults = {
    _radius: 1,
    _intensity: 1.2,
    _idle_strength: 0.35,
    _audio_strength: 1.0,
    _halo_strength: 1.0,
    _halo_radius_mul: 1.06,
    _perfect_loop: true,
    _loop_seconds: 20,

    _siri_mode: true,
    _palette: ["#3aa0ff", "#2b6dff", "#5bd7ff"],
    _core_intensity: 1.05,
    _core_noise_strength: 0.24,
    _core_noise_speed: 1.05,
    _rim_power: 2.7,
    _rim_strength: 1.15,

    _particle_style: _particle_style,
    _particle_enabled: true,
    _particle_count: 512,
    _particle_ring_radius: 1.7,
    _particle_ring_thickness: 0.08,
    _particle_size: 0.9,
    _particle_size_max: 9.0,
    _particle_glow: 1.0,
    _particle_jitter: 0.25,
    _particle_speed: 1.0,
    _particle_breathe: 0.05,
    _particle_burst_strength: 0.35,
    _particle_burst_decay: 0.86,
    _particle_streak_len: 1.0,

    _use_lights: true,
    _light_preset: "siri" as LightPreset,
}

function _normalize_particle_style(_value: string): ParticleStyle {
    if (_value === "ring" || _value === "streak" || _value === "sand" || _value === "full-moon" || _value === "atom" || _value === "nop") return _value
    return "dust"
}

function _apply_particle_style(_style: ParticleStyle) {
    const _next = _normalize_particle_style(_style)
    _particle_style = _next
    console.log(`[index-orb] selected particle style: ${_next}`)

    if (_particle_style_label) {
        _particle_style_label._text = `Particles: ${_next}`
    }

    if (_particle_style_select) {
        const _dom = _particle_style_select.getDOMObject() as HTMLSelectElement
        if (_dom.value !== _next) _dom.value = _next
    }

    if (_orb?._set_particle_style) {
        _orb._set_particle_style(_next)
        console.log(`[index-orb] applied particle style on orb: ${_orb._particle_style ?? _next}`)
    } else {
        console.log(`[index-orb] orb is not ready yet, cached style: ${_next}`)
    }
}

function _add_light_preset(_preset: LightPreset) {
    if (_preset === "dark") {
        X3D.add({ _type: "light", _id: "god-light-ambient", _light: "ambient", _color: 0x22304a, _intensity: 0.08 })
        X3D.add({ _type: "light", _id: "god-light-point", _light: "point", _color: 0x3cb8ff, _intensity: 0.18, _position: { x: -1.2, y: 1.2, z: 1.8 } })
        return
    }

    if (_preset === "studio") {
        X3D.add({ _type: "light", _id: "god-light-ambient", _light: "ambient", _color: 0xe7ecff, _intensity: 0.2 })
        X3D.add({ _type: "light", _id: "god-light-directional", _light: "directional", _color: 0xffffff, _intensity: 0.34, _position: { x: 2.4, y: 2.1, z: 2.2 } })
        X3D.add({ _type: "light", _id: "god-light-point", _light: "point", _color: 0xa9d2ff, _intensity: 0.22, _position: { x: -1.8, y: 0.9, z: 2.4 } })
        return
    }

    X3D.add({ _type: "light", _id: "god-light-ambient", _light: "ambient", _color: 0x7aa6ff, _intensity: 0.14 })
    X3D.add({ _type: "light", _id: "god-light-hemisphere", _light: "hemisphere", _skyColor: 0x8aabff, _groundColor: 0x111420, _intensity: 0.22 })
    X3D.add({ _type: "light", _id: "god-light-directional", _light: "directional", _color: 0xffffff, _intensity: 0.26, _position: { x: 2.5, y: 2.0, z: 2.3 } })
    X3D.add({ _type: "light", _id: "god-light-point", _light: "point", _color: 0x2bc4ff, _intensity: 0.32, _position: { x: -1.5, y: 1.1, z: 2.1 } })
}

function _enable_slow_camera_orbit() {
    const _controls = (X3D as any)?.world?.controls as any
    if (!_controls) return false
    _controls.autoRotate = true
    _controls.autoRotateSpeed = 0.45
    if (_controls.target?.set) _controls.target.set(0, 0, 0)
    return true
}

async function main() {
    _x._verbose = true // enable verbose mode (xlog)
    // _x.info() // show xpell engine info
    _x.start() // start xpell engine (frame loop)
    _x.loadModules(XUI, X3D) //load Xpell UI and 3D modules
    XUI.createPlayer("x3d-player","x3d-player") //create 3D player in layer 1
    XUI.createPlayer("xplayer","xplayer") //create UI player in layer 2
    X3D.loadDefaultApp(true,"transparent") //load default 3D app with transparent background and orbit controls
    _enable_slow_camera_orbit()
    X3D.importObject(GodSphere._xtype, GodSphere) //import GodSphere object
    X3D.importObject(SceneStars._xtype, SceneStars) //import scene stars object

    // world controls can be initialized a tick later depending on app boot timing
    setTimeout(() => { _enable_slow_camera_orbit() }, 0)

    if (_god_sphere_defaults._use_lights) {
        _add_light_preset(_god_sphere_defaults._light_preset)
    }

    await X3D.add({
        _type: "scene-stars",
        _id: "scene-stars",
        _count: 1600,
        _radius_min: 10,
        _radius_max: 24,
        _size: 0.055,
        _opacity: 0.68,
        _color: "#8fd3ff",
        _rotation_speed: 0.045,
    })

    //create main view
    XUI.add({
        _type:"view",
        _id:"main-view",
        class:"main-view",
        _children:[
            {
                _type:"view",
                _id:"top-bar",
                class:"top-bar",
                _children:[
                    {
                        _id:"main-label",
                        _type:"label",
                        _text:"Xpell 3D GodSphere",
                        class:"main-label"
                    },
                    {
                        _type:"xhtml",
                        _id:"particle-style",
                        _html_tag:"select",
                        class:"particle-style-select",
                        _children:[
                            { _type:"xhtml", _id:"particle-style-opt-dust", _html_tag:"option", value:"dust", _text:"dust" },
                            { _type:"xhtml", _id:"particle-style-opt-ring", _html_tag:"option", value:"ring", _text:"ring" },
                            { _type:"xhtml", _id:"particle-style-opt-streak", _html_tag:"option", value:"streak", _text:"streak" },
                            { _type:"xhtml", _id:"particle-style-opt-sand", _html_tag:"option", value:"sand", _text:"sand" },
                            { _type:"xhtml", _id:"particle-style-opt-full-moon", _html_tag:"option", value:"full-moon", _text:"full moon" },
                            { _type:"xhtml", _id:"particle-style-opt-atom", _html_tag:"option", value:"atom", _text:"atom" },
                            { _type:"xhtml", _id:"particle-style-opt-nop", _html_tag:"option", value:"nop", _text:"nop" },
                        ],
                        _on_mount:(xobj)=>{
                            _particle_style_select = xobj
                            const _dom = xobj.getDOMObject() as HTMLSelectElement
                            _dom.value = _particle_style
                            _dom.addEventListener("change", (evt: Event) => {
                                const _target = evt.target as HTMLSelectElement | null
                                const _next = _normalize_particle_style(_target?.value ?? _particle_style)
                                _apply_particle_style(_next)
                            })
                        }
                    },
                    {
                        _type:"label",
                        _id:"particle-style-label",
                        _text:"Particles: dust",
                        class:"particle-style-label",
                        _on_mount:(xobj)=>{
                            _particle_style_label = xobj
                            xobj._text = `Particles: ${_particle_style}`
                        }
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

                                const audioContext = new AudioContext();
                                const analyser = audioContext.createAnalyser();
                                analyser.fftSize = 128;
                                const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
                                const source = audioContext.createMediaStreamSource(microphone);
                                source.connect(analyser);

                                _audio_state.analyser = analyser;
                                _audio_state.bins = new Uint8Array(analyser.frequencyBinCount);
                                if (_orb?._set_audio_bins) {
                                    _orb._set_audio_bins(_audio_state.bins);
                                }
                            }
                        }
                    }
                ]
            },
            {
                _type:"label",
                _id:"fps-label",
                _data_source:"engine:fps",
                _on_data:(xobj, data) => {
                    xobj._text = String(data ?? "");
                },
                _text:"FPS: $data",
                class:"fps-label"
            }
        ]
    })

    _orb = await X3D.add({
        _type:"god-sphere",
        _id:"god-sphere",
        ..._god_sphere_defaults,
        _position:{ x:0, y:0, z:0 },
        _on_frame:(xobj)=>{
            if (_audio_state.analyser && _audio_state.bins) {
                _audio_state.analyser.getByteFrequencyData(_audio_state.bins);
                if (xobj?._set_audio_bins) xobj._set_audio_bins(_audio_state.bins);
            }
        }
    })

    _apply_particle_style(_particle_style)
 }

main();
