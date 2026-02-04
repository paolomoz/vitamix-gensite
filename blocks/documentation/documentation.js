const IMG_BASE = '/blocks/documentation';

function renderHeader() {
  return `
    <div class="doc-header" role="banner">
      <div class="doc-header-inner">
        <p class="doc-label">Technical Documentation</p>
        <h1>Generative Websites</h1>
        <div class="doc-rule"></div>
        <p class="doc-subtitle">1:1 Personalization at Web Scale</p>
        <p class="doc-meta">Vitamix POC &mdash; AEM Edge Delivery Services</p>
      </div>
    </div>
    <div class="doc-hero-image">
      <img src="${IMG_BASE}/doc-hero.jpg" alt="A premium blender on a modern kitchen countertop with fresh ingredients, bathed in warm morning light" loading="eager">
    </div>`;
}

function renderNav() {
  const sections = [
    { id: 'what', num: '01', text: 'What They Are' },
    { id: 'why-now', num: '02', text: 'Why Now' },
    { id: 'value', num: '03', text: 'Value' },
    { id: 'how', num: '04', text: 'How It Works' },
    { id: 'usecases', num: '05', text: 'Use Cases' },
  ];

  return `
    <nav class="doc-nav" id="doc-nav">
      <div class="doc-nav-inner">
        ${sections.map((s, i) => `
          <a href="#${s.id}" class="doc-nav-item${i === 0 ? ' active' : ''}" data-section="${s.id}">
            <span class="doc-nav-num">${s.num}</span>
            <span class="doc-nav-text">${s.text}</span>
          </a>
        `).join('')}
      </div>
    </nav>`;
}

function renderSection1() {
  return `
    <section class="doc-section" id="what">
      <span class="doc-section-num">01</span>
      <h2>What Are Generative Websites?</h2>

      <h3>The Concept</h3>
      <div class="doc-prose">
        <p>Generative Websites are a new category of web experience where pages are not pre-authored for a generic audience but are composed in real time by AI models for each individual visitor. Text, images, layout, and recommendations adjust dynamically based on what the system knows about the person viewing the page.</p>
        <p>This is fundamentally different from traditional personalization, which swaps pre-built content blocks between audience segments. Generative Websites produce page elements that <strong>didn't exist until the moment they were needed</strong>. A product comparison page for a parent of four highlights capacity, noise level, and ease of cleaning. The same page, for a fitness enthusiast, emphasizes nutrient preservation and single-serve capability. Neither version was authored in advance.</p>
      </div>

      <div class="doc-image">
        <img src="${IMG_BASE}/doc-personalization.jpg" alt="Three laptops displaying different versions of the same product page, each personalized for a different visitor" loading="lazy">
        <div class="doc-image-caption">Same product, three visitors &mdash; each sees a page composed for their context.</div>
      </div>

      <div class="doc-pullquote">
        <p>Every visitor sees the same <em>intent</em> of a page, but the <em>expression</em> of that intent adapts to make it maximally helpful for that specific person.</p>
      </div>

      <h3>Not a Chatbot. A Website.</h3>
      <div class="doc-prose">
        <p>Generative Websites preserve the browse experience&mdash;navigation, links, images, editorial structure&mdash;that visitors expect from websites. This distinguishes them from Brand Concierge or chatbot experiences, which serve a conversational &ldquo;search&rdquo; mindset.</p>
        <p>The distinction mirrors how people naturally behave. Sometimes you want to ask a question and get an answer. Sometimes you want to wander and discover. Generative Websites make wandering more productive by ensuring every page has already been tuned to what you&rsquo;ve revealed through your journey.</p>
        <p>The two approaches are complementary. A visitor might begin browsing a Generative Website, and as context accumulates, the system can surface an invitation to shift into a conversational Concierge experience for deeper guidance&mdash;or vice versa.</p>
      </div>

      <h3>Where in the Website Architecture</h3>
      <div class="doc-prose">
        <p>Within the 2026 Website Archetype framework, brand websites serve five page types. Generative Websites are most valuable on <strong>Persuasive Pages</strong>&mdash;product detail pages, comparison pages, and anywhere recommendations are presented:</p>
      </div>

      <div class="doc-table-wrap">
        <table class="doc-table">
          <thead>
            <tr><th>Page Type</th><th>Purpose</th><th>Generative Fit</th></tr>
          </thead>
          <tbody>
            <tr><td>Topic Pages</td><td>Informational content for search citations</td><td>Low&mdash;factual, stable content</td></tr>
            <tr class="highlight"><td>Persuasive Pages</td><td>PDPs, comparisons, recommendations</td><td>Primary target&mdash;high commercial intent<span class="table-tag">Primary Target</span></td></tr>
            <tr class="highlight"><td>Generative Pages</td><td>AI-composed pages and conversational experiences</td><td>Core capability<span class="table-tag">Core</span></td></tr>
            <tr><td>Actions</td><td>Transactional: checkout, forms</td><td>Low&mdash;structured workflows</td></tr>
            <tr><td>Demand Pages</td><td>Campaign landing pages</td><td>Medium&mdash;personalized by entry context</td></tr>
          </tbody>
        </table>
      </div>
    </section>`;
}

