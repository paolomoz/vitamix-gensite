/**
 * Recipe Hero Block
 *
 * A text-focused hero for recipe listing/collection pages.
 * Displays title, subtitle, and optional prep/cook time stats.
 *
 * == Expected HTML Structure ==
 * <div class="recipe-hero [variant]">
 *   <div class="hero-content">
 *     <h1 class="hero-title">Title</h1>
 *     <p class="hero-subtitle">Subtitle text</p>
 *     <ul class="hero-stats">
 *       <li>Prep: 5 minutes</li>
 *       <li>Cook: 10 minutes</li>
 *     </ul>
 *   </div>
 * </div>
 *
 * Or simpler generated format:
 * <div class="recipe-hero">
 *   <div>
 *     <div>
 *       <h1>Title</h1>
 *       <p>Subtitle</p>
 *       <ul><li>Prep: 5 min</li></ul>
 *     </div>
 *   </div>
 * </div>
 */

export default function decorate(block) {
  // Find or create hero-content wrapper
  let heroContent = block.querySelector('.hero-content');

  if (!heroContent) {
    // Handle generated structure - find the content div
    const contentDiv = block.querySelector('div > div');
    if (contentDiv) {
      contentDiv.classList.add('hero-content');
      heroContent = contentDiv;
    }
  }

  if (!heroContent) return;

  // Style the title
  const h1 = heroContent.querySelector('h1');
  if (h1 && !h1.classList.contains('hero-title')) {
    h1.classList.add('hero-title');
  }

  // Style the subtitle (first p after h1)
  const subtitle = heroContent.querySelector('h1 + p, p.hero-subtitle');
  if (subtitle && !subtitle.classList.contains('hero-subtitle')) {
    subtitle.classList.add('hero-subtitle');
  }

  // Style the stats list
  const statsList = heroContent.querySelector('ul');
  if (statsList && !statsList.classList.contains('hero-stats')) {
    statsList.classList.add('hero-stats');
  }
}
