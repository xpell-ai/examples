import * as THREE from 'three';
import { X3DObject, type IX3DObjectData } from '@xpell/3d';

type GodSpherePalette = Array<number | string>;
type GodSphereLightPreset = 'siri' | 'studio' | 'dark';
type GodSphereParticleStyle = 'ring' | 'dust' | 'streak' | 'sand' | 'full-moon' | 'atom' | 'nop';
type GodSphereRotationSpeed = number | { _x?: number; _y?: number; _z?: number };

export interface IGodSphereData extends IX3DObjectData {
    _radius?: number;
    _detail?: number;
    _intensity?: number;
    _idle_strength?: number;
    _audio_strength?: number;
    _pulse_decay?: number;
    _palette?: GodSpherePalette;

    _siri_mode?: boolean;
    _core_intensity?: number;
    _core_noise_strength?: number;
    _core_noise_speed?: number;
    _rim_power?: number;
    _rim_strength?: number;

    _halo_strength?: number;
    _halo_radius_mul?: number;

    _particle_style?: GodSphereParticleStyle;
    _particle_enabled?: boolean;
    _particle_count?: number;
    _particle_ring_radius?: number;
    _particle_ring_thickness?: number;
    _particle_size?: number;
    _particle_size_max?: number;
    _particle_glow?: number;
    _particle_jitter?: number;
    _particle_speed?: number;
    _particle_breathe?: number;
    _particle_burst_strength?: number;
    _particle_burst_decay?: number;
    _particle_streak_len?: number;

    _rotation_speed?: GodSphereRotationSpeed;

    _perfect_loop?: boolean;
    _loop_seconds?: number;
    _loop_phase_offset?: number;
    _loop_ease?: number;

    _use_lights?: boolean;
    _light_preset?: GodSphereLightPreset;

    // Back-compat aliases
    _ring_radius?: number;
    _particles_count?: number;
}

const DEFAULT_PALETTE: GodSpherePalette = ['#3aa0ff', '#2b6dff', '#5bd7ff'];
const TWO_PI = Math.PI * 2;

export class GodSphere extends X3DObject {
    static _xtype = 'god-sphere';

    private __radius = 1;
    private __detail = 56;
    private __intensity = 1.2;
    private __idle_strength = 0.32;
    private __audio_strength = 1;
    private __pulse_decay = 2.8;

    private __siri_mode = true;
    private __core_intensity = 1;
    private __core_noise_strength = 0.24;
    private __core_noise_speed = 1.05;
    private __rim_power = 2.6;
    private __rim_strength = 1.1;

    private __halo_strength = 1;
    private __halo_radius_mul = 1.06;

    private __particle_style: GodSphereParticleStyle = 'dust';
    private __particle_style_enum = 1;
    private __particle_enabled = true;
    private __particle_count = 512;
    private __particle_ring_radius = 1.7;
    private __particle_ring_thickness = 0.08;
    private __particle_size = 0.9;
    private __particle_size_max = 9.0;
    private __particle_glow = 1.0;
    private __particle_jitter = 0.25;
    private __particle_speed = 1.0;
    private __particle_breathe = 0.05;
    private __particle_burst_strength = 0.35;
    private __particle_burst_decay = 0.86;
    private __particle_streak_len = 1.0;
    private __style_speed_mul = 1.0;
    private __style_jitter_mul = 1.0;
    private __style_thickness_mul = 1.0;
    private __style_size_mul = 1.0;
    private __style_streak_mul = 1.0;
    private __style_burst_mul = 1.0;
    private __atom_prev_particle_count = 512;
    private __nop_prev_particle_count = 512;
    private __nop_prev_particle_enabled = true;

    private __rotation_speed = new THREE.Vector3(0.08, 0.16, 0.03);

    private __perfect_loop = false;
    private __loop_seconds = 20;
    private __loop_phase_offset = 0;
    private __loop_ease = 0.15;

    private __use_lights = true;
    private __light_preset: GodSphereLightPreset = 'siri';

    private __audio_analyser: THREE.AudioAnalyser | null = null;
    private __bins_raw: Uint8Array | null = null;
    private __bins_smoothed: Float32Array | null = null;

    private __time = 0;
    private __audio_level = 0;
    private __bass = 0;
    private __mid = 0;
    private __high = 0;
    private __flash = 0;
    private __mid_trend = 0;
    private __particle_burst = 0;

    private __phase = 0;
    private __phase_angle = 0;
    private __loop_blend = 1;
    private __sphere_spin_phase = 0;
    private __music_speed_boost_smoothed = 1;

    private __palette: GodSpherePalette = DEFAULT_PALETTE.slice();
    private __palette_colors = [new THREE.Color(), new THREE.Color(), new THREE.Color()];

    private __sphere_geometry!: THREE.SphereGeometry;
    private __halo_geometry!: THREE.SphereGeometry;
    private __particle_geometry!: THREE.BufferGeometry;

    private __sphere_mesh!: THREE.Mesh;
    private __halo_mesh!: THREE.Mesh;
    private __particle_points!: THREE.Points;

    private __uniforms!: Record<string, { value: any }>;
    private __sphere_material!: THREE.ShaderMaterial;
    private __halo_material!: THREE.ShaderMaterial;
    private __particle_material!: THREE.ShaderMaterial;

    private __particle_positions!: Float32Array;
    private __particle_theta!: Float32Array;
    private __particle_radial!: Float32Array;
    private __particle_height!: Float32Array;
    private __particle_rand!: Float32Array;

    private __particle_positions_attr!: THREE.BufferAttribute;
    private __particle_theta_attr!: THREE.BufferAttribute;
    private __particle_radial_attr!: THREE.BufferAttribute;
    private __particle_height_attr!: THREE.BufferAttribute;
    private __particle_rand_attr!: THREE.BufferAttribute;

    private __children_attached = false;
    private __frame_clock = new THREE.Clock();

    declare _threes_class_args: any;