function renderSection2() {
  return `
    <section class="doc-section" id="why-now">
      <span class="doc-section-num">02</span>
      <h2>Why 1:1 Personalization Is Now Possible</h2>

      <h3>The Marketer&rsquo;s Unfulfilled Promise</h3>
      <div class="doc-prose">
        <p>For two decades, 1:1 personalization has been the stated goal of digital marketing. The vision was simple: show each customer exactly the content that matters to them. The reality was segmentation&mdash;bucketing millions of visitors into a handful of personas and showing each persona slightly different hero banners.</p>
        <p>True 1:1 was technically impossible (you can&rsquo;t pre-author millions of page variants), operationally impractical (who would manage all that content?), and computationally infeasible (real-time generation was too slow and too expensive).</p>
      </div>

      <h3>Three Breakthroughs Changed This</h3>
      <div class="doc-breakthroughs">
        <div class="doc-breakthrough">
          <div class="doc-breakthrough-num">Breakthrough 1</div>
          <h4>Inference-Optimized Infrastructure at the Edge</h4>
          <p>AI models can now run on globally distributed, inference-optimized silicon. Latency dropped from seconds to sub-second. A visitor in Tokyo gets personalized content from an edge node in Tokyo, not from a centralized data center. The Vitamix POC uses Cloudflare Workers with Cerebras for content generation and Anthropic Claude for reasoning&mdash;both callable from the edge.</p>
        </div>
        <div class="doc-breakthrough">
          <div class="doc-breakthrough-num">Breakthrough 2</div>
          <h4>Dramatically Faster and Cheaper LLM Inference</h4>
          <p>The cost and speed of generating content with LLMs improved by orders of magnitude between 2023 and 2026. What would have cost dollars per page view in 2023 now costs fractions of a cent. Cerebras inference delivers content generation at speeds that make streaming page sections viable in real time.</p>
        </div>
        <div class="doc-breakthrough">
          <div class="doc-breakthrough-num">Breakthrough 3</div>
          <h4>Model Capabilities for On-Brand Content</h4>
          <p>Modern LLMs produce contextually appropriate, brand-consistent content without extensive prompt engineering. They can reason about user intent, select appropriate content structures, and generate copy that matches a brand&rsquo;s voice and guidelines.</p>
        </div>
      </div>

      <div class="doc-image">
        <img src="${IMG_BASE}/doc-edge-computing.jpg" alt="Fiber optic cables converging at a modern network switch with light trails representing high-speed data flow" loading="lazy">
        <div class="doc-image-caption">Inference-optimized infrastructure at the edge &mdash; AI models run where the visitors are.</div>
      </div>

      <h3>Content Generation Becomes Infrastructure</h3>
      <div class="doc-prose">
        <p>The shift is conceptual: personalization moves from a <strong>content management problem</strong> (requiring human authors to produce variants) to an <strong>infrastructure problem</strong> (requiring compute and models). Infrastructure scales. Infrastructure gets cheaper over time. Infrastructure doesn&rsquo;t require editorial approval for each variant.</p>
      </div>

      <div class="doc-callout">
        <p>The brand defines the voice, the boundaries, the product data, and the block library. The AI assembles within those constraints, optimizing for each visitor.</p>
      </div>
    </section>`;
}

