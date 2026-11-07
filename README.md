# Dewlune: Shopify OS 2.0 skincare theme, built from scratch

![Dewlune home page](docs/screenshots/01-hero.jpg)

Portfolio store for a fictional skincare brand. The theme is written from scratch in Liquid, CSS and vanilla JavaScript, with no starter theme, no framework and no storefront apps. It passes Shopify Theme Check with zero offenses.

**Live store:** [dewlune-vp5q4sat.myshopify.com](https://dewlune-vp5q4sat.myshopify.com), password: `dewlune`

> Dewlune is a fictional brand. The demo store does not fulfil orders.

<p align="center">
  <img src="docs/screenshots/home-scroll.gif" alt="Scrolling the Dewlune home page" width="680">
</p>

## Contents

- [Skin quiz](#skin-quiz)
- [Navigation and search](#navigation-and-search)
- [Home page](#home-page)
- [Shopping](#shopping)
- [Ingredient system](#ingredient-system)
- [Mobile](#mobile)
- [Effects and credits](#effects-and-credits)
- [Tech notes](#tech-notes)
- [Setup](#setup)

## Skin quiz

Four questions that turn into a personalised routine, with the whole routine added to the bag in one tap.

<p align="center">
  <img src="docs/screenshots/quiz-flow.gif" alt="Skin quiz from first question to result" width="680">
</p>

- **Scoring:** every answer adds weighted tags (`concern:` counts 3, `skin:` counts 2). Products are scored against them, and the best match for each step of the routine is chosen in application order.
- **Instant feedback:** answer cards tilt in 3D under the cursor, and a pick releases a ripple and a burst of amber droplets. Each answer also gets a short reaction line written for it.
- **Live skin profile:** chips build up beside the question as the visitor answers.
- **Progress:** an animated progress bar, step indicators that can jump back to answered questions, and a Continue button that pulses when it unlocks.
- **Reveal:** an "analysing" orb with rotating messages, a confetti burst in brand colours, and a match percentage bar for every product.
- **Keyboard:** keys 1 to 5 pick an answer and Enter continues.

| Answering | Result |
| --- | --- |
| ![Quiz answer with reaction and skin profile](docs/screenshots/18-quiz-answer.jpg) | ![Quiz result with match bars](docs/screenshots/21-quiz-result.jpg) |

## Navigation and search

| Mega menu | Predictive search |
| --- | --- |
| ![Mega menu](docs/screenshots/02-mega-menu.jpg) | ![Search with trending terms](docs/screenshots/12-search.jpg) |

- **Mega menu** adapted from React Bits CardNav: concern and discovery lists, product cards and a quiz feature card that enter in sequence.
- **Glass header** adapted from React Bits GlassSurface: after scrolling, the header becomes a floating pill with SVG edge refraction in Chromium browsers and a frosted fallback elsewhere. It hides on scroll down and returns on scroll up.
- **Search** opens with trending ingredient chips and best sellers before the visitor types, then switches to results from the Predictive Search API.
- **Country and currency selector** on the Shopify localization form, listing the countries in Markets.

## Home page

![Shop the edit grid](docs/screenshots/03-shop-grid.jpg)

| Shop by concern | The numbers on the front |
| --- | --- |
| ![Accordion gallery](docs/screenshots/05-shop-by-concern.jpg) | ![Ingredient numbers with CountUp](docs/screenshots/06-ingredient-numbers.jpg) |

| AM / PM routine | Scroll media expansion |
| --- | --- |
| ![AM PM routine with checklist](docs/screenshots/07-am-pm-routine.jpg) | ![Scroll expansion section](docs/screenshots/08-scroll-expansion.jpg) |

| Quiz band (WebGL Iridescence) | Build your ritual |
| --- | --- |
| ![Iridescence quiz teaser](docs/screenshots/09-quiz-teaser.jpg) | ![Ritual builder with three products](docs/screenshots/10-build-your-ritual.jpg) |

- **Hero:** BlurText headline, a rotating word, a spinning circular badge and a gradual blur at the bottom edge.
- **Concern filters** built from product tags, with no page reload.
- **AM / PM routine:** one switch changes the steps, the photo and the "add routine" button. Steps can be ticked off with an animated checklist.
- **Build your ritual:** pick any three products into a live tray with a progress meter and the 15% saving calculated as you go, then add all three at once.

![Footer with interactive wordmark](docs/screenshots/11-footer.jpg)

The footer wordmark uses React Bits VariableProximity: letters gain weight and lose softness near the cursor. The footer also holds a newsletter form with an animated confirmation, three link columns and social links.

## Shopping

| Product page | Product details |
| --- | --- |
| ![Product page](docs/screenshots/14-product-page.jpg) | ![Key ingredients and how to use](docs/screenshots/15-product-details.jpg) |

| Collection with filters | Cart drawer |
| --- | --- |
| ![Collection filters](docs/screenshots/16-collection-filters.jpg) | ![Cart drawer](docs/screenshots/13-cart-drawer.jpg) |

- **Product page:** segmented size selector, subscription options when a selling plan exists, description headings turned into accordions, the "How to use" list turned into an interactive checklist, a swipe gallery on phones and a sticky add to bag bar.
- **Collection:** concern chips, Shopify filters and sorting through the Section Rendering API, without reloading the page.
- **Cart drawer** on the Cart API and Section Rendering API, with a free shipping progress bar and a ritual savings note.

## Ingredient system

![Ingredient glossary with live search](docs/screenshots/17-ingredient-glossary.jpg)

Product tags such as `ing:niacinamide` and `concern:dryness` drive the key ingredient list on the product page, the concern filters and a searchable glossary that shows which formulas use each ingredient.

## Mobile

![Home, menu, product, quiz and collection on a phone](docs/screenshots/22-mobile.jpg)

Tested from 320 px phones to 2560 px screens with no horizontal overflow. Below 1200 px, the navigation moves into a drawer with a product carousel. On small phones, filter panels are kept inside the screen and newsletter fields stack.

## Effects and credits

| Where | Effect | Source |
| --- | --- | --- |
| Hero headline, section titles | BlurText | React Bits |
| Hero rotating word | Text Rotate (@danielpetho) | 21st.dev |
| Hero badge | CircularText | React Bits |
| Bottom of hero | GradualBlur | React Bits |
| Ingredient marquee | ScrollVelocity | React Bits |
| Brand statement | ScrollReveal | React Bits |
| Shop by concern | AccordionGallery | React Bits |
| Ingredient numbers | CountUp | React Bits |
| Product and ingredient cards | SpotlightCard, GlareHover | React Bits |
| Mega menu | CardNav | React Bits |
| Header on scroll | GlassSurface | React Bits |
| Footer wordmark | VariableProximity | React Bits |
| Quiz band, quiz page, 404, password | Iridescence (WebGL) | React Bits |
| Quiz steps and image stack | Stepper, Card Swap | React Bits, 21st.dev |
| "The quiet ritual" section | Scroll media expansion hero (@arunachalam) | 21st.dev |
| Secondary buttons | Interactive Hover Button (@dillionverma) | 21st.dev |
| Primary buttons | Shine button (satyamchaudharydev) | Uiverse |
| Size selector | Segmented radio (SanjanaSogimatt) | Uiverse |
| Quiz answers, ritual tiles | Radio tiles (Yaya12085) | Uiverse |
| AM / PM switch | Toggle (JaydipPrajapati1910) | Uiverse |
| Routine steps | Checklist (JkHuger) | Uiverse |
| Button loading state | Dots loader (Ali-Tahmazi99) | Uiverse |

All effects are rewritten in plain CSS and JavaScript, with no React runtime. They respect the reduced motion preference and can be switched off in theme settings.

React Bits is MIT with the Commons Clause, so these ports are shared as part of the store and not as a standalone component pack. Uiverse and the listed 21st.dev components are MIT. Fonts are under the SIL Open Font License. Editorial photos are from Unsplash under the Unsplash License.

## Tech notes

- Shopify OS 2.0: JSON templates, section groups for header and footer, every section editable in the theme editor.
- Cart API, Section Rendering API, Predictive Search API, Product Recommendations API and the localization form.
- Images served through `srcset` up to 3840 px wide for 4K and high density screens. Every image spot accepts an upload or an Unsplash link.
- Seven branded WebP packshots bundled in the theme and mapped to products by handle.
- Self hosted variable fonts (Fraunces and Manrope).
- Accessible drawers and modals with focus trapping, visible focus states, live regions for cart and quiz updates.

## Setup

1. **Online Store > Themes > Add theme > Upload zip file**, choose `dewlune-theme.zip` and publish it.
2. **Products > Import**, choose `dewlune-products.csv`. The branded storefront images are included in the theme and selected by product handle.
3. **Online Store > Pages**, create these pages and pick the template shown:

   | Page | Handle | Template |
   | --- | --- | --- |
   | Skin quiz | `skin-quiz` | `page.quiz` |
   | Ingredients | `ingredients` | `page.ingredients` |
   | About | `about` | `page.about` |
   | FAQ | `faq` | `page.faq` |
   | Contact | `contact` | `page.contact` |
   | Build your ritual | `build-your-ritual` | `page.ritual` |

4. **Discounts > Create discount > Amount off products**: automatic, 15%, minimum quantity of 3 items. This is the saving that "Build your ritual" promises.

Header and footer links are set in the theme editor, so no navigation menus are needed.

### Product tags

| Tag | Used for |
| --- | --- |
| `concern:dryness` | Concern chips, quiz scoring, card labels |
| `skin:sensitive` | Quiz scoring |
| `step:serum` | Card label and the quiz routine order |
| `ing:squalane` | Key ingredients on the product page and the glossary |
| `bundle` | Keeps sets out of the quiz and the ritual builder |

Screenshots were captured from a local render of the theme with the demo product data.