    constructor(data: IGodSphereData, defaults: IGodSphereData = { _type: GodSphere._xtype }) {
        super(data, defaults, true);
        this.parse(data);

        this._three_class = THREE.Group;

        this.__initMaterials();
        this.__initGeometries();
        this.__initMeshes();

        this._threes_class_args = [];
    }

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
        this._set_detail(v);
    }

    get _intensity() {
        return this.__intensity;
    }

    set _intensity(v: number) {
        this._set_intensity(v);
    }

    get _idle_strength() {
        return this.__idle_strength;
    }

    set _idle_strength(v: number) {
        this._set_idle_strength(v);
    }

    get _audio_strength() {
        return this.__audio_strength;
    }

    set _audio_strength(v: number) {
        this._set_audio_strength(v);
    }

    get _pulse_decay() {
        return this.__pulse_decay;
    }

    set _pulse_decay(v: number) {
        this._set_pulse_decay(v);
    }

    get _palette() {
        return this.__palette.slice();
    }

    set _palette(palette: GodSpherePalette) {
        this._set_palette(palette);
    }

    get _siri_mode() {
        return this.__siri_mode;
    }

    set _siri_mode(v: boolean) {
        this._set_siri_mode(v);
    }

    get _core_intensity() {
        return this.__core_intensity;
    }

    set _core_intensity(v: number) {
        this._set_core_intensity(v);
    }

    get _core_noise_strength() {
        return this.__core_noise_strength;
    }

    set _core_noise_strength(v: number) {
        this._set_core_noise_strength(v);
    }

    get _core_noise_speed() {
        return this.__core_noise_speed;
    }

    set _core_noise_speed(v: number) {
        this._set_core_noise_speed(v);
    }

    get _rim_power() {
        return this.__rim_power;
    }

    set _rim_power(v: number) {
        this._set_rim_power(v);
    }

    get _rim_strength() {
        return this.__rim_strength;
    }

    set _rim_strength(v: number) {
        this._set_rim_strength(v);
    }

    get _halo_strength() {
        return this.__halo_strength;
    }

    set _halo_strength(v: number) {
        this._set_halo_strength(v);
    }

    get _halo_radius_mul() {
        return this.__halo_radius_mul;
    }

    set _halo_radius_mul(v: number) {
        this._set_halo_radius_mul(v);
    }

    get _particle_style() {
        return this.__particle_style;
    }

    set _particle_style(v: GodSphereParticleStyle) {
        this._set_particle_style(v);
    }

    get _particle_enabled() {
        return this.__particle_enabled;
    }

    set _particle_enabled(v: boolean) {
        this._set_particle_enabled(v);
    }

    get _particle_count() {
        return this.__particle_count;
    }

    set _particle_count(v: number) {
        this._set_particle_count(v);
    }

    get _particle_ring_radius() {
        return this.__particle_ring_radius;
    }

    set _particle_ring_radius(v: number) {
        this._set_particle_ring_radius(v);
    }

    get _particle_ring_thickness() {
        return this.__particle_ring_thickness;
    }

    set _particle_ring_thickness(v: number) {
        this._set_particle_ring_thickness(v);
    }

    get _particle_size() {
        return this.__particle_size;
    }

    set _particle_size(v: number) {
        this._set_particle_size(v);
    }

    get _particle_size_max() {
        return this.__particle_size_max;
    }

    set _particle_size_max(v: number) {
        this._set_particle_size_max(v);
    }

    get _particle_glow() {
        return this.__particle_glow;
    }

    set _particle_glow(v: number) {
        this._set_particle_glow(v);
    }

    get _particle_jitter() {
        return this.__particle_jitter;
    }

    set _particle_jitter(v: number) {
        this._set_particle_jitter(v);
    }

    get _particle_speed() {
        return this.__particle_speed;
    }

    set _particle_speed(v: number) {
        this._set_particle_speed(v);
    }

    get _particle_breathe() {
        return this.__particle_breathe;
    }

    set _particle_breathe(v: number) {
        this._set_particle_breathe(v);
    }

    get _particle_burst_strength() {
        return this.__particle_burst_strength;
    }

    set _particle_burst_strength(v: number) {
        this._set_particle_burst_strength(v);
    }

    get _particle_burst_decay() {
        return this.__particle_burst_decay;
    }

    set _particle_burst_decay(v: number) {
        this._set_particle_burst_decay(v);
    }

    get _particle_streak_len() {
        return this.__particle_streak_len;
    }

    set _particle_streak_len(v: number) {
        this._set_particle_streak_len(v);
    }

    get _rotation_speed() {
        return {
            _x: this.__rotation_speed.x,
            _y: this.__rotation_speed.y,
            _z: this.__rotation_speed.z,
        };
    }

    set _rotation_speed(v: GodSphereRotationSpeed) {
        this._set_rotation_speed(v);
    }

    get _perfect_loop() {
        return this.__perfect_loop;
    }

    set _perfect_loop(v: boolean) {
        this._set_perfect_loop(v);
    }

    get _loop_seconds() {
        return this.__loop_seconds;
    }

    set _loop_seconds(v: number) {
        this._set_loop_seconds(v);
    }

    get _loop_phase_offset() {
        return this.__loop_phase_offset;
    }

    set _loop_phase_offset(v: number) {
        this._set_loop_phase_offset(v);
    }

    get _loop_ease() {
        return this.__loop_ease;
    }

    set _loop_ease(v: number) {
        this._set_loop_ease(v);
    }

    get _use_lights() {
        return this.__use_lights;
    }

    set _use_lights(v: boolean) {
        this._set_use_lights(v);
    }

    get _light_preset() {
        return this.__light_preset;
    }

    set _light_preset(v: GodSphereLightPreset) {
        this._set_light_preset(v);
    }

    // Back-compat aliases
    get _ring_radius() {
        return this.__particle_ring_radius;
    }

    set _ring_radius(v: number) {
        this._set_particle_ring_radius(v);
    }

    get _particles_count() {
        return this.__particle_count;
    }

    set _particles_count(v: number) {
        this._set_particle_count(v);
    }

    get _audio_analyser() {
        return this.__audio_analyser;
    }

    set _audio_analyser(analyser: THREE.AudioAnalyser | null) {
        this._set_audio_analyser(analyser);
    }

    _set_radius(v: number) {
        this.__radius = Math.max(0.001, v);
        this.__applyScale();
    }

    _set_detail(v: number) {
        const next = Math.max(8, Math.min(128, Math.floor(v)));
        if (next === this.__detail) return;
        this.__detail = next;
        if (this.__sphere_mesh && this.__halo_mesh) this.__rebuildSphereGeometries();
    }

    _set_intensity(v: number) {
        this.__intensity = Math.max(0, v);
    }

    _set_idle_strength(v: number) {
        this.__idle_strength = Math.max(0, v);
    }

    _set_audio_strength(v: number) {
        this.__audio_strength = Math.max(0, v);
    }

    _set_pulse_decay(v: number) {
        this.__pulse_decay = Math.max(0.001, v);
    }

    _set_palette(palette: GodSpherePalette) {
        const next = palette?.length ? palette.slice(0, 3) : DEFAULT_PALETTE;
        this.__palette = next;
        this.__applyPalette(next);
    }

    _set_siri_mode(v: boolean) {
        this.__siri_mode = !!v;
    }

    _set_core_intensity(v: number) {
        this.__core_intensity = Math.max(0, v);
    }

    _set_core_noise_strength(v: number) {
        this.__core_noise_strength = Math.max(0, Math.min(1, v));
    }

    _set_core_noise_speed(v: number) {
        this.__core_noise_speed = Math.max(0, v);
    }

    _set_rim_power(v: number) {
        this.__rim_power = Math.max(0.5, v);
    }

    _set_rim_strength(v: number) {
        this.__rim_strength = Math.max(0, v);
    }

    _set_halo_strength(v: number) {
        this.__halo_strength = Math.max(0, v);
        if (this.__halo_mesh) this.__halo_mesh.visible = this.__halo_strength > 0;
    }

    _set_halo_radius_mul(v: number) {
        this.__halo_radius_mul = Math.max(1.01, Math.min(1.5, v));
        this.__applyScale();
    }

    _set_particle_style(style: GodSphereParticleStyle) {
        const prev = this.__particle_style;
        const next = this.__normalizeStyle(style);

        if (next === 'nop') {
            if (this.__particle_count > 0) this.__nop_prev_particle_count = this.__particle_count;
            this.__nop_prev_particle_enabled = this.__particle_enabled;

            this.__particle_style = next;
            this.__particle_style_enum = this.__styleToEnum(next);
            this.__applyStyleProfile(next);

            if (this.__particle_enabled) this._set_particle_enabled(false);
            if (this.__particle_count !== 0) this._set_particle_count(0);
            return;
        }

        if (prev === 'nop') {
            const restoreCount = Math.max(0, this.__nop_prev_particle_count);
            if (this.__particle_count === 0 && restoreCount > 0) this._set_particle_count(restoreCount);
            this._set_particle_enabled(this.__nop_prev_particle_enabled);
        }

        if (prev !== 'atom' && next === 'atom') {
            this.__atom_prev_particle_count = this.__particle_count;
        }

        this.__particle_style = next;
        this.__particle_style_enum = this.__styleToEnum(next);
        this.__applyStyleProfile(next);

        if (next === 'atom') {
            if (this.__particle_count !== 100) this._set_particle_count(100);
            return;
        }

        if (prev === 'atom' && this.__particle_count === 100) {
            const restoreCount = Math.max(16, Math.min(4096, this.__atom_prev_particle_count));
            if (restoreCount !== 100) this._set_particle_count(restoreCount);
        }
    }

    _set_particle_enabled(enabled: boolean) {
        this.__particle_enabled = !!enabled;
        if (this.__particle_points) {
            this.__particle_points.visible = this.__particle_enabled && this.__particle_count > 0;
        }
    }

    _set_particle_count(v: number) {
        const next = Math.max(0, Math.min(4096, Math.floor(v)));
        if (next === this.__particle_count) return;
        this.__particle_count = next;
        if (this.__particle_points) this.__rebuildParticleGeometry();
    }

    _set_particle_ring_radius(v: number) {
        this.__particle_ring_radius = Math.max(0.1, v);
        this.__reseedParticlePositions();
    }

    _set_particle_ring_thickness(v: number) {
        this.__particle_ring_thickness = Math.max(0.001, v);
    }

    _set_particle_size(v: number) {
        this.__particle_size = Math.max(0.05, v);
    }

    _set_particle_size_max(v: number) {
        this.__particle_size_max = Math.max(1, v);
    }

    _set_particle_glow(v: number) {
        this.__particle_glow = Math.max(0, v);
    }

    _set_particle_jitter(v: number) {
        this.__particle_jitter = Math.max(0, v);
    }

    _set_particle_speed(v: number) {
        this.__particle_speed = Math.max(0, v);
    }

    _set_particle_breathe(v: number) {
        this.__particle_breathe = Math.max(0, v);
    }

    _set_particle_burst_strength(v: number) {
        this.__particle_burst_strength = Math.max(0, v);
    }

    _set_particle_burst_decay(v: number) {
        this.__particle_burst_decay = Math.max(0.1, Math.min(0.999, v));
    }

    _set_particle_streak_len(v: number) {
        this.__particle_streak_len = Math.max(0, v);
    }

    _set_rotation_speed(v: GodSphereRotationSpeed) {
        if (typeof v === 'number') {
            this.__rotation_speed.set(v, v, v);
            return;
        }

        this.__rotation_speed.set(
            v?._x ?? this.__rotation_speed.x,
            v?._y ?? this.__rotation_speed.y,
            v?._z ?? this.__rotation_speed.z,
        );
    }

    _set_perfect_loop(v: boolean) {
        this.__perfect_loop = !!v;
    }

    _set_loop_seconds(v: number) {
        this.__loop_seconds = Math.max(0.001, v);
    }

    _set_loop_phase_offset(v: number) {
        this.__loop_phase_offset = Number.isFinite(v) ? v : 0;
    }

    _set_loop_ease(v: number) {
        this.__loop_ease = Math.max(0, Math.min(1, v));
    }

    _set_use_lights(v: boolean) {
        this.__use_lights = !!v;
    }

    _set_light_preset(v: GodSphereLightPreset) {
        if (v === 'studio' || v === 'dark') {
            this.__light_preset = v;
            return;
        }
        this.__light_preset = 'siri';
    }

    _set_audio_analyser(analyser: THREE.AudioAnalyser | null) {
        this.__audio_analyser = analyser;
        if (!analyser) {
            this.__bins_raw = null;
            this.__bins_smoothed = null;
            this.__audio_level = 0;
            this.__bass = 0;
            this.__mid = 0;
            this.__high = 0;
            return;
        }

        const size = Math.min(analyser.data.length, 512);
        this.__ensureBins(size);
    }

    _set_audio_bins(bins: Uint8Array | number[] | null) {
        this.__audio_analyser = null;
        if (!bins) {
            this.__bins_raw = null;
            this.__bins_smoothed = null;
            this.__audio_level = 0;
            this.__bass = 0;
            this.__mid = 0;
            this.__high = 0;
            return;
        }

        const size = bins.length;
        this.__ensureBins(size);
        if (!this.__bins_raw) return;

        if (bins instanceof Uint8Array) {
            this.__bins_raw.set(bins);
            return;
        }

        for (let i = 0; i < size; i++) {
            const value = bins[i] ?? 0;
            this.__bins_raw[i] = Math.max(0, Math.min(255, value));
        }
    }

    _set_audio_bands(_bass: number, _mid: number, _high: number) {
        const bass = Math.max(0, Math.min(1, _bass));
        const mid = Math.max(0, Math.min(1, _mid));
        const high = Math.max(0, Math.min(1, _high));

        this.__bass += (bass - this.__bass) * 0.45;
        this.__mid += (mid - this.__mid) * 0.45;
        this.__high += (high - this.__high) * 0.45;

        const mixed = this.__bass * 0.62 + this.__mid * 0.26 + this.__high * 0.12;
        this.__audio_level = Math.min(1, mixed * (0.85 + this.__audio_strength * 0.3));

        const snareSpike = Math.max(0, this.__mid - this.__mid_trend - 0.02);
        this.__mid_trend += (this.__mid - this.__mid_trend) * 0.22;

        if (snareSpike > 0) {
            const boosted = Math.min(1, snareSpike * (2.6 + this.__audio_strength));
            if (boosted > this.__flash) this.__flash = boosted;

            const burst = Math.min(1, snareSpike * (3.4 + this.__audio_strength));
            if (burst > this.__particle_burst) this.__particle_burst = burst;
        }
    }

    getThreeObject() {
        if (!this._threeSync) this._threes_class_args = [];

        const obj = super.getThreeObject();
        if (obj instanceof Promise) {
            return obj.then((threeObj) => {
                this.__attachChildren(threeObj as THREE.Group);
                return threeObj;
            });
        }

        if (obj instanceof THREE.Group) this.__attachChildren(obj);
        return obj;
    }

    override async onFrame(frameNumber: number) {
        const dt = this.__frame_clock.getDelta();
        this.__time += dt;

        if (this.__audio_analyser && this.__bins_raw) {
            const source = this.__audio_analyser.getFrequencyData();
            const count = Math.min(source.length, this.__bins_raw.length);
            for (let i = 0; i < count; i++) {
                this.__bins_raw[i] = source[i] ?? 0;
            }
        }

        this.__updateAudio(dt);
        this.__updateLoopState();
        this.__updateVisuals(dt);

        await super.onFrame(frameNumber);
    }

    private __attachChildren(group: THREE.Group) {
        if (this.__children_attached) return;

        group.add(this.__sphere_mesh);
        group.add(this.__halo_mesh);
        group.add(this.__particle_points);

        this.__children_attached = true;

        this.__applyScale();
        this.__reseedParticlePositions();
    }

    private __initMaterials() {
        this.__uniforms = {
            u_time: { value: 0 },
            u_phase: { value: 0 },
            u_audio_level: { value: 0 },
            u_flash: { value: 0 },

            u_bass: { value: 0 },
            u_mid: { value: 0 },
            u_high: { value: 0 },
            u_burst: { value: 0 },

            u_intensity: { value: this.__intensity * this.__core_intensity },
            u_core_noise_strength: { value: this.__core_noise_strength },
            u_core_noise_speed: { value: this.__core_noise_speed },
            u_rim_power: { value: this.__rim_power },
            u_rim_strength: { value: this.__rim_strength },
            u_halo_strength: { value: this.__halo_strength },
            u_siri_mode: { value: this.__siri_mode ? 1 : 0 },
            u_core_radius: { value: this.__radius },

            u_style: { value: this.__particle_style_enum },
            u_particle_enabled: { value: this.__particle_enabled ? 1 : 0 },
            u_size: { value: this.__particle_size },
            u_size_max: { value: this.__particle_size_max },
            u_glow: { value: this.__particle_glow },
            u_speed: { value: this.__particle_speed },
            u_jitter: { value: this.__particle_jitter },
            u_breathe: { value: this.__particle_breathe },
            u_ring_radius: { value: this.__particle_ring_radius },
            u_ring_thickness: { value: this.__particle_ring_thickness },
            u_streak_len: { value: this.__particle_streak_len },
            u_particle_burst_strength: { value: this.__particle_burst_strength },
            u_music_speed: { value: 0 },

            u_palette0: { value: this.__palette_colors[0] },
            u_palette1: { value: this.__palette_colors[1] },
            u_palette2: { value: this.__palette_colors[2] },
        };

        this.__applyPalette(this.__palette);

        this.__sphere_material = new THREE.ShaderMaterial({
            uniforms: this.__uniforms,
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vWorldPos;

                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPos = worldPos.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `,
            fragmentShader: `
                uniform float u_time;
                uniform float u_phase;
                uniform float u_audio_level;
                uniform float u_flash;
                uniform float u_intensity;
                uniform float u_core_noise_strength;
                uniform float u_core_noise_speed;
                uniform float u_rim_power;
                uniform float u_rim_strength;
                uniform float u_siri_mode;
                uniform float u_music_speed;
                uniform vec3 u_palette0;
                uniform vec3 u_palette1;
                uniform vec3 u_palette2;

                varying vec3 vNormal;
                varying vec3 vWorldPos;

                void main() {
                    vec3 viewDir = normalize(cameraPosition - vWorldPos);
                    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), u_rim_power);

                    float phaseAngle = u_phase * 6.28318530718;
                    float n0 = sin((vWorldPos.x + phaseAngle * 0.40) * 4.0 + u_time * u_core_noise_speed);
                    float n1 = sin((vWorldPos.y - phaseAngle * 0.70) * 5.2 - u_time * u_core_noise_speed * 0.72);
                    float n2 = sin((vWorldPos.z + phaseAngle * 1.10) * 6.1 + u_time * u_core_noise_speed * 0.52);
                    float noise = (n0 + n1 + n2) / 3.0;

                    float grad = clamp(0.50 + vNormal.y * 0.48 + noise * u_core_noise_strength, 0.0, 1.0);
                    float speed = clamp(u_music_speed, 0.0, 1.0);
                    vec3 oceanBlue = vec3(0.12, 0.42, 1.0);
                    vec3 oceanRed = vec3(1.0, 0.22, 0.18);
                    vec3 speedCycle = mix(oceanBlue, oceanRed, speed);
                    vec3 baseColor = speedCycle * (0.25 + grad * 0.75);

                    float siriGain = mix(0.85, 1.0, u_siri_mode);
                    float core = u_intensity * siriGain * (0.55 + u_audio_level * 0.75 + u_flash * 0.35);
                    float rim = fresnel * u_rim_strength * (0.35 + u_audio_level * 0.95 + u_flash * 0.55);

                    vec3 color = baseColor * core;
                    color += speedCycle * rim * 0.90;
                    color = clamp(color, 0.0, 1.5);

                    float alpha = 0.9;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
            toneMapped: false,
        });

        this.__halo_material = new THREE.ShaderMaterial({
            uniforms: this.__uniforms,
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vWorldPos;

                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPos = worldPos.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `,
            fragmentShader: `
                uniform float u_audio_level;
                uniform float u_flash;
                uniform float u_halo_strength;
                uniform float u_phase;
                uniform float u_rim_power;
                uniform vec3 u_palette0;
                uniform vec3 u_palette2;

                varying vec3 vNormal;
                varying vec3 vWorldPos;

                void main() {
                    vec3 viewDir = normalize(cameraPosition - vWorldPos);
                    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), max(1.2, u_rim_power * 1.2));
                    float phasePulse = 0.82 + 0.18 * sin(u_phase * 12.56637061436);
                    float strength = fresnel * u_halo_strength * phasePulse * (0.6 + u_audio_level + u_flash * 0.55);

                    vec3 color = mix(u_palette0, u_palette2, 0.55) * (0.8 + u_audio_level * 0.55);
                    float alpha = clamp(strength * 0.85, 0.0, 0.68);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            toneMapped: false,
        });

        this.__particle_material = new THREE.ShaderMaterial({
            uniforms: this.__uniforms,
            vertexShader: `
                attribute float a_theta;
                attribute float a_radial;
                attribute float a_height;
                attribute float a_rand;

                uniform float u_phase;
                uniform float u_bass;
                uniform float u_mid;
                uniform float u_high;
                uniform float u_burst;
                uniform float u_audio_level;
                uniform float u_core_radius;
                uniform float u_style;
                uniform float u_size;
                uniform float u_size_max;
                uniform float u_glow;
                uniform float u_speed;
                uniform float u_jitter;
                uniform float u_breathe;
                uniform float u_ring_radius;
                uniform float u_ring_thickness;
                uniform float u_streak_len;
                uniform float u_particle_enabled;
                uniform float u_particle_burst_strength;

                varying float v_style;
                varying float v_rand;
                varying float v_strength;
                varying float v_rot;
                varying float v_burst;

                void main() {
                    if (u_particle_enabled < 0.5) {
                        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
                        gl_PointSize = 0.0;
                        v_style = u_style;
                        v_rand = a_rand;
                        v_strength = 0.0;
                        v_rot = 0.0;
                        v_burst = 0.0;
                        return;
                    }

                    float phaseAngle = u_phase * 6.28318530718;
                    float breathe = 1.0 + u_bass * u_breathe;
                    float orbit = a_theta + phaseAngle * u_speed + a_rand * 0.5;
                    float bounceAmp = (u_bass * 0.09 + u_mid * 0.05 + u_burst * 0.14 + u_audio_level * 0.04);
                    float bounceMul = 0.55;
                    if (u_style < 0.5) {
                        bounceMul = 1.0;
                    } else if (u_style < 1.5) {
                        bounceMul = 0.72;
                    } else if (u_style < 2.5) {
                        bounceMul = 0.45;
                    } else if (u_style < 3.5) {
                        bounceMul = 0.85;
                    } else if (u_style < 4.5) {
                        bounceMul = 0.62;
                    } else {
                        bounceMul = 0.72;
                    }

                    vec3 pos = vec3(0.0);

                    if (u_style < 0.5) {
                        float radius = (u_ring_radius + a_radial * u_ring_thickness * 0.70) * breathe;
                        float jitter = sin(phaseAngle * 8.0 + a_rand * 18.0) * u_jitter * (0.008 + u_high * 0.018);
                        pos.x = cos(orbit) * (radius + jitter);
                        pos.z = sin(orbit) * (radius + jitter);
                        pos.y = a_height * u_ring_thickness * 0.35 + sin(orbit * 2.0 + phaseAngle * 2.0) * u_jitter * 0.008;
                    } else if (u_style < 1.5) {
                        float orbitDust = a_theta + phaseAngle * (u_speed * 0.85) + a_rand * 1.2;
                        float radius = (u_ring_radius + a_radial * u_ring_thickness * 3.40 + sin(orbitDust * 3.0 + a_rand * 20.0) * u_jitter * 0.10) * breathe;
                        pos.x = cos(orbitDust) * radius;
                        pos.z = sin(orbitDust) * radius;
                        pos.y = a_height * u_ring_thickness * 2.8 + cos(orbitDust * 2.6 + a_rand * 9.0 + phaseAngle * 1.7) * u_jitter * 0.14;
                        orbit = orbitDust;
                    } else if (u_style < 2.5) {
                        float orbitStreak = a_theta + phaseAngle * (u_speed * 1.8 + 0.5) + a_rand * 1.6;
                        float radius = (u_ring_radius + a_radial * u_ring_thickness * 0.55) * (1.0 + u_bass * u_breathe * 0.5);
                        pos.x = cos(orbitStreak) * radius;
                        pos.z = sin(orbitStreak) * radius;
                        pos.y = a_height * u_ring_thickness * 0.35 + sin(orbitStreak * 2.2 + phaseAngle * 2.8) * u_jitter * 0.012;
                        vec3 streakDir = normalize(vec3(cos(orbitStreak), a_height * 0.18, sin(orbitStreak)));
                        float streakPulse = (u_bass * 0.55 + u_burst * 0.45) * u_particle_burst_strength * 0.42;
                        pos += streakDir * streakPulse;
                        orbit = orbitStreak;
                    } else if (u_style < 3.5) {
                        float orbitSand = a_theta + phaseAngle * (u_speed * 1.05) + a_rand * 0.9;
                        float radius = (u_ring_radius + a_radial * u_ring_thickness * 2.8 + sin(orbitSand * 2.4 + a_rand * 16.0) * u_jitter * 0.09) * breathe;
                        pos.x = cos(orbitSand) * radius;
                        pos.z = sin(orbitSand) * radius;
                        pos.y = a_height * u_ring_thickness * 2.2;

                        vec3 burstDir = normalize(vec3(cos(orbitSand), a_height * 0.35, sin(orbitSand)));
                        float burstPush = u_burst * u_particle_burst_strength * (0.55 + a_rand * 1.35);
                        pos += burstDir * burstPush;
                        orbit = orbitSand;
                    } else if (u_style < 4.5) {
                        float orbitMoon = a_theta + phaseAngle * (u_speed * 0.75 + 0.25) + a_rand * 2.2;
                        float cosPhi = clamp(a_height, -1.0, 1.0);
                        float sinPhi = sqrt(max(0.0, 1.0 - cosPhi * cosPhi));
                        float shellBase = max(u_core_radius * 1.18, u_ring_radius * 0.78);
                        float shellSpread = max(u_ring_thickness * 1.9, u_core_radius * 0.18);
                        float radius = (shellBase + abs(a_radial) * shellSpread) * (1.0 + u_bass * u_breathe * 0.55);
                        pos.x = cos(orbitMoon) * sinPhi * radius;
                        pos.y = cosPhi * radius;
                        pos.z = sin(orbitMoon) * sinPhi * radius;
                        pos += normalize(vec3(pos.x, pos.y * 0.8, pos.z)) * (u_burst * u_particle_burst_strength * 0.22);
                        orbit = orbitMoon;
                    } else {
                        float family = floor(a_rand * 6.0);
                        float yaw = family * 1.0471975512 + a_height * 0.7;
                        float tilt = a_height * 1.05 + sin(a_rand * 19.0) * 0.28;
                        float orbitAtom = a_theta * (1.0 + family * 0.06) + phaseAngle * (u_speed * (1.2 + family * 0.16)) + a_rand * 6.28318530718;
                        float shellBase = max(u_core_radius * 1.28, u_ring_radius * 0.92);
                        float shellSpread = max(u_ring_thickness * 1.6, u_core_radius * 0.12);
                        float radius = (shellBase + abs(a_radial) * shellSpread) * (1.0 + u_bass * u_breathe * 0.38);

                        vec3 local = vec3(cos(orbitAtom) * radius, sin(orbitAtom) * radius * 0.34, 0.0);

                        float cy = cos(yaw);
                        float sy = sin(yaw);
                        vec3 yRot = vec3(local.x * cy, local.y, -local.x * sy);

                        float ct = cos(tilt);
                        float st = sin(tilt);
                        pos.x = yRot.x;
                        pos.y = yRot.y * ct - yRot.z * st;
                        pos.z = yRot.y * st + yRot.z * ct;

                        pos += normalize(vec3(pos.x, pos.y * 0.9, pos.z)) * (u_burst * u_particle_burst_strength * 0.10);
                        orbit = orbitAtom;
                    }

                    float bounce = sin(orbit * 3.2 + phaseAngle * 5.0 + a_rand * 6.28318530718) * bounceAmp * bounceMul;
                    pos.y += bounce;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;

                    float pointSize = u_size * (1.0 + u_glow * 0.35 + u_bass * 0.35);
                    pointSize *= 1.0 + (u_bass * 0.18 + u_burst * 0.16) * (0.65 + bounceMul * 0.35);
                    if (u_style < 0.5) {
                        pointSize *= 0.9 + u_bass * 0.40 + u_burst * 0.35;
                    } else if (u_style > 1.5 && u_style < 2.5) {
                        pointSize *= 1.15 + u_streak_len * 0.55 + u_high * 0.45;
                    } else if (u_style > 2.5 && u_style < 3.5) {
                        pointSize *= 0.95 + u_burst * 0.65;
                    } else if (u_style > 3.5 && u_style < 4.5) {
                        pointSize *= 0.86 + u_bass * 0.26 + u_high * 0.18;
                    } else if (u_style > 4.5) {
                        pointSize *= 0.95 + u_bass * 0.30 + u_high * 0.22 + u_burst * 0.25;
                    }

                    float perspective = 120.0 / max(0.2, -mvPosition.z);
                    gl_PointSize = clamp(pointSize * perspective, 1.0, u_size_max);

                    v_style = u_style;
                    v_rand = a_rand;
                    v_strength = 0.35 + u_bass * 0.65;
                    v_rot = orbit;
                    v_burst = u_burst;
                }
            `,
            fragmentShader: `
                uniform float u_time;
                uniform float u_phase;
                uniform float u_bass;
                uniform float u_mid;
                uniform float u_high;
                uniform float u_burst;
                uniform float u_glow;
                uniform float u_streak_len;
                uniform float u_music_speed;
                uniform vec3 u_palette0;
                uniform vec3 u_palette1;
                uniform vec3 u_palette2;

                varying float v_style;
                varying float v_rand;
                varying float v_strength;
                varying float v_rot;
                varying float v_burst;

                void main() {
                    vec2 uv = gl_PointCoord * 2.0 - 1.0;
                    float mask;

                    if (v_style > 4.5) {
                        float c = cos(v_rot);
                        float s = sin(v_rot);
                        vec2 ruv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
                        float head = smoothstep(0.75, 0.0, dot(ruv, ruv));
                        float tailDist = ((ruv.x + 0.62) * (ruv.x + 0.62)) / 1.65 + (ruv.y * ruv.y) / 0.16;
                        float tail = smoothstep(1.0, 0.0, tailDist);
                        float tailFade = smoothstep(0.55, -0.95, ruv.x);
                        mask = max(head, tail * tailFade);
                    } else if (v_style > 1.5 && v_style < 2.5) {
                        float c = cos(v_rot);
                        float s = sin(v_rot);
                        vec2 ruv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
                        float len = 1.0 + u_streak_len * (0.8 + u_high * 0.8);
                        float dist = (ruv.x * ruv.x) / (0.18 * len) + (ruv.y * ruv.y) / 0.55;
                        mask = smoothstep(1.2, 0.0, dist);
                    } else {
                        float d = dot(uv, uv);
                        mask = smoothstep(1.0, 0.0, d);
                    }

                    if (mask <= 0.001) discard;

                    float phaseWave = 0.5 + 0.5 * sin(u_phase * 12.56637061436 + v_rand * 18.0);
                    vec3 speedColor = mix(vec3(1.0, 0.05, 0.05), vec3(0.08, 1.0, 0.10), clamp(u_music_speed, 0.0, 1.0));
                    float twinkle = 0.90 + phaseWave * 0.10;
                    vec3 color = speedColor * twinkle;

                    float alpha = mask * (0.22 + u_glow * 0.24 + v_strength * 0.45);
                    float beat = clamp(u_bass * 0.70 + u_mid * 0.35 + u_burst * 0.85, 0.0, 1.0);
                    float beatMix = 0.28;
                    if (v_style < 0.5) {
                        beatMix = 0.52;
                    } else if (v_style < 1.5) {
                        beatMix = 0.38;
                    } else if (v_style < 2.5) {
                        beatMix = 0.30;
                    } else if (v_style < 3.5) {
                        beatMix = 0.44;
                    } else if (v_style < 4.5) {
                        beatMix = 0.34;
                    } else {
                        beatMix = 0.40;
                    }
                    vec3 beatColor = mix(vec3(1.0, 0.05, 0.05), vec3(0.08, 1.0, 0.10), clamp(u_music_speed + beat * 0.22, 0.0, 1.0));
                    color = mix(color, beatColor, (0.16 + beat * 0.32) * beatMix);
                    alpha += beat * 0.12 * beatMix;

                    if (v_style < 0.5) {
                        alpha += beat * 0.08;
                    } else if (v_style > 0.5 && v_style < 1.5) {
                        color *= 0.92 + u_high * 0.08;
                        alpha *= 0.85 + (0.5 + 0.5 * sin(v_rand * 42.0 + u_phase * 18.0)) * 0.15 * (0.5 + u_high);
                    }

                    if (v_style > 2.5 && v_style < 3.5) {
                        color = min(vec3(1.0), color + vec3(v_burst * 0.10));
                        alpha += v_burst * 0.22 * mask;
                    }

                    if (v_style > 3.5 && v_style < 4.5) {
                        color = min(vec3(1.0), color + vec3(u_high * 0.08));
                        alpha += u_bass * 0.10 + u_high * 0.08;
                    }

                    if (v_style > 4.5) {
                        float c = cos(v_rot);
                        float s = sin(v_rot);
                        vec2 ruv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
                        float tailGlow = smoothstep(0.8, -0.95, ruv.x);
                        float headGlow = smoothstep(0.45, -0.20, length(ruv));
                        color += vec3(1.0) * (0.12 * headGlow + 0.08 * tailGlow * (0.5 + u_high));
                        alpha += u_bass * 0.10 + u_high * 0.08 + v_burst * 0.14 * mask + tailGlow * 0.10;
                    }

                    if (v_style > 1.5 && v_style < 2.5) {
                        color = mix(color, vec3(1.0), 0.25 + min(0.35, u_streak_len * 0.18));
                        alpha += u_high * 0.18 + u_streak_len * 0.12;
                    }

                    alpha = clamp(alpha, 0.0, 1.0);
                    vec3 outColor = color * (0.7 + v_strength * 0.8);
                    gl_FragColor = vec4(outColor, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
        });
    }

    private __initGeometries() {
        const widthSegments = this.__detail;
        const heightSegments = Math.max(8, Math.floor(this.__detail * 0.66));

        this.__sphere_geometry = new THREE.SphereGeometry(1, widthSegments, heightSegments);
        this.__halo_geometry = new THREE.SphereGeometry(1, widthSegments, heightSegments);

        this.__particle_geometry = new THREE.BufferGeometry();
        this.__buildParticleData();
        this.__particle_geometry.setAttribute('position', this.__particle_positions_attr);
        this.__particle_geometry.setAttribute('a_theta', this.__particle_theta_attr);
        this.__particle_geometry.setAttribute('a_radial', this.__particle_radial_attr);
        this.__particle_geometry.setAttribute('a_height', this.__particle_height_attr);
        this.__particle_geometry.setAttribute('a_rand', this.__particle_rand_attr);
        this.__particle_geometry.setDrawRange(0, this.__particle_count);
    }

    private __initMeshes() {
        this.__sphere_mesh = new THREE.Mesh(this.__sphere_geometry, this.__sphere_material);
        this.__sphere_mesh.frustumCulled = true;

        this.__halo_mesh = new THREE.Mesh(this.__halo_geometry, this.__halo_material);
        this.__halo_mesh.visible = this.__halo_strength > 0;
        this.__halo_mesh.frustumCulled = true;

        this.__particle_points = new THREE.Points(this.__particle_geometry, this.__particle_material);
        this.__particle_points.visible = this.__particle_enabled && this.__particle_count > 0;
        this.__particle_points.frustumCulled = false;
    }

    private __rebuildSphereGeometries() {
        const widthSegments = this.__detail;
        const heightSegments = Math.max(8, Math.floor(this.__detail * 0.66));

        const sphereGeometry = new THREE.SphereGeometry(1, widthSegments, heightSegments);
        const haloGeometry = new THREE.SphereGeometry(1, widthSegments, heightSegments);

        if (this.__sphere_geometry) this.__sphere_geometry.dispose();
        if (this.__halo_geometry) this.__halo_geometry.dispose();

        this.__sphere_geometry = sphereGeometry;
        this.__halo_geometry = haloGeometry;

        this.__sphere_mesh.geometry = this.__sphere_geometry;
        this.__halo_mesh.geometry = this.__halo_geometry;
    }

    private __rebuildParticleGeometry() {
        this.__buildParticleData();

        if (this.__particle_geometry) this.__particle_geometry.dispose();

        this.__particle_geometry = new THREE.BufferGeometry();
        this.__particle_geometry.setAttribute('position', this.__particle_positions_attr);
        this.__particle_geometry.setAttribute('a_theta', this.__particle_theta_attr);
        this.__particle_geometry.setAttribute('a_radial', this.__particle_radial_attr);
        this.__particle_geometry.setAttribute('a_height', this.__particle_height_attr);
        this.__particle_geometry.setAttribute('a_rand', this.__particle_rand_attr);
        this.__particle_geometry.setDrawRange(0, this.__particle_count);

        this.__particle_points.geometry = this.__particle_geometry;
        this.__particle_points.visible = this.__particle_enabled && this.__particle_count > 0;

        this.__reseedParticlePositions();
    }

    private __buildParticleData() {
        const count = this.__particle_count;

        this.__particle_positions = new Float32Array(count * 3);
        this.__particle_theta = new Float32Array(count);
        this.__particle_radial = new Float32Array(count);
        this.__particle_height = new Float32Array(count);
        this.__particle_rand = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const t = count > 0 ? i / count : 0;
            const theta = t * TWO_PI;
            const seed0 = (i * 1664525 + 1013904223) >>> 0;
            const seed1 = (seed0 * 1664525 + 1013904223) >>> 0;
            const seed2 = (seed1 * 1664525 + 1013904223) >>> 0;

            const r0 = seed0 / 0xffffffff;
            const r1 = seed1 / 0xffffffff;
            const r2 = seed2 / 0xffffffff;

            this.__particle_theta[i] = theta;
            this.__particle_radial[i] = r0 * 2 - 1;
            this.__particle_height[i] = r1 * 2 - 1;
            this.__particle_rand[i] = r2;

            const offset = i * 3;
            this.__particle_positions[offset] = Math.cos(theta) * this.__particle_ring_radius;
            this.__particle_positions[offset + 1] = 0;
            this.__particle_positions[offset + 2] = Math.sin(theta) * this.__particle_ring_radius;
        }

        this.__particle_positions_attr = new THREE.BufferAttribute(this.__particle_positions, 3);
        this.__particle_theta_attr = new THREE.BufferAttribute(this.__particle_theta, 1);
        this.__particle_radial_attr = new THREE.BufferAttribute(this.__particle_radial, 1);
        this.__particle_height_attr = new THREE.BufferAttribute(this.__particle_height, 1);
        this.__particle_rand_attr = new THREE.BufferAttribute(this.__particle_rand, 1);
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

    private __applyPalette(palette: GodSpherePalette) {
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

        if (this.__uniforms) {
            this.__uniforms.u_palette0.value = colors[0];
            this.__uniforms.u_palette1.value = colors[1];
            this.__uniforms.u_palette2.value = colors[2];
        }
    }

    private __updateAudio(dt: number) {
        const raw = this.__bins_raw;
        const smooth = this.__bins_smoothed;

        if (!raw || !smooth || raw.length === 0) {
            this.__bass *= 0.95;
            this.__mid *= 0.95;
            this.__high *= 0.95;
            this.__audio_level *= 0.95;

            this.__flash = Math.max(0, this.__flash - dt * this.__pulse_decay);

            const decaySilent = Math.pow(this.__particle_burst_decay, dt * 60);
            this.__particle_burst *= decaySilent;
            return;
        }

        const lowEnd = Math.max(1, Math.floor(raw.length * 0.12));
        const midEnd = Math.max(lowEnd + 1, Math.floor(raw.length * 0.46));

        let low = 0;
        let mid = 0;
        let high = 0;

        const attack = 0.34;
        const release = 0.08;

        for (let i = 0; i < raw.length; i++) {
            const target = raw[i] / 255;
            const prev = smooth[i];
            const next = target > prev
                ? prev + (target - prev) * attack
                : prev + (target - prev) * release;

            smooth[i] = next;

            if (i < lowEnd) {
                low += next;
            } else if (i < midEnd) {
                mid += next;
            } else {
                high += next;
            }
        }

        low /= lowEnd;
        mid /= Math.max(1, midEnd - lowEnd);
        high /= Math.max(1, raw.length - midEnd);

        this.__bass = low;
        this.__mid = mid;
        this.__high = high;

        const mixed = low * 0.62 + mid * 0.26 + high * 0.12;
        this.__audio_level = Math.min(1, mixed * (0.85 + this.__audio_strength * 0.3));

        const snareSpike = Math.max(0, mid - this.__mid_trend - 0.02);
        this.__mid_trend += (mid - this.__mid_trend) * 0.22;

        this.__flash = Math.max(0, this.__flash - dt * this.__pulse_decay);
        if (snareSpike > 0) {
            const boosted = Math.min(1, snareSpike * (2.6 + this.__audio_strength));
            if (boosted > this.__flash) this.__flash = boosted;

            const burst = Math.min(1, snareSpike * (3.4 + this.__audio_strength));
            if (burst > this.__particle_burst) this.__particle_burst = burst;
        }

        const burstDecay = Math.pow(this.__particle_burst_decay, dt * 60);
        this.__particle_burst *= burstDecay;
    }

    private __updateLoopState() {
        const loopSeconds = Math.max(0.001, this.__loop_seconds);
        const raw = (this.__time + this.__loop_phase_offset) / loopSeconds;
        const phase = raw - Math.floor(raw);

        this.__phase = phase;
        this.__phase_angle = phase * TWO_PI;

        if (!this.__perfect_loop || this.__loop_ease <= 0) {
            this.__loop_blend = 1;
            return;
        }

        const seamDistance = Math.min(phase, 1 - phase);
        const easeWindow = Math.max(0.0001, Math.min(0.49, this.__loop_ease * 0.5));
        const t = Math.min(1, seamDistance / easeWindow);
        this.__loop_blend = t * t * (3 - 2 * t);
    }

    private __applyScale() {
        if (!this.__sphere_mesh || !this.__halo_mesh) return;

        this.__sphere_mesh.scale.setScalar(this.__radius);
        this.__halo_mesh.scale.setScalar(this.__radius * this.__halo_radius_mul);
    }

    private __reseedParticlePositions() {
        if (!this.__particle_positions || !this.__particle_positions_attr) return;

        const count = this.__particle_count;
        const radius = this.__particle_ring_radius;

        for (let i = 0; i < count; i++) {
            const theta = this.__particle_theta[i];
            const offset = i * 3;
            this.__particle_positions[offset] = Math.cos(theta) * radius;
            this.__particle_positions[offset + 1] = 0;
            this.__particle_positions[offset + 2] = Math.sin(theta) * radius;
        }

        this.__particle_positions_attr.needsUpdate = true;
    }

    private __updateVisuals(dt: number) {
        const looped = this.__perfect_loop;
        const angle = this.__phase_angle;
        const audioBlend = looped ? this.__loop_blend : 1;

        const bassBoost = this.__bass * this.__audio_strength * audioBlend;
        const glow = this.__idle_strength + bassBoost;
        const flash = this.__flash * audioBlend;
        const burst = this.__particle_burst * audioBlend;
        const sphereScale = this.__radius * (1 + bassBoost * 0.22);

        const shaderTime = looped ? this.__phase * this.__loop_seconds : this.__time;
        const coreIntensity = this.__intensity * this.__core_intensity;
        const noiseStrength = this.__core_noise_strength * (this.__siri_mode ? 1 : 0.2);

        this.__uniforms.u_time.value = shaderTime;
        this.__uniforms.u_phase.value = this.__phase;
        this.__uniforms.u_audio_level.value = Math.min(1, glow);
        this.__uniforms.u_flash.value = flash;

        this.__uniforms.u_bass.value = this.__bass;
        this.__uniforms.u_mid.value = this.__mid;
        this.__uniforms.u_high.value = this.__high;
        this.__uniforms.u_burst.value = burst;

        this.__uniforms.u_intensity.value = coreIntensity;
        this.__uniforms.u_core_noise_strength.value = noiseStrength;
        this.__uniforms.u_core_noise_speed.value = this.__core_noise_speed;
        this.__uniforms.u_rim_power.value = this.__rim_power;
        this.__uniforms.u_rim_strength.value = this.__rim_strength;
        this.__uniforms.u_halo_strength.value = this.__halo_strength * (0.6 + bassBoost);
        this.__uniforms.u_siri_mode.value = this.__siri_mode ? 1 : 0;
        this.__uniforms.u_core_radius.value = sphereScale;

        const musicSpeedRaw = 1 + (this.__bass * 0.85 + this.__mid * 0.35 + this.__high * 0.2) * this.__audio_strength * audioBlend;
        const musicSpeedTarget = 1 + (musicSpeedRaw - 1) * 0.5;
        const musicSpeedSmoothing = Math.min(1, dt * 4.0);
        this.__music_speed_boost_smoothed += (musicSpeedTarget - this.__music_speed_boost_smoothed) * musicSpeedSmoothing;
        const musicSpeedBoost = this.__music_speed_boost_smoothed;
        const musicSpeedNorm = Math.max(0, Math.min(1, (musicSpeedBoost - 1) / 0.7));

        this.__uniforms.u_style.value = this.__particle_style_enum;
        this.__uniforms.u_particle_enabled.value = this.__particle_enabled ? 1 : 0;
        this.__uniforms.u_size.value = this.__particle_size * this.__style_size_mul;
        this.__uniforms.u_size_max.value = this.__particle_size_max;
        this.__uniforms.u_glow.value = this.__particle_glow;
        this.__uniforms.u_speed.value = this.__particle_speed * this.__style_speed_mul * musicSpeedBoost;
        this.__uniforms.u_jitter.value = this.__particle_jitter * this.__style_jitter_mul;
        this.__uniforms.u_breathe.value = this.__particle_breathe;
        this.__uniforms.u_ring_radius.value = this.__particle_ring_radius;
        this.__uniforms.u_ring_thickness.value = this.__particle_ring_thickness * this.__style_thickness_mul;
        this.__uniforms.u_streak_len.value = this.__particle_streak_len * this.__style_streak_mul;
        this.__uniforms.u_particle_burst_strength.value = this.__particle_burst_strength * this.__style_burst_mul;
        this.__uniforms.u_music_speed.value = musicSpeedNorm;

        this.__sphere_mesh.scale.setScalar(sphereScale);
        const isNopMode = this.__particle_style === 'nop';
        const sphereSpinBase = isNopMode ? (0.9 + this.__particle_speed * 0.55) : (0.45 + this.__particle_speed * 0.35);
        const sphereSpinRate = sphereSpinBase * (isNopMode ? Math.max(0.9, musicSpeedBoost) : musicSpeedBoost);
        this.__sphere_spin_phase -= dt * sphereSpinRate;
        if (this.__sphere_spin_phase < -TWO_PI) this.__sphere_spin_phase += TWO_PI;
        this.__sphere_mesh.rotation.y = this.__sphere_spin_phase;
        this.__sphere_mesh.rotation.x = 0.05 * Math.sin(this.__sphere_spin_phase * 0.75);
        this.__sphere_mesh.rotation.z = 0.04 * Math.cos(this.__sphere_spin_phase * 0.55);

        const haloScale = this.__radius * this.__halo_radius_mul * (1 + bassBoost * 0.14);
        this.__halo_mesh.scale.setScalar(haloScale);
        this.__halo_mesh.visible = this.__halo_strength > 0;

        if (looped) {
            this.__halo_mesh.rotation.x = 0.08 * Math.sin(angle * 2);
            this.__halo_mesh.rotation.z = 0.05 * Math.cos(angle * 3);
        } else {
            this.__halo_mesh.rotation.x = 0.08 * Math.sin(this.__time * 1.8);
            this.__halo_mesh.rotation.z = 0.05 * Math.cos(this.__time * 2.3);
        }

        this.__particle_points.visible = this.__particle_enabled && this.__particle_count > 0;

        const group = this._threeSync as THREE.Group | null;
        if (group) {
            if (looped) {
                group.rotation.x = this.__rotation_speed.x * (0.7 * Math.sin(angle) + 0.3 * Math.sin(angle * 2));
                group.rotation.y = this.__rotation_speed.y * (0.7 * Math.cos(angle) + 0.25 * Math.sin(angle * 3));
                group.rotation.z = this.__rotation_speed.z * (0.8 * Math.sin(angle * 2) + 0.2 * Math.cos(angle * 3));
            } else {
                group.rotation.x = this.__rotation_speed.x * Math.sin(this.__time * 0.6);
                group.rotation.y = this.__rotation_speed.y * Math.cos(this.__time * 0.45);
                group.rotation.z = this.__rotation_speed.z * Math.sin(this.__time * 0.8);
            }
        }
    }

    private __normalizeStyle(style: GodSphereParticleStyle | string): GodSphereParticleStyle {
        if (style === 'ring' || style === 'streak' || style === 'sand' || style === 'full-moon' || style === 'atom' || style === 'nop') return style;
        return 'dust';
    }

    private __styleToEnum(style: GodSphereParticleStyle): number {
        if (style === 'ring') return 0;
        if (style === 'streak') return 2;
        if (style === 'sand') return 3;
        if (style === 'full-moon') return 4;
        if (style === 'atom') return 5;
        if (style === 'nop') return 6;
        return 1;
    }

    private __applyStyleProfile(style: GodSphereParticleStyle) {
        if (style === 'ring') {
            this.__style_speed_mul = 0.75;
            this.__style_jitter_mul = 0.45;
            this.__style_thickness_mul = 0.40;
            this.__style_size_mul = 0.75;
            this.__style_streak_mul = 0.65;
            this.__style_burst_mul = 0.45;
            return;
        }

        if (style === 'streak') {
            this.__style_speed_mul = 1.075;
            this.__style_jitter_mul = 0.70;
            this.__style_thickness_mul = 0.55;
            this.__style_size_mul = 1.35;
            this.__style_streak_mul = 2.2;
            this.__style_burst_mul = 0.85;
            return;
        }

        if (style === 'sand') {
            this.__style_speed_mul = 1.2;
            this.__style_jitter_mul = 1.45;
            this.__style_thickness_mul = 1.45;
            this.__style_size_mul = 1.0;
            this.__style_streak_mul = 0.95;
            this.__style_burst_mul = 1.1;
            return;
        }

        if (style === 'full-moon') {
            this.__style_speed_mul = 0.95;
            this.__style_jitter_mul = 0.65;
            this.__style_thickness_mul = 2.8;
            this.__style_size_mul = 0.9;
            this.__style_streak_mul = 0.8;
            this.__style_burst_mul = 0.55;
            return;
        }

        if (style === 'atom') {
            this.__style_speed_mul = 1.1;
            this.__style_jitter_mul = 0.9;
            this.__style_thickness_mul = 1.35;
            this.__style_size_mul = 0.95;
            this.__style_streak_mul = 0.9;
            this.__style_burst_mul = 0.75;
            return;
        }

        if (style === 'nop') {
            this.__style_speed_mul = 1.0;
            this.__style_jitter_mul = 1.0;
            this.__style_thickness_mul = 1.0;
            this.__style_size_mul = 1.0;
            this.__style_streak_mul = 1.0;
            this.__style_burst_mul = 1.0;
            return;
        }

        this.__style_speed_mul = 1.0;
        this.__style_jitter_mul = 1.2;
        this.__style_thickness_mul = 2.0;
        this.__style_size_mul = 1.0;
        this.__style_streak_mul = 0.85;
        this.__style_burst_mul = 0.8;
    }
}

export default GodSphere;
