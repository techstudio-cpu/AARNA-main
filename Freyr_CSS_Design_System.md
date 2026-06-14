# FREYR ENERGY - CSS & DESIGN SYSTEM SPECIFICATIONS
## For Implementation on aarnasolars.com

---

## COLOR PALETTE REFERENCE

### Primary Colors
```css
--color-primary: #1a9b8e;        /* Teal/Green - Main CTA, headers */
--color-primary-hover: #158070;  /* Darker on hover */
--color-secondary: #ff6b35;      /* Orange - Accents */
--color-secondary-light: #ffa85c; /* Light orange - Hover states */
```

### Neutral Colors
```css
--color-bg-light: #ffffff;         /* Main background */
--color-bg-section: #f5f5f5;      /* Alternating section background */
--color-bg-dark: #1a1a1a;         /* Footer, dark sections */
--color-text-dark: #333333;       /* Primary text */
--color-text-light: #666666;      /* Secondary text */
--color-border: #e0e0e0;          /* Dividers, borders */
--color-border-light: #f0f0f0;    /* Subtle dividers */
```

### Semantic Colors
```css
--color-success: #4caf50;         /* Success messages */
--color-error: #f44336;           /* Errors */
--color-warning: #ff9800;         /* Warnings */
--color-info: #2196f3;            /* Info messages */
```

---

## TYPOGRAPHY SYSTEM

### Font Family
```css
--font-primary: 'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-secondary: 'Poppins', sans-serif;
--font-mono: 'Monaco', 'Menlo', monospace;
```

### Font Sizes
```css
/* Headings */
--font-h1: 48px;           /* Hero headlines */
--font-h2: 36px;           /* Section headers */
--font-h3: 28px;           /* Subsection headers */
--font-h4: 24px;           /* Card headers */
--font-h5: 20px;           /* Subheaders */
--font-h6: 18px;           /* Labels */

/* Body */
--font-body-lg: 18px;      /* Large body text */
--font-body: 16px;         /* Default body */
--font-body-sm: 14px;      /* Small body text */
--font-caption: 12px;      /* Captions, metadata */
--font-tiny: 11px;         /* Footer text */

/* Line Heights */
--line-height-tight: 1.2;
--line-height-normal: 1.6;
--line-height-relaxed: 1.8;
--line-height-loose: 2;
```

### Font Weights
```css
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Heading Examples
```css
h1 {
  font-size: var(--font-h1);
  font-weight: var(--font-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-dark);
  margin-bottom: 20px;
}

h2 {
  font-size: var(--font-h2);
  font-weight: var(--font-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-dark);
  margin-bottom: 16px;
}

body {
  font-family: var(--font-primary);
  font-size: var(--font-body);
  line-height: var(--line-height-normal);
  color: var(--color-text-dark);
}
```

---

## SPACING SYSTEM

### Base Unit: 8px
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
--spacing-4xl: 80px;
--spacing-5xl: 120px;
```

### Common Padding/Margins
```css
/* Sections */
--section-padding-mobile: 24px;
--section-padding-tablet: 40px;
--section-padding-desktop: 60px;

/* Container */
--container-padding: 20px;      /* Mobile */
--container-padding-lg: 40px;   /* Tablet/Desktop */
--container-max-width: 1200px;
```

### Spacing Examples
```css
.section {
  padding: var(--spacing-4xl) var(--spacing-lg);
}

@media (max-width: 768px) {
  .section {
    padding: var(--spacing-2xl) var(--spacing-md);
  }
}

.container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding-lg);
}
```

---

## SHADOW & ELEVATION SYSTEM

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.15);
--shadow-2xl: 0 16px 32px rgba(0, 0, 0, 0.2);

/* Elevation */
--elevation-1: var(--shadow-sm);
--elevation-2: var(--shadow-md);
--elevation-3: var(--shadow-lg);
--elevation-4: var(--shadow-xl);
--elevation-5: var(--shadow-2xl);
```

### Usage
```css
.card {
  box-shadow: var(--shadow-md);
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
}
```

---

## BORDER & RADIUS SYSTEM

```css
--border-radius-sm: 4px;
--border-radius-md: 8px;
--border-radius-lg: 12px;
--border-radius-xl: 16px;
--border-radius-2xl: 24px;
--border-radius-full: 9999px;

