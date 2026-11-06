// 導入（components/Intro.tsx）を出すかを、描く前に決める小さなスクリプト。
// 出すときは html[data-intro] を立て、CSS でサイトを黒く覆う（読み込み直後にサイトが一瞬見えるのを防ぐ）。
// 出さない：?capture、2 回目以降（sessionStorage）、動きを減らす設定。?intro=1 で必ず出す（確認用）。
// 万一 Intro が動かなくても、22 秒で覆いを外す（導入は約 11.6 秒＋読み込み）。
export const INTRO_GATE = "(function(){try{var q=location.search;if(/[?&]capture/.test(q)&&!/[?&]intro=1/.test(q))return;var f=/[?&]intro=1/.test(q);if(!f&&(sessionStorage.getItem('yk-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches))return;var d=document.documentElement;d.setAttribute('data-intro','1');if(!f)setTimeout(function(){d.removeAttribute('data-intro')},22000)}catch(e){}})();";
