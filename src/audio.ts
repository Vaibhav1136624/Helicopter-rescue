export class Sound {
    ctx: AudioContext | null = null;
    master: GainNode | null = null;
    rotor: OscillatorNode | null = null;
    rotorGain: GainNode | null = null;
    wind: GainNode | null = null;
    muted = false;
    start() { if (this.ctx) {
        void this.ctx.resume();
        return;
    } this.ctx = new AudioContext(); this.master = this.ctx.createGain(); this.master.gain.value = .25; this.master.connect(this.ctx.destination); this.rotor = this.ctx.createOscillator(); this.rotor.type = 'sawtooth'; this.rotorGain = this.ctx.createGain(); this.rotorGain.gain.value = .035; const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 150; this.rotor.connect(filter); filter.connect(this.rotorGain); this.rotorGain.connect(this.master); this.rotor.start(); const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate); const data = buffer.getChannelData(0); for (let i = 0; i < data.length; i++)
        data[i] = Math.random() * 2 - 1; const noise = this.ctx.createBufferSource(); noise.buffer = buffer; noise.loop = true; const low = this.ctx.createBiquadFilter(); low.frequency.value = 600; this.wind = this.ctx.createGain(); this.wind.gain.value = .015; noise.connect(low); low.connect(this.wind); this.wind.connect(this.master); noise.start(); }
    update(thrust: number, storm: boolean, active: boolean) { if (!this.ctx || !this.master || !this.rotor || !this.rotorGain || !this.wind)
        return; this.master.gain.setTargetAtTime(this.muted ? 0 : .25, this.ctx.currentTime, .1); this.rotor.frequency.setTargetAtTime(27 + thrust * 15, this.ctx.currentTime, .2); this.rotorGain.gain.setTargetAtTime(active ? .04 : 0, this.ctx.currentTime, .2); this.wind.gain.setTargetAtTime(active ? (storm ? .08 : .015) : 0, this.ctx.currentTime, .2); }
    tone(type: string) { if (!this.ctx || !this.master)
        return; const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = type === 'damage' ? 'sawtooth' : 'sine'; const now = this.ctx.currentTime; const freq = type === 'delivery' ? 660 : type === 'pickup' ? 440 : 80; o.frequency.setValueAtTime(freq, now); o.frequency.exponentialRampToValueAtTime(type === 'damage' ? 25 : freq * 1.5, now + .16); g.gain.setValueAtTime(.12, now); g.gain.exponentialRampToValueAtTime(.001, now + .25); o.connect(g); g.connect(this.master); o.start(); o.stop(now + .3); }
}