function renderSection3() {
  return `
    <section class="doc-section" id="value">
      <span class="doc-section-num">03</span>
      <h2>Why This Is Valuable to Customers</h2>

      <div class="doc-image">
        <img src="${IMG_BASE}/doc-family-kitchen.jpg" alt="A family gathered in a bright kitchen, pouring fresh green smoothies into glasses" loading="lazy">
        <div class="doc-image-caption">The people behind the queries &mdash; real families with specific needs that generic pages can&rsquo;t address.</div>
      </div>

      <h3>Less Work for Visitors</h3>
      <div class="doc-prose">
        <p>Traditional product pages force visitors to do cognitive work: decode feature matrices, mentally filter irrelevant information, figure out which specification matters for their use case, and wonder whether there&rsquo;s a better page elsewhere on the site.</p>
        <p>A parent comparing blenders doesn&rsquo;t care about commercial RPM specifications&mdash;they care about &ldquo;can it handle frozen fruit?&rdquo; and &ldquo;will it wake up the baby?&rdquo;</p>
      </div>

      <div class="doc-pullquote">
        <p>The page the visitor sees is already the best version of that page for them.</p>
      </div>

      <h3>Relevant from the First Interaction</h3>
      <div class="doc-prose">
        <p>Context accumulates across the session. The first query provides intent. Each subsequent interaction adds signal. By the third page, the system understands not just what the visitor searched for, but the underlying need:</p>
      </div>

      <div class="doc-timeline">
        <div class="doc-timeline-entry">
          <div class="doc-timeline-query">Query 1: <em>&ldquo;green smoothies for kids&rdquo;</em></div>
          <div class="doc-timeline-details">
            <span class="doc-timeline-tag"><span class="doc-timeline-tag-label">Learns</span> parent, health-conscious, kids involved</span>
          </div>
        </div>
        <div class="doc-timeline-entry">
          <div class="doc-timeline-query">Query 2: <em>&ldquo;which blenders are quietest?&rdquo;</em></div>
          <div class="doc-timeline-details">
            <span class="doc-timeline-tag"><span class="doc-timeline-tag-label">Refines</span> noise is a concern, likely early morning use</span>
          </div>
        </div>
        <div class="doc-timeline-entry">
          <div class="doc-timeline-query">Query 3: <em>&ldquo;A3500 vs V1200&rdquo;</em></div>
          <div class="doc-timeline-details">
            <span class="doc-timeline-tag"><span class="doc-timeline-tag-label">Narrows</span> comparing specific models, moving toward a decision</span>
          </div>
        </div>
      </div>

      <div class="doc-prose">
        <p>Each page is generated with the full accumulated context. The comparison page highlights noise levels (because the visitor cared about that earlier), includes kid-friendly green smoothie recipes (because that was the entry point), and focuses on family-sized capacity (because the system inferred household size).</p>
      </div>

      <h3>Answers the Question They Actually Have</h3>
      <div class="doc-prose">
        <p>People don&rsquo;t arrive at product websites with abstract curiosity. They arrive with specific situations: &ldquo;I have a family of four, my older son drinks smoothies daily, and my younger son won&rsquo;t eat vegetables&mdash;but he&rsquo;ll eat soup, even green-looking ones.&rdquo;</p>
        <p>Traditional websites require the visitor to map this personal context onto generic product information. Generative Websites invert this: the system maps its product knowledge onto the visitor&rsquo;s context, surfacing what&rsquo;s relevant and omitting what isn&rsquo;t.</p>
      </div>

      <h3>Trust Through Transparency</h3>
      <div class="doc-prose">
        <p>The Vitamix implementation includes reasoning transparency&mdash;visitors can see <em>why</em> the system recommended what it did. The AI&rsquo;s reasoning is surfaced: &ldquo;Recommended the A3500 because your previous queries indicate you need a blender for both hot soups and frozen smoothies, and the A3500&rsquo;s variable speed control handles both.&rdquo;</p>
      </div>
    </section>`;
}

