# Dewlune: Shopify OS 2.0 skincare theme, built from scratch

Portfolio store for a fictional skincare brand. The theme is written in Liquid, CSS and vanilla JavaScript, with no framework or storefront apps. Product data and imagery are supplied separately in `dewlune-products.csv`.

> Dewlune is a fictional brand. The demo store does not fulfil orders.

## Highlights

- **Skin quiz**: four questions with a clear progress label, manual step navigation and answer review. Answers add weighted tags, products are scored against them and the best match for each step of the routine is picked. The whole routine goes to the bag in one tap.
- **Build your ritual**: pick any three products into a live tray with a progress meter and the 15% saving calculated as you go, then add all three at once.
- **AM / PM routine**: one switch changes the routine, the photo and the "add routine" button. Steps can be ticked off with an animated checklist.
- **Ingredient system**: product tags such as `ing:niacinamide` and `concern:dryness` drive the key ingredient list on the product page, the concern filters and a searchable ingredient glossary that shows which formulas use each ingredient.
- **Product page**: size selector, subscription options when a selling plan exists, description headings turned into accordions, the "How to use" list turned into an interactive checklist, a mobile swipe gallery and a sticky add to bag bar.
- **Cart drawer** on the Cart API and Section Rendering API, with a free shipping progress bar.
- **Predictive search** with the Predictive Search API, and AJAX collection filtering and sorting.
- **Branded product photography**: seven cohesive, locally bundled WebP packshots with the Dewlune wordmark and exact product names. The theme maps each product handle to its matching image in collection cards, menus, product pages, search, routines, and quiz results. Editorial and hero images remain configurable through the theme editor.
- **Effects adapted from React Bits, 21st.dev and Uiverse**, rewritten in plain CSS and JS. All of them respect the reduced motion preference and can be switched off in theme settings.
- Self hosted variable fonts (Fraunces and Manrope), responsive layouts for phones, tablets and desktop, keyboard accessible drawers and modals with focus trapping. The navigation switches to the mobile drawer below 1200 px so the product menu stays readable on smaller screens.

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
| Quiz band, quiz page, 404, password | Iridescence (WebGL) | React Bits |
| Quiz steps | Stepper | React Bits |
| "The quiet ritual" section | Scroll media expansion hero (@arunachalam) | 21st.dev |
| Secondary buttons | Interactive Hover Button (@dillionverma) | 21st.dev |
| Primary buttons | Shine button (satyamchaudharydev) | Uiverse |
| Size selector | Segmented radio (SanjanaSogimatt) | Uiverse |
| Quiz answers, ritual tiles | Radio tiles (Yaya12085) | Uiverse |
| AM / PM switch | Toggle (JaydipPrajapati1910) | Uiverse |
| Routine steps | Checklist (JkHuger) | Uiverse |
| Button loading state | Dots loader (Ali-Tahmazi99) | Uiverse |

React Bits is MIT with the Commons Clause, so these ports are shared here as part of the store and not as a standalone component pack. Uiverse and the listed 21st.dev components are MIT. Fonts are under the SIL Open Font License. Photos are from Unsplash under the Unsplash License.

## Setup

1. **Online Store > Themes > Add theme > Upload zip file**, choose `dewlune-theme.zip` and publish it.
2. **Products > Import**, choose `dewlune-products.csv`. This imports the seven product records without the old unbranded stock photos; branded storefront images are included in the theme ZIP and selected by product handle. To also store the generated images in Shopify’s product media library, upload each matching WebP from `assets/` to its product after import.
3. **Online Store > Pages**, create these pages and pick the template shown:

   | Page | Handle | Template |
   | --- | --- | --- |
   | Skin quiz | `skin-quiz` | `page.quiz` |
   | Ingredients | `ingredients` | `page.ingredients` |
   | About | `about` | `page.about` |
   | FAQ | `faq` | `page.faq` |
   | Contact | `contact` | `page.contact` |
   | Build your ritual | `build-your-ritual` | `page.ritual` |

4. **Online Store > Navigation**: main menu with Shop (`/collections/all`), Skin quiz, Ingredients and About; footer menu with Build your ritual, FAQ, Contact and Ingredients.
5. **Discounts > Create discount > Amount off products**, automatic, 15%, minimum quantity of 3 items. This is the saving that "Build your ritual" promises.

## Product tags

| Tag | Used for |
| --- | --- |
| `concern:dryness` | Concern chips, quiz scoring, card labels |
| `skin:sensitive` | Quiz scoring |
| `step:serum` | Card label and the quiz routine order |
| `ing:squalane` | Key ingredients on the product page and the glossary |
| `bundle` | Keeps sets out of the quiz and the ritual builder |

## Quiz implementation references

The quiz borrows interaction patterns from [React Bits Card Swap](https://reactbits.dev/components/card-swap), the [21st.dev Stepper](https://21st.dev/@sudharshanpanidev/components/stepper), and the [Uiverse radio card](https://uiverse.io/jubayer-10/serious-mule-39). They are adapted to Liquid, CSS and vanilla JavaScript; no React runtime or UI package is needed. The image stack previews Dewlune products and changes with the active question; completed steps can be revisited.
