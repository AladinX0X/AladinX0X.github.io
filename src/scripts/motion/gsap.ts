// GSAP einmal registrieren und gemeinsam nutzen. Kurve "ein" = CSS-Token --kurve-ein (src/styles/tokens.css).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create('ein', '0.22,1,0.36,1');

/** Große Bildschirme mit Maus: hier (und nur hier) gibt es Pins. */
export const GROSS = '(min-width: 62rem) and (hover: hover) and (pointer: fine)';
export const KLEIN = '(max-width: 61.99rem), (hover: none), (pointer: coarse)';
export { gsap, ScrollTrigger };