function renderSection4() {
  return `
    <section class="doc-section" id="how">
      <span class="doc-section-num">04</span>
      <h2>How It Works</h2>

      <h3>The Three-Stage AI Pipeline</h3>
      <div class="doc-prose">
        <p>When a visitor requests a page, the system evaluates available context&mdash;both explicit (what the visitor has typed, clicked, or asked) and implicit (browsing history, device, location)&mdash;and runs it through a three-stage pipeline deployed on Cloudflare Workers at the edge:</p>
      </div>

      <div class="doc-pipeline">
        <div class="doc-pipeline-title">Edge AI Pipeline &mdash; Cloudflare Workers</div>
        <div class="doc-pipeline-stages">
          <div class="doc-pipeline-stage">
            <div class="doc-pipeline-stage-num">Stage 1</div>
            <h4>Classify</h4>
            <div class="doc-pipeline-stage-model">Cerebras 8B</div>
            <ul>
              <li>Intent type</li>
              <li>Journey stage</li>
              <li>Entity extraction</li>
              <li>Confidence score</li>
            </ul>
          </div>
          <div class="doc-pipeline-arrow">&rarr;</div>
          <div class="doc-pipeline-stage">
            <div class="doc-pipeline-stage-num">Stage 2</div>
            <h4>Reason</h4>
            <div class="doc-pipeline-stage-model">Claude Opus</div>
            <ul>
              <li>Block selection</li>
              <li>Product matching</li>
              <li>Content guidance</li>
              <li>Journey planning</li>
            </ul>
          </div>
          <div class="doc-pipeline-arrow">&rarr;</div>
          <div class="doc-pipeline-stage">
            <div class="doc-pipeline-stage-num">Stage 3</div>
            <h4>Generate</h4>
            <div class="doc-pipeline-stage-model">Cerebras 70B</div>
            <ul>
              <li>HTML content</li>
              <li>Hero images</li>
              <li>SSE streaming</li>
              <li>Block rationale</li>
            </ul>
          </div>
        </div>
      </div>

      <h4>Stage 1: Intent Classification</h4>
      <div class="doc-prose">
        <p>The visitor&rsquo;s query or accumulated signals are classified into a structured intent: discovery, comparison, product-detail, use-case, support, gift, accessibility, and more. The system detects journey stage (exploring &rarr; comparing &rarr; deciding), extracts entities (products, features, price sensitivity), and assigns a confidence score that governs downstream behavior.</p>
        <p>Special detection rules handle edge cases: support queries route to troubleshooting blocks; gift queries avoid recommending refurbished products; medical-context queries trigger empathetic content with accessibility focus.</p>
      </div>

      <h4>Stage 2: Deep Reasoning</h4>
      <div class="doc-prose">
        <p>The reasoning engine performs the critical editorial work that would traditionally require a human content strategist:</p>
        <ol class="doc-ordered">
          <li><strong>Analyzes the query</strong> in full context, including session history and implicit signals</li>
          <li><strong>Selects blocks</strong> from a library of 72 block types&mdash;choosing which content structures best serve this visitor</li>
          <li><strong>Picks products</strong> with explicit rationale, matching products to the inferred use case</li>
          <li><strong>Generates content guidance</strong>&mdash;e.g., &ldquo;emphasize kid-friendly soup recipes that hide vegetables&rdquo;</li>
          <li><strong>Plans the journey</strong>&mdash;suggests follow-up queries that fill gaps in what the visitor has explored</li>
        </ol>
      </div>

      <div class="doc-prose">
        <p>Confidence thresholds calibrate how assertive the recommendation should be:</p>
      </div>
      <div class="doc-confidence-grid">
        <div class="doc-confidence-row">
          <div class="doc-confidence-value">&ge; 70%</div>
          <div class="doc-confidence-label">Single product recommendation with conviction</div>
        </div>
        <div class="doc-confidence-row">
          <div class="doc-confidence-value">50&ndash;70%</div>
          <div class="doc-confidence-label">Best pick presented alongside alternatives</div>
        </div>
        <div class="doc-confidence-row">
          <div class="doc-confidence-value">35&ndash;50%</div>
          <div class="doc-confidence-label">Comparison only, no single recommendation</div>
        </div>
        <div class="doc-confidence-row">
          <div class="doc-confidence-value">&lt; 35%</div>
          <div class="doc-confidence-label">Discovery mode&mdash;help the visitor explore</div>
        </div>
      </div>

      <h4>Stage 3: Parallel Content Generation</h4>
      <div class="doc-prose">
        <p>For each selected block, content is generated in parallel and streamed to the browser via Server-Sent Events (SSE). The hero appears first, then blocks stream in below the fold. Each block includes a rationale explaining why it was chosen.</p>
      </div>

      <h3>72 Composable Content Blocks</h3>
      <div class="doc-prose">
        <p>The system doesn&rsquo;t generate free-form HTML. It selects from and fills <strong>72 pre-designed block types</strong>&mdash;each with defined structure, styling, and behavior. The brand controls every block&rsquo;s visual design; the AI controls which blocks appear and what content fills them.</p>
      </div>

      <div class="doc-blocks-grid">
        <div class="doc-blocks-item">
          <div class="doc-blocks-item-category">Product</div>
          <div class="doc-blocks-item-examples">product-hero, product-compare, best-pick, product-cards</div>
          <div class="doc-blocks-item-purpose">Discovery &amp; evaluation</div>
        </div>
        <div class="doc-blocks-item">
          <div class="doc-blocks-item-category">Recipe</div>
          <div class="doc-blocks-item-examples">recipe-hero, recipe-steps, recipe-cards, recipe-tabs</div>
          <div class="doc-blocks-item-purpose">Discovery &amp; instruction</div>
        </div>
        <div class="doc-blocks-item">
          <div class="doc-blocks-item-category">Support</div>
          <div class="doc-blocks-item-examples">troubleshooting-steps, faq, quick-answer, support-triage</div>
          <div class="doc-blocks-item-purpose">Problem resolution</div>
        </div>
        <div class="doc-blocks-item">
          <div class="doc-blocks-item-category">Engagement</div>
          <div class="doc-blocks-item-examples">testimonials, follow-up-advisor, follow-up</div>
          <div class="doc-blocks-item-purpose">Social proof &amp; next steps</div>
        </div>
        <div class="doc-blocks-item">
          <div class="doc-blocks-item-category">Specialized</div>
          <div class="doc-blocks-item-examples">budget-breakdown, engineering-specs, allergen-safety</div>
          <div class="doc-blocks-item-purpose">Domain-specific deep content</div>
        </div>
        <div class="doc-blocks-item">
          <div class="doc-blocks-item-category">Layout</div>
          <div class="doc-blocks-item-examples">hero, cards, columns, split-content</div>
          <div class="doc-blocks-item-purpose">Page structure</div>
        </div>
      </div>

      <h3>Session Context &amp; Progressive Personalization</h3>
      <div class="doc-prose">
        <p>Each visitor session maintains a rolling context (up to 10 queries) that enriches subsequent interactions. The system tracks what content types the visitor has and hasn&rsquo;t seen, and suggests productive next queries that fill knowledge gaps:</p>
      </div>

      <div class="doc-timeline">
        <div class="doc-timeline-entry">
          <div class="doc-timeline-query">Query 1: <em>&ldquo;green smoothies for kids&rdquo;</em></div>
          <div class="doc-timeline-details">
            <span class="doc-timeline-tag"><span class="doc-timeline-tag-label">Intent</span> discovery</span>
            <span class="doc-timeline-tag"><span class="doc-timeline-tag-label">Products</span> A3500, E320</span>
            <span class="doc-timeline-tag"><span class="doc-timeline-tag-label">Stage</span> exploring</span>
          </div>
        </div>
        <div class="doc-timeline-entry">
          <div class="doc-timeline-query">Query 2: <em>&ldquo;which model is quietest&rdquo;</em></div>
          <div class="doc-timeline-details">
            <span class="doc-timeline-tag"><span class="doc-timeline-tag-label">Intent</span> comparison</span>
            <span class="doc-timeline-tag"><span class="doc-timeline-tag-label">Products</span> A3500, V1200</span>
            <span class="doc-timeline-tag"><span class="doc-timeline-tag-label">Stage</span> comparing</span>
          </div>
        </div>
        <div class="doc-timeline-entry gap">
          <div class="doc-timeline-gap-label">Research Gaps Detected</div>
          <div class="doc-timeline-details">
            <span class="doc-timeline-tag">reviews&mdash;not yet explored</span>
            <span class="doc-timeline-tag">warranty&mdash;not yet explored</span>
          </div>
        </div>
      </div>

      <h3>Performance Constraints</h3>
      <div class="doc-prose">
        <p>Generative Websites are worthless if they&rsquo;re slow. Personalization that degrades performance defeats its purpose. The implementation enforces strict constraints:</p>
      </div>

      <div class="doc-metrics">
        <div class="doc-metric">
          <div class="doc-metric-value">2.5<span>s</span></div>
          <div class="doc-metric-label">Above-fold LCP via fast-path generation</div>
        </div>
        <div class="doc-metric">
          <div class="doc-metric-value">5<span>s</span></div>
          <div class="doc-metric-label">Below-fold blocks stream progressively</div>
        </div>
        <div class="doc-metric">
          <div class="doc-metric-value">2<span>-phase</span></div>
          <div class="doc-metric-label">Hero generates first, blocks stream in parallel</div>
        </div>
        <div class="doc-metric">
          <div class="doc-metric-value">Edge</div>
          <div class="doc-metric-label">Cloudflare Workers eliminate origin round-trips</div>
        </div>
      </div>

      <h3>Page Persistence</h3>
      <div class="doc-prose">
        <p>Generated pages are not ephemeral. Once generated, a page can be persisted to Adobe&rsquo;s Document Authoring system at a permanent URL. Visitors can bookmark and share personalized pages, the system builds a growing library of generated content, and analytics can track performance of generated vs. authored pages.</p>
      </div>
    </section>`;
}