--border-width-thin: 1px;
--border-width-default: 2px;
--border-width-thick: 3px;
```

### Component Examples
```css
.button {
  border-radius: var(--border-radius-md);
  border: var(--border-width-default) solid transparent;
}

.card {
  border-radius: var(--border-radius-lg);
  border: var(--border-width-thin) solid var(--color-border-light);
}

.input {
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border);
  padding: var(--spacing-md) var(--spacing-lg);
}
```

---

## BUTTON COMPONENTS

### Primary Button
```css
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  font-size: var(--font-body);
  font-weight: var(--font-semibold);
  padding: 14px 32px;
  border-radius: var(--border-radius-md);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-block;
  text-align: center;
  text-decoration: none;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Disabled state */
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
```

### Secondary Button
```css
.btn-secondary {
  background-color: white;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  font-size: var(--font-body);
  font-weight: var(--font-semibold);
  padding: 12px 30px;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: var(--color-primary);
  color: white;
}
```

### Button Sizes
```css
.btn-sm {
  padding: 10px 20px;
  font-size: var(--font-body-sm);
}

.btn-lg {
  padding: 18px 40px;
  font-size: var(--font-body-lg);
}

.btn-full {
  width: 100%;
  display: block;
}
```

---

## FORM COMPONENTS

### Input Fields
```css
input,
textarea,
select {
  font-family: var(--font-primary);
  font-size: var(--font-body);
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background-color: white;
  color: var(--color-text-dark);
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(26, 155, 142, 0.1);
}

input:invalid,
input.error {
  border-color: var(--color-error);
}

input:disabled {
  background-color: var(--color-bg-section);
  cursor: not-allowed;
  opacity: 0.6;
}
```

### Form Labels
```css
label {
  display: block;
  font-size: var(--font-body-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-dark);
  margin-bottom: var(--spacing-sm);
}

label .required {
  color: var(--color-error);
  margin-left: 4px;
}
```

### Form Group
```css
.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  margin-bottom: var(--spacing-sm);
}

.form-error {
  color: var(--color-error);
  font-size: var(--font-caption);
  margin-top: 4px;
}

.form-success {
  color: var(--color-success);
}
```

### Radio & Checkbox
```css
.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

input[type="radio"],
input[type="checkbox"] {
  width: auto;
  margin-right: var(--spacing-md);
  cursor: pointer;
  accent-color: var(--color-primary);
}

