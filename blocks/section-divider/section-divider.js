/**
 * Section Divider Block
 * Renders a horizontal line with the Vitamix vortex mark centered.
 */
export default function decorate(block) {
  const vortexSVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5C50 5 85 25 85 50C85 75 50 95 50 95C50 95 15 75 15 50C15 25 50 5 50 5Z"/>
    <path d="M50 15C50 15 75 30 75 50C75 70 50 85 50 85C50 85 25 70 25 50C25 30 50 15 50 15Z" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/>
  </svg>`;

  block.innerHTML = `
    <div class="divider-line"></div>
    <div class="vortex-mark">${vortexSVG}</div>
    <div class="divider-line"></div>
  `;
}