function renderSection5() {
  return `
    <section class="doc-section" id="usecases">
      <span class="doc-section-num">05</span>
      <h2>Use Cases Implemented for Vitamix</h2>

      <div class="doc-usecase">
        <div class="doc-usecase-tag">Use Case A</div>
        <h4>Explicit Query-Based Page Generation</h4>
        <p class="doc-usecase-scenario">A visitor arrives at the Vitamix site and types a natural-language query into a search box.</p>

        <blockquote>&ldquo;Looking to buy a Vitamix blender&mdash;can you compare X5 vs X4 and others if you think they make sense. I have a family of 4&mdash;my older son is into smoothies and my younger son doesn&rsquo;t like veggies&mdash;but when I make soups he likes them&mdash;even if they are green looking.&rdquo;</blockquote>

        <h4>What Happens</h4>
        <ol class="doc-usecase-steps">
          <li><strong>The query hits the recommender worker</strong> at the edge via Cloudflare Workers</li>
          <li><strong>Intent classification</strong> identifies: comparison intent, family context, two distinct use cases (smoothies + soups), kid-focused, picky-eater signal</li>
          <li><strong>Deep reasoning</strong> determines the primary need (versatile blender for hot soups and frozen smoothies), the hidden need (soup-making as a strategy to get vegetables into the younger child), and selects blocks accordingly</li>
          <li><strong>Content generates and streams</strong>&mdash;hero appears in under 3 seconds, comparison highlights capacity and noise (not RPM), recipes feature &ldquo;Green Monster Soup,&rdquo; follow-up suggestions fill research gaps</li>
          <li><strong>The page persists</strong> at a permanent URL the visitor can share or return to</li>
        </ol>

        <div class="doc-prose">
          <p><strong>The key differentiator:</strong> The visitor didn&rsquo;t get a list of links. They got a page composed specifically for their situation&mdash;a parent of four with two kids who have different needs. No pre-authored page on vitamix.com addresses this exact scenario. The generative website created one.</p>
          <p>The visitor can ask follow-up queries. Each subsequent page incorporates everything learned so far. By the third interaction, the system knows the family size, dietary constraints, noise sensitivity, and budget range&mdash;and every recommendation reflects that accumulated understanding.</p>
        </div>
      </div>

      <div class="doc-image">
        <img src="${IMG_BASE}/doc-browsing.jpg" alt="A person browsing a personalized product page on a laptop in warm afternoon light" loading="lazy">
        <div class="doc-image-caption">Every page is composed for the visitor&rsquo;s situation &mdash; no two experiences are identical.</div>
      </div>

      <div class="doc-usecase">
        <div class="doc-usecase-tag">Use Case B</div>
        <h4>Implicit Signal-Based Content Injection</h4>
        <p class="doc-usecase-scenario">A visitor browses vitamix.com normally&mdash;no explicit queries. A Chrome extension observes their behavior and infers intent from implicit signals.</p>

        <h4>What the Extension Captures</h4>
        <div class="doc-table-wrap">
          <table class="doc-table">
            <thead>
              <tr><th>Signal Type</th><th>Example</th><th>Weight</th></tr>
            </thead>
            <tbody>
              <tr><td>Page views</td><td>Visited /products/a3500, /products/v1200</td><td>High</td></tr>
              <tr><td>Click patterns</td><td>Clicked &ldquo;Compare&rdquo; button, &ldquo;Noise Level&rdquo; filter</td><td>High</td></tr>
              <tr><td>Scroll depth</td><td>Scrolled 90% on A3500, only 30% on V1200</td><td>Medium</td></tr>
              <tr><td>Time on page</td><td>4 minutes on comparison page</td><td>Medium</td></tr>
              <tr><td>Navigation path</td><td>Products &rarr; Recipes &rarr; Back to Products</td><td>Medium</td></tr>
              <tr><td>Content extraction</td><td>Read price, viewed ratings, checked accessories</td><td>Low&ndash;Medium</td></tr>
            </tbody>
          </table>
        </div>

        <h4>How Signals Become Personalization</h4>
        <ol class="doc-usecase-steps">
          <li><strong>Signal capture</strong>&mdash;the content script observes all interactions on vitamix.com: page views with full context extraction, clicks with element data, scroll depth, comparison page analysis</li>
          <li><strong>Profile inference</strong>&mdash;the background worker aggregates signals into an inferred profile: primary intent, specific needs, emotional context, journey stage, and key insights</li>
          <li><strong>Context packaging</strong>&mdash;the full signal history is stored with a context ID in Cloudflare KV (1-hour TTL) and passed to the recommender worker</li>
          <li><strong>Personalized generation</strong>&mdash;the system generates a page without the visitor ever typing a query, composed entirely from behavioral inference</li>
          <li><strong>Content injection</strong>&mdash;on the current page, personalized blocks can be injected below the fold without disrupting existing page structure</li>
        </ol>

        <div class="doc-signal-flow">
          <div class="doc-signal-flow-left">
            <span class="doc-signal-flow-label">Content Injection</span>
            Add personalized blocks below the fold of existing pages. Minimal disruption&mdash;enhances the current page.
          </div>
          <div class="doc-signal-flow-center">&harr;</div>
          <div class="doc-signal-flow-right">
            <span class="doc-signal-flow-label">Page Generation</span>
            Generate an entirely new page from accumulated signals. Creates new navigation paths.
          </div>
        </div>

        <div class="doc-prose">
          <p><strong>The critical insight:</strong> the visitor never typed a word. Every personalization signal came from behavior. The system inferred intent the same way an experienced sales associate would&mdash;by watching what someone picks up, examines, puts back, and returns to.</p>
        </div>
      </div>

      <h3>How Both Use Cases Connect</h3>
      <div class="doc-prose">
        <p>The explicit and implicit approaches are not separate systems. They share the same AI pipeline, the same block library, the same reasoning engine, and the same session context. A visitor can:</p>
        <ol class="doc-ordered">
          <li><strong>Start implicit</strong>&mdash;browse vitamix.com, accumulating behavioral signals</li>
          <li><strong>Shift explicit</strong>&mdash;type a query informed by their browsing</li>
          <li><strong>Continue implicit</strong>&mdash;browse the generated page, system tracks engagement</li>
          <li><strong>Return explicit</strong>&mdash;ask a follow-up that builds on everything prior</li>
        </ol>
        <p>This fluid movement between explicit and implicit personalization mirrors how real conversations work. You observe, you ask, you observe the response, you refine. The system supports the same rhythm.</p>
      </div>
    </section>`;
}

