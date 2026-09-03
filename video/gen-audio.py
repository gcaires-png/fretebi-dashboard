"""Trilha ambiente do vídeo: pad de acordes (um por cena) sintetizado no ffmpeg (aevalsrc).
Uso: python3 gen-audio.py [caminho-do-ffmpeg]  -> gera audio.wav (106,5 s, estéreo, 44,1 kHz)."""
import subprocess, sys
FF = sys.argv[1] if len(sys.argv) > 1 else 'ffmpeg'
D3, F3, A3, D4, E4 = 146.83, 174.61, 220.0, 293.66, 329.63
Bb2, Bb3, C3, C4, E3, G3, G2, F2, A2 = 116.54, 233.08, 130.81, 261.63, 164.81, 196.0, 98.0, 87.31, 110.0
# (início, fim, notas do acorde) — alinhado às cenas do videl-apresentacao.html
scenes = [(0, 8, [D3, F3, A3, D4]), (8, 20, [Bb2, D3, F3, Bb3]), (20, 33, [F2, A2, C3, F3]), (33, 44, [C3, E3, G3, C4]),
          (44, 49, [D3, F3, A3, E4]), (49, 63, [G2, Bb2, D3, G3]), (63, 78, [Bb2, D3, F3, A3]), (78, 88, [A2, C3, F3, A3]),
          (88, 97, [C3, E3, G3, C4]), (97, 106.5, [D3, A3, D4, F3])]
XF = 1.6  # crossfade entre acordes (s)
terms = []
for s, e, fs in scenes:
    env = f"min(1,max(0,(t-{s-XF/2:.2f})/{XF}))*min(1,max(0,({e+XF/2:.2f}-t)/{XF}))"
    voice = []
    for f in fs:
        for det in (0.9985, 1.0015):  # dois osciladores levemente desafinados = pad
            voice.append(f"sin(2*PI*{f*det:.3f}*t)")
        voice.append(f"0.28*sin(2*PI*{2*f:.3f}*t)")
        voice.append(f"0.08*sin(2*PI*{3*f:.3f}*t)")
    sub = f"0.9*sin(2*PI*{fs[0]/2:.3f}*t)"
    terms.append(f"({env})*(({'+'.join(voice)})+{sub})")
lfo = "(1+0.12*sin(2*PI*0.11*t))*(1+0.05*sin(2*PI*0.37*t+1))"
expr = f"0.045*{lfo}*(" + "+".join(terms) + ")"
expr = f"min(1,t/3)*min(1,max(0,(106.5-t)/3))*({expr})"
cmd = [FF, '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', f"aevalsrc='{expr}':s=44100:d=106.5",
       '-af', 'lowpass=f=1500,aecho=0.7:0.5:90|180:0.25|0.15,highpass=f=40,alimiter=limit=0.6',
       '-ac', '2', 'audio.wav']
subprocess.run(cmd, check=True)
print('audio.wav gerado')
