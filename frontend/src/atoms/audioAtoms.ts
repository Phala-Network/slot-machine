import { atom } from 'jotai';
import { Howl } from 'howler';

// 音频实例的类型定义
interface AudioInstance {
  // bgm: Howl | null;
  sfx: {
    win: Howl | null;
    lever: Howl | null;
    clicker: Howl | null,
  };
}

// 音频操作的动作类型
type AudioAction = 
  // | { type: 'PLAY_BGM' }
  // | { type: 'STOP_BGM' }
  | { type: 'PLAY_SFX', sfxType: 'clicker' | 'win' | 'lever' }
  // | { type: 'SET_BGM_VOLUME', volume: number }
  | { type: 'INIT_AUDIO' };

// 初始化音频实例的atom
export const audioInstanceAtom = atom<AudioInstance>({
  // bgm: null,
  sfx: {
    win: null,
    lever: null,
    clicker: null,
  }
})

// 处理音频动作的atom
export const audioActionAtom = atom(
  null,
  async (get, set, action: AudioAction) => {
    const audioInstance = get(audioInstanceAtom);

    switch (action.type) {
      case 'INIT_AUDIO':
        // @ts-ignore
        const resource_path = await window.ipcRenderer.getResourcePath() as string
        const newInstance: AudioInstance = {
          // bgm: new Howl({
          //   src: ['/sounds/background.mp3'],
          //   loop: true,
          //   volume: 0.5
          // }),
          sfx: {
            win: new Howl({
              src: [`${resource_path}sounds/win.wav`],
              volume: 0.8
            }),
            lever: new Howl({
              src: [`${resource_path}sounds/lever.mp3`],
              volume: 0.8
            }),
            clicker: new Howl({
              src: [`${resource_path}sounds/clicker.mp3`],
              volume: 0.8
            }),
          }
        };
        set(audioInstanceAtom, newInstance);
        break;

      // case 'PLAY_BGM':
      //   if (audioInstance.bgm) {
      //     audioInstance.bgm.play();
      //   }
      //   break;

      // case 'STOP_BGM':
      //   if (audioInstance.bgm) {
      //     audioInstance.bgm.stop();
      //   }
      //   break;

      case 'PLAY_SFX':
        const sfx = audioInstance.sfx[action.sfxType];
        if (sfx) {
          // 播放音效的同时不中断背景音乐
          sfx.play();
        }
        break;

      // case 'SET_BGM_VOLUME':
      //   if (audioInstance.bgm) {
      //     audioInstance.bgm.volume(action.volume);
      //   }
      //   break;
    }
  }
);

audioActionAtom.onMount = (set) => {
  set({ type: 'INIT_AUDIO' })
  // set({ type: 'PLAY_BGM' })
}
