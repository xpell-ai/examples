/**
 * DynaOrb - audio-reactive line (mixer style)
 *
 * Minimal usage:
 * X3D.importObject(DynaOrb._xtype, DynaOrb);
 * X3D.add({ _id: "orb", _type: "dyna-orb", _position: { x: 0, y: 0, z: 0 } });
 * // After audio listener exists:
 * // orb._set_audio_analyser(new THREE.AudioAnalyser(listener, 64));
 */
import * as THREE from 'three';
import { X3DObject, type IX3DObjectData } from '@xpell/3d';

type DynaOrbPalette = Array<number | string>;

export interface IDynaOrbData extends IX3DObjectData {
    _radius?: number;
    _detail?: number;
    _intensity?: number;
    _idle_strength?: number;
    _audio_strength?: number;
    _palette?: DynaOrbPalette;
}

const DEFAULT_PALETTE: DynaOrbPalette = ['#6cf0ff', '#8a6cff', '#ff6ad5'];

export class DynaOrb extends X3DObject {
    static _xtype = 'dyna-orb';

    private __radius = 1;
    private __detail = 64;
    private __intensity = 1;
    private __idle_strength = 0.16;
    private __audio_strength = 0.6;

    private __audio_analyser: THREE.AudioAnalyser | null = null;
    private __bins_raw: Uint8Array | null = null;
    private __bins_smoothed: Float32Array | null = null;

    private __time = 0;
    private __audio_level = 0;
    private __palette: DynaOrbPalette = DEFAULT_PALETTE.slice();

    private __geometry!: THREE.BufferGeometry;
    private __material!: THREE.ShaderMaterial;
    private __uniforms!: Record<string, { value: any }>;
    private __palette_colors = [new THREE.Color(), new THREE.Color(), new THREE.Color()];
    private __clock = new THREE.Clock();
    private __positions!: Float32Array;
    private __positions_attr!: THREE.BufferAttribute;
    private __line_t_attr!: THREE.BufferAttribute;
    private __x_positions!: Float32Array;

    declare _threes_class_args: any;

    constructor(data: IDynaOrbData, defaults: IDynaOrbData = { _type: DynaOrb._xtype }) {
        super(data, defaults, true);
        this.parse(data);

        this._three_class = THREE.LineSegments;
        this.__initMaterial();
        this.__initGeometry();
        this._threes_class_args = [this.__geometry, this.__material];
    }

    // ---------------------------------------------------------------------
    // Xpell runtime fields (underscore accessors)
    // ---------------------------------------------------------------------

    get _radius() {
        return this.__radius;
    }

    set _radius(v: number) {
        this._set_radius(v);
    }

    get _detail() {
        return this.__detail;
    }

    set _detail(v: number) {
        const next = Math.max(8, Math.min(256, Math.floor(v)));
        if (next === this.__detail) return;
        this.__detail = next;
        this.__rebuildGeometry();
    }

    get _intensity() {
        return this.__intensity;
    }

    set _intensity(v: number) {
        this._set_intensity(v);
    }

    get _audio_analyser() {
        return this.__audio_analyser;
    }

    set _audio_analyser(analyser: THREE.AudioAnalyser | null) {
        this._set_audio_analyser(analyser);
    }

    get _bins_raw() {
        return this.__bins_raw ? new Uint8Array(this.__bins_raw) : null;
    }

    set _bins_raw(bins: Uint8Array | null) {
        this._set_audio_bins(bins);
    }

    get _bins_smoothed() {
        return this.__bins_smoothed ? new Float32Array(this.__bins_smoothed) : null;
    }

    set _bins_smoothed(bins: Float32Array | null) {
        this.__bins_smoothed = bins ? new Float32Array(bins) : null;
    }

    get _time() {
        return this.__time;
    }

    set _time(v: number) {
        this.__time = v;
        if (this.__uniforms) this.__uniforms.u_time.value = v;
    }

    get _idle_strength() {
        return this.__idle_strength;
    }

    set _idle_strength(v: number) {
        this.__idle_strength = v;
        if (this.__uniforms) this.__uniforms.u_idle_strength.value = v;
    }

    get _audio_strength() {
        return this.__audio_strength;
    }

    set _audio_strength(v: number) {
        this.__audio_strength = v;
        if (this.__uniforms) this.__uniforms.u_audio_strength.value = v;
    }

