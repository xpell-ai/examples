import * as THREE from "three";
import { X3DObject, type IX3DObjectData } from "@xpell/3d";

type StarColor = number | string;

export interface ISceneStarsData extends IX3DObjectData {
    _count?: number;
    _radius_min?: number;
    _radius_max?: number;
    _size?: number;
    _opacity?: number;
    _color?: StarColor;
    _rotation_speed?: number;
    _sparkle_strength?: number;
    _sparkle_speed?: number;
}

const TWO_PI = Math.PI * 2;

export class SceneStars extends X3DObject {
    static _xtype = "scene-stars";

    private __count = 1400;
    private __radius_min = 9;
    private __radius_max = 22;
    private __size = 0.06;
    private __opacity = 0.72;
    private __color: StarColor = "#8fd3ff";
    private __rotation_speed = 0.035;
    private __sparkle_strength = 0.52;
    private __sparkle_speed = 0.9;

    private __seed = 1337;

    private __geometry!: THREE.BufferGeometry;
    private __material!: THREE.PointsMaterial;

    private __positions!: Float32Array;
    private __colors!: Float32Array;
    private __base_colors!: Float32Array;
    private __sparkle_phase!: Float32Array;
    private __sparkle_rate!: Float32Array;

    private __positions_attr!: THREE.BufferAttribute;
    private __colors_attr!: THREE.BufferAttribute;

    private __tmp_color_base = new THREE.Color();
    private __tmp_color_white = new THREE.Color(1, 1, 1);
    private __tmp_color_mix = new THREE.Color();

    private __frame_clock = new THREE.Clock();

    declare _threes_class_args: any;

    constructor(data: ISceneStarsData, defaults: ISceneStarsData = { _type: SceneStars._xtype }) {
        super(data, defaults, true);
        this.parse(data);

        this._three_class = THREE.Points;

        this.__buildParticleData();
        this.__geometry = new THREE.BufferGeometry();
        this.__geometry.setAttribute("position", this.__positions_attr);
        this.__geometry.setAttribute("color", this.__colors_attr);

        this.__material = new THREE.PointsMaterial({
            size: this.__size,
            opacity: this.__opacity,
            transparent: true,
            depthWrite: false,
            vertexColors: true,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
        });

        this._threes_class_args = [this.__geometry, this.__material];
    }

    get _count() {
        return this.__count;
    }

    set _count(v: number) {
        this._set_count(v);
    }

    get _radius_min() {
        return this.__radius_min;
    }

    set _radius_min(v: number) {
        this._set_radius_min(v);
    }

    get _radius_max() {
        return this.__radius_max;
    }

    set _radius_max(v: number) {
        this._set_radius_max(v);
    }

    get _size() {
        return this.__size;
    }

    set _size(v: number) {
        this._set_size(v);
    }

    get _opacity() {
        return this.__opacity;
    }

    set _opacity(v: number) {
        this._set_opacity(v);
    }

    get _color() {
        return this.__color;
    }

    set _color(v: StarColor) {
        this._set_color(v);
    }

    get _rotation_speed() {
        return this.__rotation_speed;
    }

    set _rotation_speed(v: number) {
        this._set_rotation_speed(v);
    }

    get _sparkle_strength() {
        return this.__sparkle_strength;
    }

    set _sparkle_strength(v: number) {
        this._set_sparkle_strength(v);
    }

    get _sparkle_speed() {
        return this.__sparkle_speed;
    }

    set _sparkle_speed(v: number) {
        this._set_sparkle_speed(v);
    }

    _set_count(v: number) {
        const next = Math.max(16, Math.min(10000, Math.floor(v)));
        if (next === this.__count) return;
        this.__count = next;
        this.__rebuildGeometry();
    }

    _set_radius_min(v: number) {
        const next = Math.max(0.5, v);
        if (next === this.__radius_min) return;
        this.__radius_min = next;
        if (this.__radius_min > this.__radius_max) this.__radius_max = this.__radius_min;
        this.__rebuildGeometry();
    }

    _set_radius_max(v: number) {
        const next = Math.max(this.__radius_min, v);
        if (next === this.__radius_max) return;
        this.__radius_max = next;
        this.__rebuildGeometry();
    }

    _set_size(v: number) {
        this.__size = Math.max(0.001, v);
        if (this.__material) this.__material.size = this.__size;
    }

    _set_opacity(v: number) {
        this.__opacity = Math.max(0, Math.min(1, v));
        if (this.__material) this.__material.opacity = this.__opacity;
    }

    _set_color(v: StarColor) {
        this.__color = v;
        this.__rebuildColorsOnly();
    }

    _set_rotation_speed(v: number) {
        this.__rotation_speed = Number.isFinite(v) ? v : 0;
    }

    _set_sparkle_strength(v: number) {
        this.__sparkle_strength = Math.max(0, Math.min(1.5, v));
    }

    _set_sparkle_speed(v: number) {
        this.__sparkle_speed = Math.max(0, v);
    }