function renderClosing() {
  return `
    <div class="doc-closing">
      <div class="doc-closing-from">One page, many visitors</div>
      <div class="doc-closing-to">Many pages, each for one visitor.</div>
      <p>The brand controls the intent, the structure, the voice, and the boundaries. The AI controls the expression within those boundaries, optimizing for each visitor&rsquo;s context. For the first time, every visitor sees the best version of the page&mdash;for them.</p>
    </div>`;
}

function initScrollSpy(block) {
  const sections = block.querySelectorAll('.doc-section');
  const navItems = block.querySelectorAll('.doc-nav-item');

  if (!sections.length || !navItems.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navItems.forEach((item) => item.classList.remove('active'));
          const activeItem = block.querySelector(
            `.doc-nav-item[data-section="${entry.target.id}"]`,
          );
          if (activeItem) activeItem.classList.add('active');
        }
      });
    },
    { rootMargin: '-20% 0px -60% 0px' },
  );

  sections.forEach((section) => observer.observe(section));

  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('data-section');
      const target = block.querySelector(`#${targetId}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function initAnimations(block) {
  const elements = block.querySelectorAll('.doc-section');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05 },
  );

  elements.forEach((el) => observer.observe(el));
}

export default function decorate(block) {
  block.innerHTML = `
    ${renderHeader()}
    <div class="doc-body">
      ${renderNav()}
      <article class="doc-article">
        ${renderSection1()}
        ${renderSection2()}
        ${renderSection3()}
        ${renderSection4()}
        ${renderSection5()}
        ${renderClosing()}
      </article>
    </div>
  `;

  initScrollSpy(block);
  initAnimations(block);
}