    get _palette() {
        return this.__palette.slice();
    }

    set _palette(palette: DynaOrbPalette) {
        this._set_palette(palette);
    }

    // ---------------------------------------------------------------------
    // Required public API (xpell style)
    // ---------------------------------------------------------------------

    _set_audio_analyser(analyser: THREE.AudioAnalyser | null) {
        this.__audio_analyser = analyser;
        if (!analyser) {
            this.__bins_raw = null;
            this.__bins_smoothed = null;
            this.__audio_level = 0;
            return;
        }

        const size = Math.min(analyser.data.length, 64);
        this.__ensureBins(size);
    }

    _set_audio_bins(bins: Uint8Array | number[] | null) {
        this.__audio_analyser = null;
        if (!bins) {
            this.__bins_raw = null;
            this.__bins_smoothed = null;
            this.__audio_level = 0;
            return;
        }

        const size = bins.length;
        this.__ensureBins(size);
        if (!this.__bins_raw) return;

        if (bins instanceof Uint8Array) {
            this.__bins_raw.set(bins);
        } else {
            for (let i = 0; i < size; i++) {
                const v = bins[i] ?? 0;
                this.__bins_raw[i] = Math.max(0, Math.min(255, v));
            }
        }
    }

    _set_radius(v: number) {
        this.__radius = Math.max(0.001, v);
        this.__applyRadius();
    }

    _set_intensity(v: number) {
        this.__intensity = Math.max(0, v);
        if (this.__uniforms) this.__uniforms.u_intensity.value = this.__intensity;
    }

    _set_palette(palette: DynaOrbPalette) {
        const next = palette?.length ? palette : DEFAULT_PALETTE;
        this.__palette = next.slice();
        this.__applyPalette(next);
    }

    // ---------------------------------------------------------------------
    // Three setup
    // ---------------------------------------------------------------------

    getThreeObject() {
        if (!this._threeSync) {
            this._threes_class_args = [this.__geometry, this.__material];
        }
        const obj = super.getThreeObject();
        if (obj instanceof Promise) {
            return obj.then((mesh) => {
                this.__applyRadius();
                return mesh;
            });
        }
        this.__applyRadius();
        return obj;
    }

    private __initGeometry() {
        const count = this.__detail;
        const positions = new Float32Array(count * 2 * 3);
        const lineT = new Float32Array(count * 2);
        const xPositions = new Float32Array(count);
        const step = count > 1 ? 2 / (count - 1) : 0;

        for (let i = 0; i < count; i++) {
            const t = count > 1 ? i / (count - 1) : 0.5;
            const x = -1 + step * i;
            xPositions[i] = x;

            const base = i * 6;
            positions[base] = x;
            positions[base + 1] = 0;
            positions[base + 2] = 0;
            positions[base + 3] = x;
            positions[base + 4] = 0;
            positions[base + 5] = 0;

            lineT[i * 2] = t;
            lineT[i * 2 + 1] = t;
        }

        this.__positions = positions;
        this.__x_positions = xPositions;
        this.__positions_attr = new THREE.BufferAttribute(positions, 3);
        this.__line_t_attr = new THREE.BufferAttribute(lineT, 1);

        this.__geometry = new THREE.BufferGeometry();
        this.__geometry.setAttribute('position', this.__positions_attr);
        this.__geometry.setAttribute('a_t', this.__line_t_attr);
    }

    private __rebuildGeometry() {
        if (this.__geometry) this.__geometry.dispose();
        this.__initGeometry();
        if (this._threeSync instanceof THREE.LineSegments) {
            (this._threeSync as THREE.LineSegments).geometry = this.__geometry;
        }
        this._threes_class_args = [this.__geometry, this.__material];
    }

