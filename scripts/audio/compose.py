"""Original deterministic arcade scores, rendered as PCM then encoded to Ogg/Vorbis.
No external recordings, melodies or samples. Requires numpy and ffmpeg.
"""
import numpy as np, wave, subprocess, pathlib
rate=24000; duration=48; n=rate*duration
out=pathlib.Path('public/assets/audio'); out.mkdir(parents=True,exist_ok=True)
profiles={
 'flappy-files': (82, [50,53,57,60], .65),
 'against-the-wall': (64,[45,48,52,55],.3),
 'rio-rescue': (76,[50,53,57,62],.45),
 'supply-the-people': (96,[48,52,55,59],.75),
 'trickle-down-tycoon': (88,[43,46,50,53],.6),
}
for index,(name,(bpm,chord,drive)) in enumerate(profiles.items()):
 rng=np.random.default_rng(800+index); mix=np.zeros((n,2),dtype=np.float64)
 def add(sound,start,pan=0,gain=1):
  at=int(start*rate)
  if at>=n:return
  count=min(len(sound),n-at)
  mix[at:at+count,0]+=sound[:count]*gain*np.sqrt((1-pan)/2)
  mix[at:at+count,1]+=sound[:count]*gain*np.sqrt((1+pan)/2)
 def note(midi,length,kind):
  t=np.arange(int(length*rate))/rate; f=440*2**((midi-69)/12)
  if kind=='pad':
   env=np.minimum(1,t/1.7)*np.minimum(1,(length-t)/2.4)
   a=sum(np.sin(2*np.pi*(f*(1+d))*t+p)*(.22 if h==1 else .05) for h,d,p in [(1,-.002,0),(1,.002,.4),(2,1.001,.3)])
   return a*env*(.82+.18*np.sin(t*1.2))
  if kind=='pluck':
   return sum(np.sin(2*np.pi*f*h*t)*np.exp(-t*(1.5+h*.5))/h**1.7 for h in range(1,7))*np.minimum(1,t/.008)*.34
  return np.sin(2*np.pi*f*t)*np.exp(-t*4)*np.minimum(1,t/.006)*.4
 # Broad evolving string-like pad with individually detuned partials.
 for bar in range(6):
  shift=[0,-2,-5,-2,0,5][bar]; start=bar*8
  for j,midi in enumerate(chord): add(note(midi+shift,10,'pad'),start,(j-1.5)/3,.21)
 # Soft plucked strings and bass, restrained enough to hear game cues.
 beat=60/bpm
 for i,start in enumerate(np.arange(0,duration,beat)):
  bar=int(start//8); shift=[0,-2,-5,-2,0,5][bar]
  if i%2==0: add(note(chord[0]-12+shift,.9,'bass'),start,0,.28*drive)
  if i%2 or index in [0,3]: add(note(chord[(i*3+bar)%4]+12+shift,2.7,'pluck'),start,(-.3 if i%2 else .3),.22)
  if i%2==0:
   t=np.arange(int(.26*rate))/rate
   drum=np.sin(2*np.pi*(48*t+35*(1-np.exp(-t*25))/25))*np.exp(-t*20)
   add(drum,start,0,.13*drive)
  if i%4==2:
   t=np.arange(int(.13*rate))/rate; noise=rng.normal(0,1,len(t)); smooth=np.convolve(noise,np.ones(5)/5,'same')
   add(smooth*np.exp(-t*38),start,.12,.09*drive)
 # Room tail/diffusion: quiet stereo delays make the score less dry and synthetic.
 for delay,gain in [(.113,.10),(.241,.07),(.397,.04)]:
  d=int(delay*rate); mix[d:]+=mix[:-d,::-1]*gain
 # Fade both loop boundaries to silence to avoid clicks.
 fade=np.minimum(1,np.arange(n)/(rate*1.8))*np.minimum(1,np.arange(n)[::-1]/(rate*2))
 mix*=fade[:,None]; peak=np.max(np.abs(mix)); mix*=.58/max(peak,.01)
 path=out/(name+'.wav')
 with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate);w.writeframes((np.clip(mix,-1,1)*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(path),'-c:a','libvorbis','-q:a','4',str(out/(name+'.ogg'))],check=True)
 path.unlink()
 print(name,'peak',round(float(np.max(np.abs(mix))),3),'RMS',round(float(np.sqrt(np.mean(mix**2))),3))
