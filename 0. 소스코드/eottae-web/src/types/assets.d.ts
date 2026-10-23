// 순수 CSS 부수 효과 import(`import './globals.css'`)에 대한 앰비언트 선언.
// Next.js 내장 선언은 `*.module.css`만 커버하므로 일반 CSS는 여기서 선언한다.
// CSS Module과 동일한 형태로 선언해 패턴 겹침 시에도 타입 동작이 달라지지 않게 한다.
declare module '*.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