.radio-item,
.checkbox-item {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-item label,
.checkbox-item label {
  margin-bottom: 0;
  margin-left: var(--spacing-sm);
  cursor: pointer;
}
```

---

## CARD COMPONENT

```css
.card {
  background-color: white;
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  border: 1px solid var(--color-border-light);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.card-header {
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: var(--spacing-lg);
}

.card-title {
  font-size: var(--font-h4);
  font-weight: var(--font-bold);
  color: var(--color-text-dark);
  margin: 0;
}

.card-body {
  margin-bottom: var(--spacing-lg);
}

.card-footer {
  border-top: 1px solid var(--color-border-light);
  padding-top: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

/* Card Variants */
.card-feature {
  text-align: center;
}

.card-feature .icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-lg);
}

.card-service {
  display: flex;
  flex-direction: column;
}

.card-service img {
  width: 100%;
  height: auto;
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
  margin: -var(--spacing-2xl) -var(--spacing-2xl) var(--spacing-lg) -var(--spacing-2xl);
}
```

---

## GRID LAYOUTS

### Container
```css
.container {
  width: 100%;
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
}

@media (min-width: 768px) {
  .container {
    padding: 0 var(--container-padding-lg);
  }
}
```

### Grid System
```css
.grid {
  display: grid;
  gap: var(--spacing-2xl);
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

/* Responsive grids */
@media (max-width: 1024px) {
  .grid-4,
  .grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .grid-4,
  .grid-3,
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
```

### Flexbox Layouts
```css
.flex {
  display: flex;
  gap: var(--spacing-lg);
}

.flex-center {
  align-items: center;
  justify-content: center;
}

.flex-between {
  justify-content: space-between;
  align-items: center;
}

.flex-start {
  justify-content: flex-start;
  align-items: center;
}

.flex-col {
  flex-direction: column;
}

/* Wrap on mobile */
@media (max-width: 768px) {
  .flex {
    flex-wrap: wrap;
  }
}
```

---

## SECTION STYLING

### Standard Section
```css
.section {
  padding: var(--spacing-5xl) var(--spacing-lg);
}

.section-light {
  background-color: white;
}

.section-gray {
  background-color: var(--color-bg-section);
}

.section-dark {
  background-color: var(--color-bg-dark);
  color: white;
}

/* Alternating pattern */
.section:nth-child(even) {
  background-color: var(--color-bg-section);
}

/* Section with image background */
.section-bg {
  background-size: cover;
  background-position: center;
  position: relative;
}

.section-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.section-bg .content {
  position: relative;
  z-index: 2;
}

@media (max-width: 768px) {
  .section {
    padding: var(--spacing-3xl) var(--spacing-md);
  }
}
```

---

## HERO SECTION

```css
.hero {
  position: relative;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  overflow: hidden;
}

.hero-video {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
  max-width: 800px;
  padding: var(--spacing-2xl);
}

.hero h1 {
  font-size: 52px;
  color: white;
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-tight);
}

.hero-subtitle {
  font-size: var(--font-h3);
  margin-bottom: var(--spacing-2xl);
  opacity: 0.95;
}

.hero-countdown {
  display: flex;
  justify-content: center;
  gap: var(--spacing-2xl);
  margin-bottom: var(--spacing-2xl);
  font-size: 18px;
}

.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.countdown-value {
  font-size: 32px;
  font-weight: var(--font-bold);
  line-height: 1;
}

.countdown-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .hero {
    height: 350px;
  }

  .hero h1 {
    font-size: 32px;
  }

  .hero-subtitle {
    font-size: var(--font-h4);
  }

  .hero-countdown {
    flex-direction: column;
    gap: var(--spacing-lg);
  }
}
```

---

## TESTIMONIALS SECTION

```css
.testimonials {
  padding: var(--spacing-5xl) var(--spacing-lg);
  background-color: var(--color-bg-section);
}

.testimonial-card {
  background-color: white;
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.testimonial-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.testimonial-quote {
  font-size: var(--font-body);
  color: var(--color-text-light);
  font-style: italic;
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-lg);
  quotes: '"' '"';
}

.testimonial-quote::before {
  content: open-quote;
  font-size: 40px;
  color: var(--color-primary);
  opacity: 0.3;
}

.testimonial-quote::after {
  content: close-quote;
}

.testimonial-author {
  font-weight: var(--font-semibold);
  color: var(--color-text-dark);
  margin-bottom: 4px;
}

.testimonial-location {
  font-size: var(--font-caption);
  color: var(--color-text-light);
}

.testimonial-rating {
  margin-bottom: var(--spacing-lg);
  color: #ffc107;
}

/* Carousel / Slider */
.testimonial-slider {
  position: relative;
  overflow: hidden;
}

.testimonial-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: var(--spacing-2xl);
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--color-border);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  background-color: var(--color-primary);
  width: 32px;
  border-radius: 6px;
}
```

---

## CALCULATOR COMPONENT

```css
.calculator {
  background-color: white;
  padding: var(--spacing-3xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
}

.calc-tabs {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
  border-bottom: 2px solid var(--color-border);
}

.calc-tab {
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  background: none;
  font-size: var(--font-body);
  font-weight: var(--font-semibold);
  color: var(--color-text-light);
  cursor: pointer;
  position: relative;
  transition: color 0.3s ease;
}

.calc-tab.active {
  color: var(--color-primary);
}

.calc-tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-primary);
}

.calc-input-group {
  margin-bottom: var(--spacing-2xl);
}

.calc-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  font-weight: var(--font-semibold);
}

.calc-value {
  color: var(--color-primary);
  font-size: 18px;
}

.calc-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--color-border);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.calc-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: var(--shadow-md);
}