    private __initMaterial() {
        this.__uniforms = {
            u_time: { value: 0 },
            u_audio_level: { value: 0 },
            u_idle_strength: { value: this.__idle_strength },
            u_audio_strength: { value: this.__audio_strength },
            u_intensity: { value: this.__intensity },
            u_palette: { value: this.__palette_colors },
        };

        this.__applyPalette(this.__palette);

        this.__material = new THREE.ShaderMaterial({
            uniforms: this.__uniforms,
            vertexShader: `
                uniform float u_time;
                uniform float u_audio_level;
                attribute float a_t;

                varying float v_t;

                void main() {
                    v_t = a_t;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float u_time;
                uniform float u_audio_level;
                uniform float u_intensity;
                uniform vec3 u_palette[3];

                varying float v_t;

                void main() {
                    float drift = 0.5 + 0.5 * sin(u_time * 0.25 + v_t * 3.0);
                    float drift2 = 0.5 + 0.5 * sin(u_time * 0.17 + v_t * 5.0 + 1.4);

                    vec3 color = mix(u_palette[0], u_palette[1], drift);
                    color = mix(color, u_palette[2], drift2 * 0.6);

                    float pulse = 0.7 + 0.35 * sin(u_time * 0.8 + u_audio_level * 2.2);
                    float glow = (0.4 + 1.0 * u_audio_level) * u_intensity * pulse;
                    vec3 finalColor = color * glow;
                    finalColor = clamp(finalColor, 0.0, 1.2);

                    float alpha = clamp(0.2 + glow * 0.75, 0.0, 0.9);
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
        });
    }

    private __applyRadius() {
        const line = this._threeSync as THREE.LineSegments | null;
        if (!line) return;
        line.scale.set(this.__radius, this.__radius, this.__radius);
    }

    private __applyPalette(palette: DynaOrbPalette) {
        const colors = this.__palette_colors;
        const src = palette?.length ? palette : DEFAULT_PALETTE;

        for (let i = 0; i < colors.length; i++) {
            const value = src[i % src.length];
            if (typeof value === 'number') {
                colors[i].setHex(value);
            } else {
                colors[i].set(value);
            }
        }

        if (this.__uniforms) this.__uniforms.u_palette.value = colors;
    }

    private __ensureBins(size: number) {
        const next = Math.max(0, Math.floor(size));
        if (next <= 0) {
            this.__bins_raw = null;
            this.__bins_smoothed = null;
            return;
        }

        if (!this.__bins_raw || this.__bins_raw.length !== next) {
            this.__bins_raw = new Uint8Array(next);
            this.__bins_smoothed = new Float32Array(next);
        }
    }

    private __updateAudioLevel(): number {
        const raw = this.__bins_raw;
        const smooth = this.__bins_smoothed;
        if (!raw || !smooth) return 0;

        let sum = 0;
        const attack = 0.35;
        const release = 0.08;

        for (let i = 0; i < raw.length; i++) {
            const target = raw[i] / 255;
            const prev = smooth[i];
            const next = target > prev
                ? prev + (target - prev) * attack
                : prev + (target - prev) * release;
            smooth[i] = next;
            sum += next;
        }

        return sum / raw.length;
    }

    private __updateLinePositions() {
        const positions = this.__positions;
        const xPositions = this.__x_positions;
        const smooth = this.__bins_smoothed;
        if (!positions || !xPositions) return;

        const count = this.__detail;
        const smoothCount = smooth ? smooth.length : 0;
        const idleStrength = this.__idle_strength;
        const audioStrength = this.__audio_strength;
        const level = this.__audio_level;
        const time = this.__time;

        for (let i = 0; i < count; i++) {
            const base = i * 6;
            const x = xPositions[i];
            const audio = smoothCount ? smooth[i % smoothCount] : 0;
            const idle = 0.5 + 0.5 * Math.sin(time * 1.4 + i * 0.35);
            const amp = (idle * idleStrength + audio * audioStrength) * (0.6 + level * 1.6);

            positions[base] = x;
            positions[base + 1] = -amp;
            positions[base + 2] = 0;
            positions[base + 3] = x;
            positions[base + 4] = amp;
            positions[base + 5] = 0;
        }

        this.__positions_attr.needsUpdate = true;
    }

    override async onFrame(frameNumber: number) {
        const dt = this.__clock.getDelta();
        this.__time += dt;

        if (this.__audio_analyser && this.__bins_raw) {
            const source = this.__audio_analyser.getFrequencyData();
            const count = this.__bins_raw.length;
            for (let i = 0; i < count; i++) {
                this.__bins_raw[i] = source[i] ?? 0;
            }
        }

        this.__audio_level = this.__updateAudioLevel();
        if (this.__uniforms) {
            this.__uniforms.u_time.value = this.__time;
            this.__uniforms.u_audio_level.value = this.__audio_level;
        }

        this.__updateLinePositions();
        await super.onFrame(frameNumber);
    }
}

export default DynaOrb;
