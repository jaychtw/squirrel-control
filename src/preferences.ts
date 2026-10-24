import type { Language } from './i18n';
export type Preferences={language:Language;motion:boolean;sound:boolean;largeText:boolean};
export function loadPreferences(storage:Pick<Storage,'getItem'>,reducedMotion:boolean):Preferences {
  const result:Preferences={language:'en',motion:!reducedMotion,sound:false,largeText:false};
  try {
    const saved:unknown=JSON.parse(storage.getItem('squirrel-preferences')||'{}');
    if(!saved||typeof saved!=='object'||Array.isArray(saved))return result;
    const value=saved as Record<string,unknown>;
    if(value.language==='en'||value.language==='zh-TW')result.language=value.language;
    if(typeof value.motion==='boolean')result.motion=value.motion&&!reducedMotion;
    if(typeof value.sound==='boolean')result.sound=value.sound;
    if(typeof value.largeText==='boolean')result.largeText=value.largeText;
  }catch{/* Storage is optional, including its getter. */}
  return result;
}
export function savePreferences(storage:Pick<Storage,'setItem'>,prefs:Preferences):void {
  try{storage.setItem('squirrel-preferences',JSON.stringify(prefs));}catch{/* Session settings still work. */}
}