.calc-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: none;
  box-shadow: var(--shadow-md);
}

/* Results Panel */
.calc-results {
  background-color: var(--color-bg-section);
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-lg);
  margin-top: var(--spacing-2xl);
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) 0;
  border-bottom: 1px solid var(--color-border);
}

.result-item:last-child {
  border-bottom: none;
}

.result-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-body-sm);
  color: var(--color-text-light);
}

.result-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-value {
  font-size: var(--font-h5);
  font-weight: var(--font-bold);
  color: var(--color-text-dark);
}

.result-value.primary {
  color: var(--color-primary);
}

.result-value.success {
  color: var(--color-success);
}

/* Finance breakdown */
.finance-breakdown {
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-2xl);
  border-top: 2px solid var(--color-border);
}

.finance-option {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.finance-item {
  text-align: center;
  padding: var(--spacing-lg);
  background-color: white;
  border-radius: var(--border-radius-md);
}

.finance-tenure {
  font-size: var(--font-caption);
  color: var(--color-text-light);
  margin-bottom: 4px;
}

.finance-duration {
  font-size: var(--font-h5);
  font-weight: var(--font-bold);
  color: var(--color-primary);
  margin-bottom: 4px;
}

.finance-emi {
  font-size: var(--font-body-sm);
  color: var(--color-text-dark);
}
```

---

## ANIMATION & TRANSITIONS

```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide In from Left */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Counter Animation */
@keyframes counterUp {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Apply animations */
.fade-in {
  animation: fadeIn 0.6s ease-out;
}

.slide-up {
  animation: slideUp 0.8s ease-out;
}

.slide-in-left {
  animation: slideInLeft 0.8s ease-out;
}

.scale-in {
  animation: scaleIn 0.4s ease-out;
}

/* Hover animations */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.hover-scale {
  transition: transform 0.3s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}
```

---

## RESPONSIVE DESIGN

### Breakpoints
```css
/* Mobile First */
/* Mobile: < 640px */
/* Tablet: 640px - 1024px */
/* Desktop: > 1024px */

@media (min-width: 640px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
}

@media (max-width: 639px) {
  /* Mobile-specific overrides */
}
```

### Mobile-Friendly Components
```css
/* Hide on mobile */
@media (max-width: 768px) {
  .hide-mobile {
    display: none;
  }
}

/* Full width on mobile */
@media (max-width: 768px) {
  .btn,
  input,
  .card {
    width: 100%;
  }
}

/* Stack columns */
@media (max-width: 768px) {
  .grid-2,
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }

  .flex {
    flex-direction: column;
  }
}

/* Larger touch targets */
@media (max-width: 768px) {
  .btn {
    padding: 16px 24px;
    font-size: var(--font-body);
    min-height: 48px;
  }

  input,
  select,
  textarea {
    font-size: 16px; /* Prevents zoom on iOS */
    min-height: 48px;
  }
}
```

---

## NAVIGATION & HEADER STYLING

```css
.header {
  position: sticky;
  top: 0;
  background-color: white;
  box-shadow: var(--shadow-sm);
  z-index: 1000;
  padding: var(--spacing-md) 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding-lg);
}

.logo {
  font-size: var(--font-h4);
  font-weight: var(--font-bold);
  color: var(--color-primary);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.logo img {
  height: 40px;
  width: auto;
}

.nav {
  display: flex;
  gap: var(--spacing-2xl);
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  color: var(--color-text-dark);
  text-decoration: none;
  font-size: var(--font-body);
  font-weight: var(--font-medium);
  transition: color 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--color-primary);
}

/* Dropdown */
.nav-item {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 200px;
  padding: var(--spacing-md) 0;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  margin-top: var(--spacing-sm);
}

.nav-item:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
  margin-top: var(--spacing-md);
}

.dropdown-item {
  display: block;
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--color-text-dark);
  text-decoration: none;
  transition: all 0.3s ease;
}

.dropdown-item:hover {
  background-color: var(--color-bg-section);
  color: var(--color-primary);
}

/* Mobile Menu */
.hamburger {
  display: none;
  flex-direction: column;
  cursor: pointer;
  gap: 6px;
}