    async onFrame(frameNumber: number): Promise<void> {
        const points = this._threeSync as THREE.Points | null;
        const dt = this.__frame_clock.getDelta();

        if (points && this.__rotation_speed !== 0) {
            points.rotation.y += this.__rotation_speed * dt;
        }

        if (this.__sparkle_strength > 0) {
            this.__updateSparkleColors(frameNumber * 0.0166666667 * this.__sparkle_speed);
        }

        await super.onFrame(frameNumber);
    }

    private __rebuildGeometry() {
        if (!this.__geometry) return;

        this.__buildParticleData();

        this.__geometry.dispose();
        this.__geometry = new THREE.BufferGeometry();
        this.__geometry.setAttribute("position", this.__positions_attr);
        this.__geometry.setAttribute("color", this.__colors_attr);

        const points = this._threeSync as THREE.Points | null;
        if (points) points.geometry = this.__geometry;
    }

    private __rebuildColorsOnly() {
        if (!this.__colors_attr || !this.__base_colors) return;

        this.__tmp_color_base.set(this.__color as any);
        for (let i = 0; i < this.__count; i++) {
            const tone = this.__hash01(i, 4);
            const brightness = 0.45 + this.__hash01(i, 5) * 0.55;
            this.__tmp_color_mix.lerpColors(this.__tmp_color_base, this.__tmp_color_white, tone * 0.7);
            this.__tmp_color_mix.multiplyScalar(brightness);

            const offset = i * 3;
            this.__base_colors[offset] = this.__tmp_color_mix.r;
            this.__base_colors[offset + 1] = this.__tmp_color_mix.g;
            this.__base_colors[offset + 2] = this.__tmp_color_mix.b;
        }

        this.__updateSparkleColors(0);
    }

    private __buildParticleData() {
        const count = this.__count;
        this.__positions = new Float32Array(count * 3);
        this.__colors = new Float32Array(count * 3);
        this.__base_colors = new Float32Array(count * 3);
        this.__sparkle_phase = new Float32Array(count);
        this.__sparkle_rate = new Float32Array(count);

        this.__tmp_color_base.set(this.__color as any);

        for (let i = 0; i < count; i++) {
            const r0 = this.__hash01(i, 0);
            const r1 = this.__hash01(i, 1);
            const r2 = this.__hash01(i, 2);
            const r3 = this.__hash01(i, 3);

            const theta = TWO_PI * r0;
            const cosPhi = r1 * 2 - 1;
            const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));
            const radius = this.__radius_min + (this.__radius_max - this.__radius_min) * (0.25 + r2 * 0.75);

            const x = Math.cos(theta) * sinPhi * radius;
            const y = cosPhi * radius;
            const z = Math.sin(theta) * sinPhi * radius;

            const offset = i * 3;
            this.__positions[offset] = x;
            this.__positions[offset + 1] = y;
            this.__positions[offset + 2] = z;

            const brightness = 0.45 + r2 * 0.55;
            this.__tmp_color_mix.lerpColors(this.__tmp_color_base, this.__tmp_color_white, r3 * 0.7);
            this.__tmp_color_mix.multiplyScalar(brightness);

            this.__base_colors[offset] = this.__tmp_color_mix.r;
            this.__base_colors[offset + 1] = this.__tmp_color_mix.g;
            this.__base_colors[offset + 2] = this.__tmp_color_mix.b;

            this.__sparkle_phase[i] = TWO_PI * this.__hash01(i, 6);
            this.__sparkle_rate[i] = 0.55 + this.__hash01(i, 7) * 2.1;
        }

        this.__updateSparkleColors(0);

        this.__positions_attr = new THREE.BufferAttribute(this.__positions, 3);
        this.__colors_attr = new THREE.BufferAttribute(this.__colors, 3);
    }

    private __updateSparkleColors(timeSeconds: number) {
        if (!this.__colors_attr || !this.__colors || !this.__base_colors) return;

        const strength = this.__sparkle_strength;
        if (strength <= 0) {
            this.__colors.set(this.__base_colors);
            this.__colors_attr.needsUpdate = true;
            return;
        }

        for (let i = 0; i < this.__count; i++) {
            const phase = this.__sparkle_phase[i];
            const rate = this.__sparkle_rate[i];
            const wave = 0.5 + 0.5 * Math.sin(timeSeconds * rate + phase);
            const sharp = wave * wave;
            const twinkle = 0.68 + (0.32 + sharp * 0.9) * strength;

            const offset = i * 3;
            this.__colors[offset] = this.__base_colors[offset] * twinkle;
            this.__colors[offset + 1] = this.__base_colors[offset + 1] * twinkle;
            this.__colors[offset + 2] = this.__base_colors[offset + 2] * twinkle;
        }

        this.__colors_attr.needsUpdate = true;
    }

    private __hash01(i: number, salt: number) {
        let x = (Math.imul(i + 1, 1664525) + Math.imul(salt + 1, 1013904223) + this.__seed) >>> 0;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        return (x >>> 0) / 0xffffffff;
    }
}

export default SceneStars;