@media (max-width: 768px) {
  .hamburger {
    display: flex;
  }

  .hamburger span {
    width: 24px;
    height: 2px;
    background-color: var(--color-text-dark);
    transition: all 0.3s ease;
  }

  .nav {
    display: none;
    flex-direction: column;
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    background-color: white;
    padding: var(--spacing-2xl) var(--spacing-lg);
    box-shadow: var(--shadow-lg);
    gap: var(--spacing-lg);
  }

  .nav.active {
    display: flex;
  }
}
```

---

## FOOTER STYLING

```css
.footer {
  background-color: var(--color-bg-dark);
  color: white;
  padding: var(--spacing-5xl) var(--spacing-lg) var(--spacing-2xl);
}

.footer-content {
  max-width: var(--container-max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-3xl);
  margin-bottom: var(--spacing-3xl);
}

.footer-section h3 {
  font-size: var(--font-h5);
  margin-bottom: var(--spacing-lg);
  color: white;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section ul li {
  margin-bottom: var(--spacing-md);
}

.footer-section a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.3s ease;
  font-size: var(--font-body-sm);
}

.footer-section a:hover {
  color: white;
}

/* Social Links */
.social-links {
  display: flex;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
}

.social-link:hover {
  background-color: var(--color-primary);
}

/* Footer Bottom */
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: var(--spacing-2xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-body-sm);
}

.footer-legal {
  display: flex;
  gap: var(--spacing-2xl);
}

.footer-legal a {
  color: rgba(255, 255, 255, 0.7);
}

/* Responsive */
@media (max-width: 1024px) {
  .footer-content {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: var(--spacing-2xl);
  }

  .footer-bottom {
    flex-direction: column;
    gap: var(--spacing-lg);
    text-align: center;
  }

  .footer-legal {
    flex-direction: column;
    gap: var(--spacing-md);
  }
}
```

---

## UTILITY CLASSES

```css
/* Text Utilities */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.text-bold { font-weight: var(--font-bold); }
.text-semibold { font-weight: var(--font-semibold); }
.text-medium { font-weight: var(--font-medium); }

.text-primary { color: var(--color-primary); }
.text-dark { color: var(--color-text-dark); }
.text-light { color: var(--color-text-light); }

.text-lg { font-size: var(--font-body-lg); }
.text-sm { font-size: var(--font-body-sm); }
.text-xs { font-size: var(--font-caption); }

.line-clamp-1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Spacing Utilities */
.m-0 { margin: 0; }
.m-sm { margin: var(--spacing-sm); }
.m-md { margin: var(--spacing-md); }
.m-lg { margin: var(--spacing-lg); }

.mb-sm { margin-bottom: var(--spacing-sm); }
.mb-md { margin-bottom: var(--spacing-md); }
.mb-lg { margin-bottom: var(--spacing-lg); }

.p-0 { padding: 0; }
.p-sm { padding: var(--spacing-sm); }
.p-md { padding: var(--spacing-md); }
.p-lg { padding: var(--spacing-lg); }

/* Display Utilities */
.block { display: block; }
.inline { display: inline; }
.inline-block { display: inline-block; }
.flex { display: flex; }
.grid { display: grid; }
.hidden { display: none; }

/* Visibility */
@media (max-width: 768px) {
  .hidden-mobile { display: none; }
}

@media (min-width: 769px) {
  .hidden-desktop { display: none; }
}

/* Opacity */
.opacity-50 { opacity: 0.5; }
.opacity-75 { opacity: 0.75; }

/* Borders */
.border { border: 1px solid var(--color-border); }
.border-top { border-top: 1px solid var(--color-border); }
.border-bottom { border-bottom: 1px solid var(--color-border); }

/* Shadows */
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }

/* Rounded */
.rounded-sm { border-radius: var(--border-radius-sm); }
.rounded-md { border-radius: var(--border-radius-md); }
.rounded-lg { border-radius: var(--border-radius-lg); }
.rounded-full { border-radius: var(--border-radius-full); }
```

---

This CSS system provides a complete foundation for implementing Freyr Energy's visual design on aarnasolars.com. All values can be customized to match your brand while maintaining the proven design patterns.
